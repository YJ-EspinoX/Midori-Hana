import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { Sticker } from 'wa-sticker-formatter'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import axios from 'axios'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

export default {
  command: ['sticker', 's'],
  tag: 'sticker',
  categoria: 'utilidad',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Convierte imágenes o videos a sticker',

  async execute(sock, msg, { from }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const isQuotedImage = quoted?.imageMessage
    const isQuotedVideo = quoted?.videoMessage
    const isDirectImage = msg.message?.imageMessage
    const isDirectVideo = msg.message?.videoMessage

    const userName = msg.pushName || ''

    if (!isQuotedImage && !isDirectImage && !isQuotedVideo && !isDirectVideo) {
      return sock.sendMessage(from, {
        text: '🌸 Responde a una imagen o video para convertirlo en sticker.'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const sourceMsg = (isQuotedImage || isQuotedVideo) ? { message: quoted } : { message: msg.message }
      const buffer = await downloadMediaMessage(sourceMsg, 'buffer', {})

      const ext = (isQuotedImage || isDirectImage) ? 'jpg' : 'mp4'
      const fileName = `${Date.now()}.${ext}`
      const filePath = join(tmpdir(), fileName)
      await writeFile(filePath, buffer)

      const formData = new FormData()
      formData.append('files[]', new Blob([buffer], { type: `image/${ext === 'jpg' ? 'jpeg' : 'mp4'}` }), fileName)

      const res = await fetch('https://uguu.se/upload.php', {
        method: 'POST',
        body: formData
      })

      const json = await res.json()
      await unlink(filePath).catch(() => {})

      if (!json?.files?.[0]?.url) throw new Error('Error al subir al scraper')

      const remoteUrl = json.files[0].url
      const response = await axios.get(remoteUrl, { responseType: 'arraybuffer' })
      const finalBuffer = Buffer.from(response.data)

      // Configuración limpia: solo el autor (usuario) y sin pack name
      const stickerOptions = {
        pack: '', 
        author: userName,
        type: 'full',
        quality: 70
      }

      if (isQuotedImage || isDirectImage) {
        const sticker = new Sticker(finalBuffer, stickerOptions)
        await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg })

      } else {
        const tmpInput = join(tmpdir(), `${Date.now()}_in.mp4`)
        const tmpOutput = join(tmpdir(), `${Date.now()}_out.webp`)
        await writeFile(tmpInput, finalBuffer)

        await execFileAsync(ffmpegPath, [
          '-i', tmpInput,
          '-t', '7',
          '-vf', 'scale=320:-2:force_original_aspect_ratio=decrease,format=yuv420p',
          '-r', '15',
          '-c:v', 'libwebp',
          '-lossless', '0',
          '-q:v', '28',
          '-preset', 'default',
          '-loop', '0',
          '-an',
          '-fps_mode', 'cfr',
          '-y', tmpOutput
        ])

        const webpBuffer = await readFile(tmpOutput)
        const sticker = new Sticker(webpBuffer, stickerOptions)
        await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg })

        await unlink(tmpInput).catch(() => {})
        await unlink(tmpOutput).catch(() => {})
      }

      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch (e) {
      console.error(e)
      await sock.sendMessage(from, { text: '🌸 Hubo un error al procesar el sticker, intenta de nuevo.' }, { quoted: msg })
    }
  }
}