// plugins/unreg.js
import { getUser, isRegistered } from '../core/sqlite.js'
import db from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command: 'unreg',
  tag: 'unreg',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Elimina tu perfil del jardín',

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: '🌸 No tienes un perfil creado. Usa *.reg* para crear uno.' }, { quoted: msg })
    }

    const perfil = getUser(selfNum)

    db.pragma('foreign_keys = OFF')
    db.prepare(`DELETE FROM users WHERE user_num = ?`).run(selfNum)
    db.pragma('foreign_keys = ON')

    await sock.sendMessage(from, {
      text: `🌸 Adiós, *${perfil.nombre}*. Tu perfil fue eliminado, pero el jardín siempre tendrá un lugar para ti.`
    }, { quoted: msg })
  }
}