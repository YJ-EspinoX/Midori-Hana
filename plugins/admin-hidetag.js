import { downloadMediaMessage } from '@whiskeysockets/baileys'

export default {
  command:     ['tag', 'mention', 'mencionar', 'all', 'everyone'],
  tag:         'tag',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Menciona a todos sin hacer spam',

  async execute(sock, msg, { from, args, isAdmin, isOwner }) {
    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    try {
      const meta     = await sock.groupMetadata(from)
      const mentions = meta.participants.map(m => m.id)
      const quoted   = msg.message?.extendedTextMessage?.contextInfo

      if (quoted?.quotedMessage) {
        const qm = quoted.quotedMessage

        if (qm.imageMessage) {
          const buffer = await downloadMediaMessage({ message: qm }, 'buffer', {})
          await sock.sendMessage(from, {
            image:   buffer,
            caption: qm.imageMessage.caption || '',
            mentions
          })
          return
        }

        if (qm.videoMessage) {
          const buffer = await downloadMediaMessage({ message: qm }, 'buffer', {})
          await sock.sendMessage(from, {
            video:   buffer,
            caption: qm.videoMessage.caption || '',
            mentions
          })
          return
        }

        if (qm.stickerMessage) {
          const buffer = await downloadMediaMessage({ message: qm }, 'buffer', {})
          await sock.sendMessage(from, { sticker: buffer, mentions })
          return
        }

        const quotedText = qm.conversation
          || qm.extendedTextMessage?.text
          || qm.imageMessage?.caption
          || qm.videoMessage?.caption
          || ''

        if (quotedText) {
          await sock.sendMessage(from, { text: quotedText, mentions })
          return
        }
      }

      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const cmdEnd   = fullText.indexOf(' ')
      const texto    = cmdEnd > -1 ? fullText.slice(cmdEnd + 1) : ''

      await sock.sendMessage(from, {
        text: texto || '🌸 Hola a todos, los llamaron de su grupo favorito.',
        mentions
      })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}