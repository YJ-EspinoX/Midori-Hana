import { banUser, isBanned } from '../core/sqlite.js'

export default {
  command:   'ban',
  tag:       'ban',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Banea a un usuario de todos los grupos',

  async execute(sock, msg, { from, args }) {
    const num = args[0]?.replace(/\D/g, '')
    if (!num) {
      await sock.sendMessage(from, { text: '🌸 Dime el número que quieres banear, por favor.' }, { quoted: msg })
      return
    }
    if (isBanned(num)) {
      await sock.sendMessage(from, { text: global.messages.banAlready }, { quoted: msg })
      return
    }
    banUser(num)
    await sock.sendMessage(from, { text: global.messages.banSuccess }, { quoted: msg })
  }
}