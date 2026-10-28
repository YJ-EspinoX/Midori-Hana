// plugins/toimg.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { exec } from 'child_process'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

const TEMP_DIR = join(process.cwd(), 'temp')
if (!existsSync(TEMP_DIR)) {
  await mkdir(TEMP_DIR, { recursive: true }).catch(() => {})
}

function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err) => (err ? reject(err) : resolve()))
  })
}

const processing = new Set()

export default {
  command:   ['toimg', 'photo'],
  tag:       'toimg',
  categoria: 'utilidad',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Convierte un sticker a imagen',

  async execute(sock, msg, { from }) {
    const userId = msg.key.participant || from

    if (processing.has(userId)) {
      return sock.sendMessage(from, {
        text: '🌸 Espera un momento, aún estoy convirtiendo el sticker anterior.'
      }, { quoted: msg })
    }

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted?.stickerMessage) {
      return sock.sendMessage(from, {
        text: '🌸 Responde a un sticker para convertirlo en imagen.'
      }, { quoted: msg })
    }

    processing.add(userId)

    const tmpPath = join(TEMP_DIR, `${Date.now()}_sticker.webp`)
    const outPath = join(TEMP_DIR, `${Date.now()}_image.png`)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const buffer = await downloadMediaMessage(
        { message: quoted },
        'buffer',
        {},
        { logger: console }
      )

      await writeFile(tmpPath, buffer)

      const isAnimated = buffer.toString('ascii', 0, 200).includes('ANIM') ||
                        buffer.toString('ascii', 0, 200).includes('ANMF')

      if (isAnimated) {
        try {
          await execPromise(`ffmpeg -y -i "${tmpPath}" -vframes 1 -f image2 "${outPath}"`)
        } catch {
          const img = await sharp(buffer, { animated: true }).png().toBuffer()
          await writeFile(outPath, img)
        }
      } else {
        try {
          const pngBuffer = await sharp(buffer).png().toBuffer()
          await writeFile(outPath, pngBuffer)
        } catch {
          await execPromise(`ffmpeg -y -i "${tmpPath}" "${outPath}"`)
        }
      }

      await sock.sendMessage(from, {
        image: await readFile(outPath),
        caption: '🌸 Aquí tienes tu sticker en imagen.'
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    } finally {
      if (existsSync(tmpPath)) await unlink(tmpPath).catch(() => {})
      if (existsSync(outPath)) await unlink(outPath).catch(() => {})
      processing.delete(userId)
    }
  }
}