import { resetWarns, getWarns } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     ['delwarn', 'resetwarn'],
  tag:         'delwarn',
  categoria:   'admin',
  descripcion: 'Elimina todas las advertencias de un usuario',
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

    const advertencias = getWarns(from, num)

    if (advertencias === 0) {
      await sock.sendMessage(from, {
        text: `@${num} ni siquiera tiene advertencias... me hiciste revisar por gusto, justo como cuando me quedo buscando motivos para creer que todavía le importo. 🙄`,
        mentions: [jidFinal]
      }, { quoted: msg })
      return
    }

    resetWarns(from, num)
    await sock.sendMessage(from, {
      text: `ya le borré las advertencias a @${num}. 🤦🏽‍♀️ otra vez yo de tonta perdonando errores ajenos y dando segundas oportunidades de las que me voy a arrepentir.`,
      mentions: [jidFinal]
    }, { quoted: msg })
  }
}