export default {
  command:     ['delete', 'del', 'borrar', 'eliminar', 'rm'],
  tag:         'delete',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Elimina un mensaje del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const ctx = msg.message?.extendedTextMessage?.contextInfo
    if (!ctx?.stanzaId) {
      await sock.sendMessage(from, { text: global.messages.replyNeeded }, { quoted: msg })
      return
    }

    try {
      // 1. Eliminamos el mensaje al que respondiste
      await sock.sendMessage(from, {
        delete: {
          remoteJid:   from,
          fromMe:      false,
          id:          ctx.stanzaId,
          participant: ctx.participant
        }
      })

      // 2. Eliminamos tu comando (.delete) para no dejar rastro
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe:    msg.key.fromMe,
          id:        msg.key.id,
          participant: msg.key.participant || msg.participant
        }
      })
    } catch {
      await sock.sendMessage(from, { text: global.messages.deleteFail }, { quoted: msg })
    }
  }
}