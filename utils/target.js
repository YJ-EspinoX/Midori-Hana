import { getRealJid, cleanNumber } from './jid.js'

/**
 * Resuelve el usuario objetivo desde:
 * 1. Mensaje respondido (quoted)
 * 2. Mención (@usuario) — puede estar en varios campos según el tipo de mensaje
 * 3. Número directo en args
 *
 * Retorna { jid, num } con número real resuelto, o null.
 */
export async function resolveTarget(sock, msg, args) {
  const m   = msg.message
  const ext = m?.extendedTextMessage
  const ctx = ext?.contextInfo

  // 1. Quoted — mensaje respondido
  const quoted = ctx?.participant || ctx?.remoteJid
  if (quoted?.includes('@') && !quoted.endsWith('@g.us')) {
    const real = await getRealJid(sock, quoted, msg).catch(() => quoted)
    const num  = cleanNumber(real)
    if (num) return { jid: quoted, num }
  }

  // 2. Mención — puede estar en ctx.mentionedJid o directo en el mensaje
  const mentions = ctx?.mentionedJid
    || m?.extendedTextMessage?.contextInfo?.mentionedJid
    || []

  if (mentions.length > 0) {
    const jid  = mentions[0]
    const real = await getRealJid(sock, jid, msg).catch(() => jid)
    const num  = cleanNumber(real)
    if (num) return { jid, num }
  }

  // 3. Número en args
  const raw = args?.[0]?.replace(/\D/g, '')
  if (raw && raw.length >= 8) {
    return { jid: `${raw}@s.whatsapp.net`, num: raw }
  }

  return null
}