export default {
  command:     ['cerrar', 'close', 'bloquear', 'lock'],
  tag:         'cerrar',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Cierra el grupo para que solo admins puedan escribir',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      await sock.groupSettingUpdate(from, 'announcement')
      await sock.sendMessage(from, { text: global.messages.groupClosed }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}