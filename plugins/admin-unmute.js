import { unmuteUser } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     ['unmute', 'delmute', 'desmutear'],
  tag:         'unmute',
  categoria:   'admin',
  descripcion: 'Quita el silencio a un usuario del grupo',
  owner:       false,
  group:       true,

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, { text: global.messages.userNeeded }, { quoted: msg })
      return
    }

    const realJid  = await getRealJid(sock, target.jid, msg).catch(() => target.jid)
    const num      = cleanNumber(realJid)
    const jidFinal = `${num}@s.whatsapp.net`

    unmuteUser(from, num)
    await sock.sendMessage(from, {
      text: `ya le devolví la voz a @${num}. más le vale usarla bien y no empezar a fastidiar otra vez, que me canso rápido.`,
      mentions: [jidFinal]
    }, { quoted: msg })
  }
}