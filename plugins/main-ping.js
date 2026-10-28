// plugins/main-ping.js
function formatUptime() {
  const start = global.connectionStartTime || Date.now()
  const ms = Date.now() - start
  const d  = Math.floor(ms / 86400000)
  const h  = Math.floor((ms % 86400000) / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default {
  command:     'ping',
  tag:         'ping',
  categoria:   'main',
  descripcion: 'Muestra cuánto tiempo llevo activa',
  owner:       false,
  group:       false,
  nsfw:        false,

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })

    const texto = `Llevo activa *${formatUptime()}* sin caerme, lo cual ya es un logro considerando todo.`

    await sock.sendMessage(from, { text: texto }, { quoted: msg })
  }
}