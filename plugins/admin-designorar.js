import { unignoreUser, isIgnored, getIgnored } from '../core/sqlite.js'
import { resolveTarget }                        from '../utils/target.js'

const BULLETS = ['🐞', '📍', '🐝']

const designorar = {
  command:     ['designorar', 'unignore'],
  tag:         'unignore',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Deja de ignorar a un usuario en este grupo',

  async execute(sock, msg, { from, args, isAdmin, isOwner }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, { text: global.messages?.userNeeded }, { quoted: msg })
      return
    }

    if (!isIgnored(from, target.num)) {
      await sock.sendMessage(from, { text: global.messages?.notIgnored }, { quoted: msg })
      return
    }

    unignoreUser(from, target.num)

    const txt = global.messages?.unignoreSuccess.replace('{num}', target.num)
    await sock.sendMessage(from, {
      text: txt,
      mentions: [`${target.num}@s.whatsapp.net`]
    }, { quoted: msg })
  }
}

const ignorados = {
  command:     ['ignorados'],
  tag:         'ignorados',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Lista de usuarios ignorados en este grupo',

  async execute(sock, msg, { from, isAdmin, isOwner }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    try {
      const lista = getIgnored(from)

      if (lista.length === 0) {
        await sock.sendMessage(from, { text: global.messages?.noIgnoredUsers }, { quoted: msg })
        return
      }

      const mentions = []
      let txt = `> ${global.messages?.ignoredTitle || 'IGNORADOS'}\n\n`

      lista.forEach((u) => {
        const jid = `${u}@s.whatsapp.net`
        mentions.push(jid)
        const bullet = BULLETS[Math.floor(Math.random() * BULLETS.length)]
        txt += `│ ${bullet} @${u}\n`
      })

      txt += `\n✦ *Total* · ${lista.length} usuario(s)`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}

export default [designorar, ignorados]