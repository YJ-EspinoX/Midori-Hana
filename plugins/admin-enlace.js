export default {
  command:     ['link', 'enlace', 'invite', 'invitacion'],
  tag:         'link',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Muestra el enlace de invitación del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const code = await sock.groupInviteCode(from)
      const txt = `Aquí tienes el enlace, compártelo con cuidado:\nhttps://chat.whatsapp.com/${code}`
      await sock.sendMessage(from, { text: txt }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}