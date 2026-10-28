import db from '../core/sqlite.js'
import { cleanNumber } from '../utils/jid.js'

const _getActive = db.prepare(`
  SELECT user FROM activity
  WHERE group_id = ? AND msgs > 0
`)

const BULLETS = ['🐞', '📍', '🐝']

export default {
  command:     ['fantasmas', 'inactivos', 'silenciosos', 'mudos'],
  tag:         'fantasmas',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Detecta y lista los miembros inactivos del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const meta    = await sock.groupMetadata(from)
      const members = meta.participants
      const total   = members.length

      const miembros = members.map(p => {
        let num = cleanNumber(p.id)

        if (p.id.endsWith('@lid') || num.length > 13) {
          const cached = global.lidCache?.get(p.id)
          if (cached) num = cleanNumber(cached)
        }

        if (p.phoneNumber) {
          const fromPhone = cleanNumber(p.phoneNumber)
          if (fromPhone.length >= 8) num = fromPhone
        }

        return { jid: p.id, num, admin: p.admin }
      }).filter(m => m.num && m.num.length >= 8 && m.num.length <= 15)

      const activos   = new Set(_getActive.all(from).map(r => r.user))
      const fantasmas = miembros.filter(m => !activos.has(m.num) && !m.admin)

      if (!fantasmas.length) {
        await sock.sendMessage(from, { text: 'No encontré fantasmas por aquí, todos han participado al menos una vez.' }, { quoted: msg })
        return
      }

      const mentions = []
      let txt = `> FANTASMAS\n\n`

      fantasmas.forEach(m => {
        const jid = `${m.num}@s.whatsapp.net`
        mentions.push(jid)
        const bullet = BULLETS[Math.floor(Math.random() * BULLETS.length)]
        txt += `│ ${bullet} @${m.num}\n`
      })

      txt += `\n✦ *Inactivos* · ${fantasmas.length} de ${total} miembros`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch (err) {
      console.error('[fantasmas]', err.message)
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}