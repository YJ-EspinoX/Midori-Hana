// plugins/tovideo.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import sharp from 'sharp'

ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobeStatic.path)

const writeFileAsync = promisify(fs.writeFile)
const unlinkAsync = promisify(fs.unlink)

const TEMP_DIR = path.join(process.cwd(), 'tmp', 'tovideo')
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

const processing = new Set()

export default {
  command:   ['tovideo', 'togif'],
  tag:       'tovideo',
  categoria: 'utilidad',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Convierte un sticker a video',

  async execute(sock, msg, { from }) {
    const userId = msg.key.participant || from

    if (processing.has(userId)) {
      return sock.sendMessage(from, {
        text: '🌸 Espera un momento, aún estoy procesando el sticker anterior.'
      }, { quoted: msg })
    }

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const messageToDownload = quoted ? quoted : msg.message

    if (!messageToDownload?.stickerMessage?.isAnimated) {
      return sock.sendMessage(from, {
        text: '🌸 Responde a un sticker animado para convertirlo en video.'
      }, { quoted: msg })
    }

    processing.add(userId)

    let tempFiles = []
    let framesDir = path.join(TEMP_DIR, `frames_${Date.now()}`)

    try {
      await sock.sendMessage(from, { react: { text: '🎬', key: msg.key } })

      const buffer = await downloadMediaMessage(
        { message: messageToDownload },
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      )

      if (!buffer) throw new Error('Error al descargar')

      const inputPath = path.join(TEMP_DIR, `in_${Date.now()}.webp`)
      const outputPath = path.join(TEMP_DIR, `out_${Date.now()}.mp4`)
      tempFiles.push(inputPath, outputPath)

      if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true })
      await writeFileAsync(inputPath, buffer)

      const metadata = await sharp(inputPath).metadata()
      const { width, height, pages, delay } = metadata

      const finalWidth = width % 2 === 0 ? width : width + 1
      const finalHeight = height % 2 === 0 ? height : height + 1

      for (let i = 0; i < pages; i++) {
        await sharp(inputPath, { page: i })
          .png()
          .toFile(path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`))
      }

      const avgDelay = Array.isArray(delay) ? (delay.reduce((a, b) => a + b, 0) / delay.length) : (delay || 100)
      const fps = Math.round(1000 / avgDelay) || 10

      await new Promise((resolve, reject) => {
        ffmpeg(path.join(framesDir, 'frame_%04d.png'))
          .inputOptions(['-framerate', String(fps)])
          .outputOptions([
            '-pix_fmt yuv420p',
            '-c:v libx264',
            '-preset ultrafast',
            '-vf', `scale=${finalWidth}:${finalHeight}:force_original_aspect_ratio=decrease,pad=${finalWidth}:${finalHeight}:(ow-iw)/2:(oh-ih)/2:black`,
            '-an'
          ])
          .toFormat('mp4')
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath)
      })

      const resultBuffer = fs.readFileSync(outputPath)

      await sock.sendMessage(from, {
        video: resultBuffer,
        caption: '🌸 Tu sticker animado convertido en video.'
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    } finally {
      for (let file of tempFiles) {
        try { if (fs.existsSync(file)) await unlinkAsync(file) } catch {}
      }
      try {
        if (fs.existsSync(framesDir)) {
          const files = fs.readdirSync(framesDir)
          for (const file of files) await unlinkAsync(path.join(framesDir, file))
          fs.rmdirSync(framesDir)
        }
      } catch {}
      processing.delete(userId)
    }
  }
}