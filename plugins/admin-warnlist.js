import db from '../core/sqlite.js'

const _getWarns = db.prepare(`SELECT user, count FROM warns WHERE group_id = ? AND count > 0 ORDER BY count DESC`)

export default {
  command:     ['warnlist', 'avisos', 'advertencias', 'listaavisos', 'warns'],
  tag:         'warnlist',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Muestra la lista de usuarios con advertencias activas',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const lista = _getWarns.all(from)

    if (!lista.length) {
      await sock.sendMessage(from, {
        text: 'el grupo está limpio, nadie tiene advertencias. ojalá mi historial amoroso estuviera así de impecable y libre de errores.'
      }, { quoted: msg })
      return
    }

    const mentions = lista.map(r => `${r.user}@s.whatsapp.net`)

    let txt = `> usuarios advertidos:\n\n`

    lista.forEach(r => {
      const emojis = '🔴'.repeat(Math.min(r.count, 3)) + '⚪'.repeat(Math.max(0, 3 - r.count))
      txt += `│ @${r.user} [${emojis}] ${r.count}/3\n`
    })

    txt += `\nal menos a ellos los tienen vigilados en la lista, a mí me dejaron libre y terminé con el corazón roto.`

    await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
  }
}