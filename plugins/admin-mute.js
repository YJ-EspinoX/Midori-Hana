import { muteUser } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     ['mute', 'silenciar', 'callar', 'mutear'],
  tag:         'mute',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Silencia a un usuario del grupo',

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

    muteUser(from, num)
    
    await sock.sendMessage(from, {
      text: global.messages.muteSuccess,
      mentions: [jidFinal]
    }, { quoted: msg })
  }
}