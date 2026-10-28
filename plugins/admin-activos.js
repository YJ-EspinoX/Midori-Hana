import { cleanNumber } from '../utils/jid.js'
import db            from '../core/sqlite.js'

const _getActivity = db.prepare(`
  SELECT user, msgs FROM activity
  WHERE group_id = ? AND msgs > 0
  ORDER BY msgs DESC
`)

const BULLETS = ['🐞', '📍', '🐝']

export default {
  command:     ['contador', 'cont'],
  tag:         'contador',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Muestra el ranking de los miembros más activos del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const lista = _getActivity.all(from)

      if (!lista.length) {
        await sock.sendMessage(from, { text: 'Aún no hay actividad registrada en este grupo.' }, { quoted: msg })
        return
      }

      const meta    = await sock.groupMetadata(from)
      const members = meta.participants

      const numToJid = {}
      members.forEach(m => {
        const num = cleanNumber(m.id)
        numToJid[num] = m.id
      })

      const mentions = []
      let txt = `> miembros más activos y su cantidad de mensajes enviados:\n\n`
      
      // Selecciona un único emoji para todo este uso del comando
      const chosenBullet = BULLETS[Math.floor(Math.random() * BULLETS.length)]

      lista.forEach((r) => {
        const jid = numToJid[r.user] || `${r.user}@s.whatsapp.net`
        mentions.push(jid)
        txt += `│ ${chosenBullet} @${r.user} · *${r.msgs} msg*\n`
      })

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}