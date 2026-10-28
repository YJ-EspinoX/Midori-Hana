// plugins/wm.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

export default {
  command:   ['wm', 'take'],
  tag:       'wm',
  categoria: 'utilidad',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Agrega descripcion a stickers',

  async execute(sock, msg, { from, args }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const messageToDownload = quoted?.stickerMessage ? quoted : null

    if (!messageToDownload) {
      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })
      await sock.sendMessage(from, { text: '🌸 Responde a un sticker para ponerle tu firma.' }, { quoted: msg })
      return
    }

    let pack = ''
    let author = ''

    if (args.length > 0) {
      const input = args.join(' ').split(/\s*[\/|]\s*/)
      if (input.length > 1) {
        pack = input[0]
        author = input[1]
      } else {
        author = args.join(' ')
        pack = ''
      }
    } else {
      author = msg.pushName || ''
      pack = ''
    }

    await sock.sendMessage(from, { react: { text: '🎨', key: msg.key } })

    try {
      const buffer = await downloadMediaMessage(
        { message: messageToDownload },
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      )

      if (!buffer) throw new Error('Error al descargar')

      const newSticker = new Sticker(buffer, {
        pack: pack,
        author: author,
        type: StickerTypes.FULL,
        categories: ['🤩', '🎉'],
        id: msg.id,
        quality: 75
      })

      const stickerBuffer = await newSticker.toBuffer()

      await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg })
      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}