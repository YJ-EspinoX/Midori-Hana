export default {
  command:   'salir',
  tag:       'salir',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Hace que el bot salga de un grupo',

  async execute(sock, msg, { from, args, isGroup }) {
    const groupId = args[0] || (isGroup ? from : null)
    if (!groupId) {
      await sock.sendMessage(from, { text: '👥 Úsalo dentro de un grupo o especifica el ID.' }, { quoted: msg })
      return
    }
    try {
      await sock.sendMessage(groupId, { text: global.messages.leftGroup })
      await sock.groupLeave(groupId)
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}