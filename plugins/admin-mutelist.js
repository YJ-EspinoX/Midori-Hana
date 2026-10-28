import db         from '../core/sqlite.js'

const _getMuted = db.prepare(`SELECT user FROM mutes WHERE group_id = ? ORDER BY muted_at DESC`)

const BULLETS = ['🐞', '📍', '🐝']

export default {
  command:     ['mutelist', 'silenciados','muteados'],
  tag:         'mutelist',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Muestra la lista de usuarios silenciados',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const lista = _getMuted.all(from)

    if (!lista.length) {
      await sock.sendMessage(from, { text: 'No hay nadie silenciado por ahora.' }, { quoted: msg })
      return
    }

    const mentions = []
    let txt = `> usuarios silenciados que no pueden enviar mensajes en el grupo:\n\n`
    
    // Selecciona un único emoji para todo este uso del comando
    const chosenBullet = BULLETS[Math.floor(Math.random() * BULLETS.length)]

    lista.forEach((r) => {
      const jid = `${r.user}@s.whatsapp.net`
      mentions.push(jid)
      txt += `│ ${chosenBullet} @${r.user}\n`
    })

    await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
  }
}