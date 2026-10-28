export default {
  command:     ['abrir', 'open', 'aperturar', 'desbloquear', 'unlock'],
  tag:         'abrir (abre grupo)',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Abre el grupo para que cualquiera pueda escribir',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      await sock.groupSettingUpdate(from, 'not_announcement')
      await sock.sendMessage(from, { text: global.messages.groupOpened }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}