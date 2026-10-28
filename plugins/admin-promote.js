import { resolveTarget } from '../utils/target.js'

export default {
  command:     ['promote', 'ascender', 'subir', 'haceradmin', 'daradmin'],
  tag:         'promote',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Asciende a un miembro a administrador',

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
      await sock.groupParticipantsUpdate(from, [target.jid], 'promote')
      
      const jidFinal = `${target.num}@s.whatsapp.net`
      await sock.sendMessage(from, {
        text: `@${target.num} ahora es administrador del grupo.`,
        mentions: [jidFinal]
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}