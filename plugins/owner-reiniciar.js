export default {
  command:   'reiniciar',
  tag:       'reiniciar',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Reinicia el bot',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { text: global.messages.botRestart }, { quoted: msg })
    setTimeout(() => process.exit(1), 1500)
  }
}