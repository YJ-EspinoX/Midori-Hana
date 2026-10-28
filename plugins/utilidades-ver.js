// plugins/ver.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'

export default {
  command:   ['ver', 'view'],
  tag:       'ver',
  categoria: 'utilidad',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Muestra mensajes de vista única',

  async execute(sock, msg, { from }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const quotedKey = msg.message?.extendedTextMessage?.contextInfo

    if (!quoted) {
      await sock.sendMessage(from, { react: { text: '👀', key: msg.key } })
      await sock.sendMessage(from, { text: '🌸 Responde al mensaje que quieres ver.' }, { quoted: msg })
      return
    }

    try {
      const inner =
        quoted.viewOnceMessage?.message ||
        quoted.viewOnceMessageV2?.message ||
        quoted.viewOnceMessageV2Extension?.message ||
        quoted

      const imageMsg = inner.imageMessage
      const videoMsg = inner.videoMessage
      const audioMsg = inner.audioMessage
      const stickerMsg = inner.stickerMessage
      const docMsg = inner.documentMessage
      const textMsg = inner.conversation || inner.extendedTextMessage?.text

      if (textMsg && !imageMsg && !videoMsg && !audioMsg && !stickerMsg && !docMsg) {
        await sock.sendMessage(from, { text: textMsg }, { quoted: msg })
        return
      }

      const msgToDownload = {
        key: {
          remoteJid: from,
          id: quotedKey.stanzaId,
          participant: quotedKey.participant
        },
        message: inner
      }

      const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {})

      if (imageMsg) {
        await sock.sendMessage(from, {
          image: buffer,
          caption: imageMsg.caption || ''
        }, { quoted: msg })

      } else if (videoMsg) {
        await sock.sendMessage(from, {
          video: buffer,
          caption: videoMsg.caption || '',
          mimetype: videoMsg.mimetype || 'video/mp4'
        }, { quoted: msg })

      } else if (audioMsg) {
        await sock.sendMessage(from, {
          audio: buffer,
          mimetype: audioMsg.mimetype || 'audio/mpeg',
          ptt: audioMsg.ptt || false
        }, { quoted: msg })

      } else if (stickerMsg) {
        await sock.sendMessage(from, {
          sticker: buffer
        }, { quoted: msg })

      } else if (docMsg) {
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: docMsg.mimetype,
          fileName: docMsg.fileName || 'archivo'
        }, { quoted: msg })

      } else {
        await sock.sendMessage(from, { text: '🌸 No pude revelar este tipo de mensaje.' }, { quoted: msg })
      }

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}