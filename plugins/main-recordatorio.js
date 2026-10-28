// plugins/recordar.js

import Database from 'better-sqlite3'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const db = new Database('./midori.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    user_num TEXT NOT NULL,
    user_jid TEXT NOT NULL,
    message TEXT NOT NULL,
    remind_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    notified INTEGER DEFAULT 0
  );
`)

const _insert = db.prepare(`INSERT INTO reminders (group_id, user_num, user_jid, message, remind_at) VALUES (?,?,?,?,?)`)
const _markNotified = db.prepare(`UPDATE reminders SET notified = 1 WHERE id = ?`)

let intervalId = null

export function startReminderChecker(sock) {
  if (intervalId) clearInterval(intervalId)
  
  intervalId = setInterval(async () => {
    try {
      const pending = db.prepare(`SELECT * FROM reminders WHERE notified = 0 AND remind_at <= unixepoch()`).all()

      for (const r of pending) {
        try {
          await sock.sendMessage(r.group_id, {
            text: `🌸 Holaaa, @${r.user_num} me pidió que les recordara lo siguiente:\n\n${r.message}`,
            mentions: [`${r.user_num}@s.whatsapp.net`]
          })

          try {
            await sock.sendMessage(r.user_jid, {
              text: `🌸 Tu recordatorio:\n\n${r.message}`
            })
          } catch {}

          _markNotified.run(r.id)
        } catch {}
      }
    } catch {}
  }, 5000)
}

function parseTime(str) {
  const match = str.match(/^(\d+)\s*(s|m|h|d)$/i)
  if (!match) return null
  const num = parseInt(match[1])
  const unit = match[2].toLowerCase()
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 }
  return num * multipliers[unit]
}

function formatTiempo(segundos) {
  if (segundos < 60) return `${segundos} segundos`
  if (segundos < 3600) return `${Math.floor(segundos / 60)} minutos`
  if (segundos < 86400) return `${Math.floor(segundos / 3600)} horas`
  return `${Math.floor(segundos / 86400)} días`
}

export default {
  command: ['recordar', 'remind'],
  tag: 'recordar',
  categoria: 'utilidad',
  owner: false,
  group: true,
  nsfw: false,
  descripcion: 'Crea un recordatorio para todo el grupo',

  async execute(sock, msg, { from, args, sender }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: `🌸 *Uso:* .recordar <tiempo> <mensaje>\n\n*Formatos:* 30s, 5m, 2h, 1d\n*Ejemplo:* .recordar 10m Reunión del equipo\n*Límites:* mínimo 10s, máximo 7d`
      }, { quoted: msg })
    }

    const timeStr = args[0]
    const seconds = parseTime(timeStr)
    
    if (!seconds) {
      return sock.sendMessage(from, {
        text: `🌸 Tiempo inválido. Usa: 30s, 5m, 2h o 1d`
      }, { quoted: msg })
    }

    if (seconds < 10) {
      return sock.sendMessage(from, {
        text: `🌸 Mínimo 10 segundos, corazón.`
      }, { quoted: msg })
    }

    if (seconds > 604800) {
      return sock.sendMessage(from, {
        text: `🌸 Máximo 7 días, no seas exagerado 🌸`
      }, { quoted: msg })
    }

    const message = args.slice(1).join(' ')
    if (!message) {
      return sock.sendMessage(from, {
        text: `🌸 Escribe algo para recordar, por fis 🌸`
      }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const userNum = cleanNumber(selfJid)
    const remindAt = Math.floor(Date.now() / 1000) + seconds

    _insert.run(from, userNum, selfJid, message, remindAt)

    const tiempoTexto = formatTiempo(seconds)

    await sock.sendMessage(from, {
      text: `🌸 Listo, les recordaré *"${message}"* en ${tiempoTexto}. Etiquetaré a @${userNum} cuando llegue el momento ✨`,
      mentions: [`${userNum}@s.whatsapp.net`]
    }, { quoted: msg })
  }
}