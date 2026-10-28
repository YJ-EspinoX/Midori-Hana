import { unbanUser, isBanned } from '../core/sqlite.js'

export default {
  command:   'unban',
  tag:       'unban',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Desbanea a un usuario',

  async execute(sock, msg, { from, args }) {
    const num = args[0]?.replace(/\D/g, '')
    if (!num) {
      await sock.sendMessage(from, { text: '✅ Uso: *.unban <número>*' }, { quoted: msg })
      return
    }
    if (!isBanned(num)) {
      await sock.sendMessage(from, { text: global.messages.unbanNotFound }, { quoted: msg })
      return
    }
    unbanUser(num)
    await sock.sendMessage(from, { text: global.messages.unbanSuccess }, { quoted: msg })
  }
}