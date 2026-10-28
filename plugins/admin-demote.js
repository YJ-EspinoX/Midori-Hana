import { resolveTarget } from '../utils/target.js'

export default {
  command:     ['demote', 'quitaradmin', 'sacaradmin', 'degradar'],
  tag:         'demote',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Quita el rango de admin a un miembro',

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

    try {
      await sock.groupParticipantsUpdate(from, [target.jid], 'demote')
      
      const txt = global.messages.demoteSuccess.replace('{num}', target.num)
      await sock.sendMessage(from, {
        text: txt,
        mentions: [target.jid]
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}