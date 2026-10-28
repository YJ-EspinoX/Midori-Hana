import { cleanNumber } from '../utils/jid.js'

export default {
  command:     ['admins', 'administradores', 'staff', 'mods', 'moderadores'],
  tag:         'admins',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Muestra la lista de administradores del grupo',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    try {
      const meta     = await sock.groupMetadata(from)
      const admins   = meta.participants.filter(p => p.admin)
      const mentions = admins.map(a => a.id)

      let txt = `> lista de administradores:\n\n`

      admins.forEach(a => {
        const num = cleanNumber(a.id)
        const rol = a.admin === 'superadmin' ? 'creador' : 'admin'
        txt += `│ 👑 @${num} · *${rol}*\n`
      })

      txt += `\nmás les vale mantener el orden, porque ya tengo suficientes problemas emocionales.`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}