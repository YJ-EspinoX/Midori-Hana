// ─── Anti-spam tracker ───────────────────────────────────────────────────────
// Estado propio e independiente, limpieza automática cada minuto

const _map = new Map()

setInterval(() => {
  const now = Date.now()
  for (const [key, s] of _map) {
    if (now - s.ts > (global.bot?.spamTime || 60_000)) _map.delete(key)
  }
}, 60_000)

/**
 * Registra un uso y retorna si el usuario está bloqueado por spam.
 * @returns {{ blocked: boolean, secsLeft: number }}
 */
export function checkSpam(sender) {
  const bot  = global.bot || {}
  const limit = bot.spamLimit || 10
  const time  = bot.spamTime  || 60_000
  const now   = Date.now()

  let s = _map.get(sender)
  if (!s || now - s.ts > time) s = { count: 0, ts: now }
  s.count++
  _map.set(sender, s)

  if (s.count > limit) {
    return { blocked: true, secsLeft: Math.ceil((time - (now - s.ts)) / 1000) }
  }
  return { blocked: false, secsLeft: 0 }
}