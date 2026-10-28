//utils/helpers.js

import chalk from 'chalk'

// ─── Logger ──────────────────────────────────────────────────────────────────
//   Una línea por evento:  hora 12h · etiqueta · quién · qué
//   Sin emojis ni símbolos de ancho variable, sin gris (se pierde en muchos temas)
//   y se adapta al ancho de la terminal recortando el texto con "…".

const time = () => {
  const d = new Date()
  const h = d.getHours()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(h % 12 || 12)}:${p(d.getMinutes())}:${p(d.getSeconds())} ${h < 12 ? 'AM' : 'PM'}`
}

// Quita saltos de línea, secuencias de escape y marcas de dirección que desordenan la consola
const limpiar = (t) => String(t ?? '')
  .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

// Recorta por caracteres reales (no parte un emoji por la mitad)
const recortar = (t, max) => {
  const a = Array.from(t)
  return a.length > max ? a.slice(0, Math.max(1, max - 1)).join('') + '…' : t
}

const COLOR = {
  CMD: chalk.bold.cyan,
  MSG: chalk.bold.magenta,
  SYS: chalk.bold.green,
  WRN: chalk.bold.yellow,
  ERR: chalk.bold.red
}

// CMD y MSG: hora · etiqueta · número · contenido (recortado al ancho disponible)
function filaUsuario(tag, quien, texto) {
  const cols   = process.stdout.columns || 100
  const num    = limpiar(quien) || '?'
  const ancho  = cols < 60 ? num.length : Math.max(15, num.length)
  const usado  = 11 + 2 + 3 + 2 + ancho + 2
  const cuerpo = recortar(limpiar(texto), Math.max(10, cols - usado - 1))
  console.log(`${chalk.white(time())}  ${COLOR[tag](tag)}  ${chalk.white(num.padEnd(ancho))}  ${cuerpo}`)
}

// SYS, WRN y ERR: hora · etiqueta · módulo · detalle (sin recortar, no se debe perder información)
function filaSistema(tag, label, msg) {
  console.log(`${chalk.white(time())}  ${COLOR[tag](tag)}  ${chalk.bold(label)} · ${msg}`)
}

export const logger = {
  info:  (label, msg) => filaSistema('SYS', label, msg),
  warn:  (label, msg) => filaSistema('WRN', label, msg),
  error: (label, err) => filaSistema('ERR', label, err?.message || err),
  cmd:   (sender, text) => filaUsuario('CMD', sender, text),
  msg:   (sender, text) => { if (global.features?.logMsg !== false) filaUsuario('MSG', sender, text) },
  banner: () => {
    console.log(chalk.green('\n' + caja([`${global.bot?.name || 'Bot'}  v${global.bot?.version || '1.0.0'}`])))
  }
}

// ─── Caja de texto que se ajusta sola al contenido ───────────────────────────

export function caja(lineas) {
  const ancho  = Math.max(30, ...lineas.map(l => l.length + 8))
  const centra = (t) => {
    const izq = Math.floor((ancho - t.length) / 2)
    return `  │${' '.repeat(izq)}${t}${' '.repeat(ancho - t.length - izq)}│`
  }
  const vacia = `  │${' '.repeat(ancho)}│`
  return [`  ╭${'─'.repeat(ancho)}╮`, vacia, ...lineas.map(centra), vacia, `  ╰${'─'.repeat(ancho)}╯`].join('\n')
}

// ─── Delay anti-baneo ────────────────────────────────────────────────────────

export const delay = (min = global.bot?.minDelay ?? 300, max = global.bot?.maxDelay ?? 900) =>
  new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min))

// ─── Fuentes Unicode ─────────────────────────────────────────────────────────

const MONO_MAP = {
  A:'𝙰',B:'𝙱',C:'𝙲',D:'𝙳',E:'𝙴',F:'𝙵',G:'𝙶',H:'𝙷',I:'𝙸',J:'𝙹',K:'𝙺',L:'𝙻',M:'𝙼',N:'𝙽',O:'𝙾',P:'𝙿',Q:'𝚀',R:'𝚁',S:'𝚂',T:'𝚃',U:'𝚄',V:'𝚅',W:'𝚆',X:'𝚇',Y:'𝚈',Z:'𝚉',
  a:'𝚊',b:'𝚋',c:'𝚌',d:'𝚍',e:'𝚎',f:'𝚏',g:'𝚐',h:'𝚑',i:'𝚒',j:'𝚓',k:'𝚔',l:'𝚕',m:'𝚖',n:'𝚗',o:'𝚘',p:'𝚙',q:'𝚚',r:'𝚛',s:'𝚜',t:'𝚝',u:'𝚞',v:'𝚟',w:'𝚠',x:'𝚡',y:'𝚢',z:'𝚣',
  0:'𝟶',1:'𝟷',2:'𝟸',3:'𝟹',4:'𝟺',5:'𝟻',6:'𝟼',7:'𝟽',8:'𝟾',9:'𝟿','.':"․",' ':' '
}

const BOLD_MAP = {
  A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
  a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
  ' ':' '
}

export const toMono = (text) => text.split('').map(c => MONO_MAP[c] || c).join('')
export const toBold = (text) => text.split('').map(c => BOLD_MAP[c] || c).join('')

// ─── Formatear tiempo de cooldown ────────────────────────────────────────────

export function formatCooldown(segundos) {
  if (segundos < 60)  return `${segundos}s`
  if (segundos < 3600) return `${Math.floor(segundos / 60)}m ${segundos % 60}s`
  return `${Math.floor(segundos / 3600)}h ${Math.floor((segundos % 3600) / 60)}m`
}

// ─── AutoBio ─────────────────────────────────────────────────────────────────

export function startAutoBio(sock) {
  if (!global.features?.autoBio) return
  const update = () => {
    const h = new Date().getHours()
    const estado = h >= 6 && h < 12 ? '🌅 Buenos días'
                 : h >= 12 && h < 18 ? '☀️ Buenas tardes'
                 : h >= 18 && h < 22 ? '🌙 Buenas noches'
                 : '🌌 En la madrugada'
    sock.updateProfileStatus(`${estado} | ${global.bot?.name}`).catch(() => {})
  }
  update()
  setInterval(update, 30 * 60 * 1000)
}