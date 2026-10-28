import { addWarn, resetWarns } from '../core/sqlite.js'
import { resolveTarget }       from '../utils/target.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     ['warn', 'advertencia'],
  tag:         'warn',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Advierte a un usuario del grupo',

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
    const count    = addWarn(from, num)

    const emojis = '🔴'.repeat(Math.min(count, 3)) + '⚪'.repeat(Math.max(0, 3 - count))

    if (count === 1) {
      await sock.sendMessage(from, {
        text: `@${num} [${emojis}] advertencia 1/3. compórtate, que no tengo la estabilidad emocional para aguantar tus berrinches. 🤦🏽‍♀️`,
        mentions: [jidFinal]
      }, { quoted: msg })
    } 
    else if (count === 2) {
      await sock.sendMessage(from, {
        text: `@${num} [${emojis}] advertencia 2/3. estás a un solo error de perderlo todo. ya me ilusioné una vez y no voy a dejar que me vuelvan a ver la cara de tonta. 🤦🏽‍♀️`,
        mentions: [jidFinal]
      }, { quoted: msg })
    } 
    else {
      await sock.sendMessage(from, {
        text: `@${num} acumulaste 3 advertencias. te di mil oportunidades y me pagaste igual que mi ex, te vas en 5 segundos.`,
        mentions: [jidFinal]
      }, { quoted: msg })

      setTimeout(async () => {
        try {
          await sock.groupParticipantsUpdate(from, [jidFinal], 'remove')
          resetWarns(from, num)
        } catch {}
      }, 5000)
    }
  }
}