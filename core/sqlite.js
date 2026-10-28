import Database from 'better-sqlite3'
import { logger } from '../utils/helpers.js'

const db = new Database('./midori.db')
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    group_id    TEXT PRIMARY KEY,
    name        TEXT DEFAULT '',
    antiLink    INTEGER DEFAULT 0,
    adminMode   INTEGER DEFAULT 0,
    nsfw        INTEGER DEFAULT 0,
    updated_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS warns (
    group_id TEXT,
    user     TEXT,
    count    INTEGER DEFAULT 0,
    PRIMARY KEY (group_id, user)
  );

  CREATE TABLE IF NOT EXISTS mutes (
    group_id TEXT,
    user     TEXT,
    muted_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (group_id, user)
  );

  CREATE TABLE IF NOT EXISTS ignored (
    group_id TEXT,
    user     TEXT,
    PRIMARY KEY (group_id, user)
  );

  CREATE TABLE IF NOT EXISTS activity (
    group_id  TEXT,
    user      TEXT,
    msgs      INTEGER DEFAULT 0,
    last_seen INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (group_id, user)
  );

  CREATE TABLE IF NOT EXISTS msg_history (
    group_id TEXT,
    msg_id   TEXT,
    sender   TEXT,
    sent_at  INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (group_id, msg_id)
  );

  CREATE TABLE IF NOT EXISTS banned (
    user      TEXT PRIMARY KEY,
    banned_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS users (
    user_num      TEXT PRIMARY KEY,
    nombre        TEXT DEFAULT '',
    edad          INTEGER DEFAULT 0,
    frase         TEXT DEFAULT '',
    animal        TEXT DEFAULT '',
    foto          TEXT DEFAULT '',
    kryons        INTEGER DEFAULT 0,
    banco         INTEGER DEFAULT 0,
    petalos       INTEGER DEFAULT 0,
    xp            INTEGER DEFAULT 0,
    registered_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS cooldowns (
    user_num TEXT,
    clave    TEXT,
    hasta    INTEGER,
    PRIMARY KEY (user_num, clave)
  );

  CREATE TABLE IF NOT EXISTS contadores_dia (
    user_num TEXT,
    dia      TEXT,
    clave    TEXT,
    valor    INTEGER DEFAULT 0,
    PRIMARY KEY (user_num, dia, clave)
  );

  CREATE TABLE IF NOT EXISTS economia_stats (
    dia        TEXT PRIMARY KEY,
    creados    INTEGER DEFAULT 0,
    destruidos INTEGER DEFAULT 0
  );
`)

// ─── Migraciones seguras ──────────────────────────────────────────────────────

try { db.exec(`ALTER TABLE groups ADD COLUMN prefix TEXT DEFAULT ''`) }        catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN antiToxic INTEGER DEFAULT 1`) }   catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN detect INTEGER DEFAULT 0`) }      catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN saludos INTEGER DEFAULT 0`) }     catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN economia INTEGER DEFAULT 1`) }    catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN ultimo_saludo_manana INTEGER DEFAULT 0`) } catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN ultimo_saludo_tarde INTEGER DEFAULT 0`) }  catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN ultimo_saludo_noche INTEGER DEFAULT 0`) }  catch {}

// Por si la base ya existía sin las columnas de economía
for (const col of ['banco', 'petalos', 'xp']) {
  try { db.exec(`ALTER TABLE users ADD COLUMN ${col} INTEGER DEFAULT 0`) } catch {}
}

db.exec(`CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC)`)

logger.info('SQLite', 'Base de datos lista ✦')

// ─── Groups ───────────────────────────────────────────────────────────────────

const _getGroup    = db.prepare(`SELECT * FROM groups WHERE group_id = ?`)
const _insertGroup = db.prepare(`INSERT OR IGNORE INTO groups (group_id) VALUES (?)`)
const _patchGroup  = (col) => db.prepare(`UPDATE groups SET ${col} = ?, updated_at = unixepoch() WHERE group_id = ?`)

export function getGroup(groupId) {
  _insertGroup.run(groupId)
  return _getGroup.get(groupId)
}
export function setGroupField(groupId, field, value) {
  _insertGroup.run(groupId)
  _patchGroup(field).run(value, groupId)
}
export function updateGroupName(groupId, name) {
  setGroupField(groupId, 'name', name)
}

const _getGroupsWithSaludos  = db.prepare(`SELECT * FROM groups WHERE saludos = 1`)
const _setSaludoTs           = (col) => db.prepare(`UPDATE groups SET ${col} = ? WHERE group_id = ?`)

export function getGroupsWithSaludos() {
  return _getGroupsWithSaludos.all()
}
export function setSaludoTimestamp(groupId, tipo) {
  const col = `ultimo_saludo_${tipo}`
  _setSaludoTs(col).run(Math.floor(Date.now() / 1000), groupId)
}

// ─── Warns ────────────────────────────────────────────────────────────────────

const _getWarns   = db.prepare(`SELECT count FROM warns WHERE group_id = ? AND user = ?`)
const _addWarn    = db.prepare(`INSERT INTO warns (group_id, user, count) VALUES (?,?,1) ON CONFLICT(group_id,user) DO UPDATE SET count = count + 1`)
const _resetWarns = db.prepare(`DELETE FROM warns WHERE group_id = ? AND user = ?`)

export function getWarns(groupId, user)   { return _getWarns.get(groupId, user)?.count || 0 }
export function addWarn(groupId, user)    { _addWarn.run(groupId, user); return getWarns(groupId, user) }
export function resetWarns(groupId, user) { _resetWarns.run(groupId, user) }

// ─── Mutes ────────────────────────────────────────────────────────────────────

const _mute    = db.prepare(`INSERT OR IGNORE INTO mutes (group_id, user) VALUES (?,?)`)
const _unmute  = db.prepare(`DELETE FROM mutes WHERE group_id = ? AND user = ?`)
const _isMuted = db.prepare(`SELECT 1 FROM mutes WHERE group_id = ? AND user = ?`)

export function muteUser(groupId, user)   { _mute.run(groupId, user) }
export function unmuteUser(groupId, user) { _unmute.run(groupId, user) }
export function isMuted(groupId, user)    { return !!_isMuted.get(groupId, user) }

// ─── Activity ─────────────────────────────────────────────────────────────────

const _trackActivity  = db.prepare(`
  INSERT INTO activity (group_id, user, msgs, last_seen) VALUES (?,?,1,unixepoch())
  ON CONFLICT(group_id,user) DO UPDATE SET msgs = msgs + 1, last_seen = unixepoch()
`)
const _getTopActivity = db.prepare(`SELECT user, msgs FROM activity WHERE group_id = ? ORDER BY msgs DESC LIMIT ?`)

export function trackActivity(groupId, user)        { _trackActivity.run(groupId, user) }
export function getTopActivity(groupId, limit = 10) { return _getTopActivity.all(groupId, limit) }

// ─── Historial de mensajes ────────────────────────────────────────────────────

const _saveMsg      = db.prepare(`INSERT OR IGNORE INTO msg_history (group_id, msg_id, sender, sent_at) VALUES (?,?,?,?)`)
const _cleanOld     = db.prepare(`DELETE FROM msg_history WHERE group_id = ? AND msg_id NOT IN (SELECT msg_id FROM msg_history WHERE group_id = ? ORDER BY sent_at DESC LIMIT 500)`)
const _getMsgsSince = db.prepare(`SELECT msg_id, sender FROM msg_history WHERE group_id = ? AND sent_at >= ? ORDER BY sent_at DESC`)
const _getLastMsgs  = db.prepare(`SELECT msg_id, sender FROM msg_history WHERE group_id = ? ORDER BY sent_at DESC LIMIT ?`)
const _deleteMsg    = db.prepare(`DELETE FROM msg_history WHERE group_id = ? AND msg_id = ?`)

export function saveMsg(groupId, msgId, sender) {
  _saveMsg.run(groupId, msgId, sender, Math.floor(Date.now() / 1000))
  _cleanOld.run(groupId, groupId)
}
export function getMsgsSince(groupId, seconds) {
  return _getMsgsSince.all(groupId, Math.floor(Date.now() / 1000) - seconds)
}
export function getLastMsgs(groupId, limit)          { return _getLastMsgs.all(groupId, limit) }
export function deleteMsgFromHistory(groupId, msgId) { _deleteMsg.run(groupId, msgId) }

// ─── Ban global ───────────────────────────────────────────────────────────────

const _ban       = db.prepare(`INSERT OR IGNORE INTO banned (user) VALUES (?)`)
const _unban     = db.prepare(`DELETE FROM banned WHERE user = ?`)
const _isBanned  = db.prepare(`SELECT 1 FROM banned WHERE user = ?`)
const _getBanned = db.prepare(`SELECT user FROM banned ORDER BY banned_at DESC`)

export function banUser(user)   { _ban.run(user) }
export function unbanUser(user) { _unban.run(user) }
export function isBanned(user)  { return !!_isBanned.get(user) }
export function getBanned()     { return _getBanned.all().map(r => r.user) }

// ─── Users ────────────────────────────────────────────────────────────────────

const _getUser      = db.prepare(`SELECT * FROM users WHERE user_num = ?`)
const _createUser   = db.prepare(`INSERT OR IGNORE INTO users (user_num, nombre) VALUES (?,?)`)
const _isRegistered = db.prepare(`SELECT 1 FROM users WHERE user_num = ? AND nombre != ''`)
const _countUsers   = db.prepare(`SELECT COUNT(*) as n FROM users`)

export function getUser(userNum)      { return _getUser.get(userNum) }
export function isRegistered(userNum) { return !!_isRegistered.get(userNum) }
export function countUsers()          { return _countUsers.get()?.n || 0 }

export function registerUser(userNum, nombre) {
  _createUser.run(userNum, nombre)
}

// ─── Auto-registro (perfil y comandos de economía) ────────────────────────────

export function ensureRegistered(userNum, pushName) {
  if (isRegistered(userNum)) return
  const nombre = (pushName || '').trim().slice(0, 30) || `Alma Errante-${countUsers() + 1}`
  registerUser(userNum, nombre)
}

// ─── Perfil extendido ─────────────────────────────────────────────────────────

const _setUserField = (field) => db.prepare(`UPDATE users SET ${field} = ? WHERE user_num = ?`)

export function setUserField(userNum, field, value) {
  _setUserField(field).run(value, userNum)
}
export function getAge(userNum) {
  return _getUser.get(userNum)?.edad || 0
}

// ─── Economía: utilidades de tiempo ───────────────────────────────────────────

const ahora = () => Math.floor(Date.now() / 1000)
// Día en horario de Honduras (UTC-6, sin horario de verano)
const hoy   = (offsetMs = 0) => new Date(Date.now() - 6 * 3600 * 1000 - offsetMs).toISOString().slice(0, 10)
const entero = (n) => Math.floor(Number(n))

// ─── Economía: estadísticas (kryons creados y destruidos por día) ─────────────

const _stat = db.prepare(`
  INSERT INTO economia_stats (dia, creados, destruidos) VALUES (?,?,?)
  ON CONFLICT(dia) DO UPDATE SET creados = creados + excluded.creados, destruidos = destruidos + excluded.destruidos
`)
const _statsRecientes = db.prepare(`SELECT dia, creados, destruidos FROM economia_stats ORDER BY dia DESC LIMIT ?`)

function registrarStat(creados, destruidos) {
  if (creados || destruidos) _stat.run(hoy(), creados, destruidos)
}
export function getStatsEconomia(dias = 7) { return _statsRecientes.all(dias) }

// ─── Economía: saldos ─────────────────────────────────────────────────────────

const _getEco      = db.prepare(`SELECT kryons, banco, petalos, xp FROM users WHERE user_num = ?`)
const _addKryons   = db.prepare(`UPDATE users SET kryons = kryons + ? WHERE user_num = ?`)
const _subKryonsIf = db.prepare(`UPDATE users SET kryons = kryons - ? WHERE user_num = ? AND kryons >= ?`)
const _deposito    = db.prepare(`UPDATE users SET kryons = kryons - ?, banco = banco + ? WHERE user_num = ? AND kryons >= ?`)
const _retiro      = db.prepare(`UPDATE users SET banco = banco - ?, kryons = kryons + ? WHERE user_num = ? AND banco >= ?`)
const _addPetalos  = db.prepare(`UPDATE users SET petalos = petalos + ? WHERE user_num = ?`)
const _subPetalos  = db.prepare(`UPDATE users SET petalos = petalos - ? WHERE user_num = ? AND petalos >= ?`)

export function getEconomia(userNum) { return _getEco.get(userNum) || null }

// Premio del sistema: crea kryons. Devuelve lo que se sumó (0 si no existe el usuario).
export function ganarKryons(userNum, monto) {
  const n = entero(monto)
  if (!(n > 0)) return 0
  if (!_addKryons.run(n, userNum).changes) return 0
  registrarStat(n, 0)
  return n
}

// Multa al sistema: destruye kryons hasta donde alcance. Devuelve lo realmente quitado.
const _perder = db.transaction((userNum, n) => {
  const eco = _getEco.get(userNum)
  if (!eco) return 0
  const real = Math.min(n, eco.kryons)
  if (real <= 0) return 0
  _subKryonsIf.run(real, userNum, real)
  registrarStat(0, real)
  return real
})
export function perderKryons(userNum, monto) {
  const n = entero(monto)
  return n > 0 ? _perder(userNum, n) : 0
}

// Compra: solo descuenta si alcanza, todo en una operación. Devuelve true/false.
const _gastar = db.transaction((userNum, n) => {
  if (!_subKryonsIf.run(n, userNum, n).changes) return false
  registrarStat(0, n)
  return true
})
export function gastarKryons(userNum, costo) {
  const n = entero(costo)
  return n > 0 ? _gastar(userNum, n) : false
}

// Cartera ⇄ banco
export function depositar(userNum, monto) {
  const n = entero(monto)
  return n > 0 && _deposito.run(n, n, userNum, n).changes > 0
}
export function retirar(userNum, monto) {
  const n = entero(monto)
  return n > 0 && _retiro.run(n, n, userNum, n).changes > 0
}

// Mueve kryons entre dos personas (transferencias, robos, multas pagadas a la víctima).
// comision: parte que se destruye. parcial: si no alcanza, mueve lo que haya en vez de fallar.
// Devuelve { movido, recibido, comision } o null si no se pudo.
const _mover = db.transaction((de, a, n, comision, parcial) => {
  const origen  = _getEco.get(de)
  const destino = _getEco.get(a)
  if (!origen || !destino || de === a) return null
  const mover = parcial ? Math.min(n, origen.kryons) : n
  if (mover <= 0 || origen.kryons < mover) return null
  const fee = Math.min(comision, mover)
  _subKryonsIf.run(mover, de, mover)
  _addKryons.run(mover - fee, a)
  registrarStat(0, fee)
  return { movido: mover, recibido: mover - fee, comision: fee }
})
export function transferirKryons(de, a, monto, { comision = 0, parcial = false } = {}) {
  const n = entero(monto)
  return n > 0 ? _mover(de, a, n, Math.max(0, entero(comision) || 0), parcial) : null
}

// Pétalos: solo los crea el sistema y no se transfieren
export function ganarPetalos(userNum, cantidad) {
  const n = entero(cantidad)
  return n > 0 && _addPetalos.run(n, userNum).changes > 0 ? n : 0
}
export function gastarPetalos(userNum, cantidad) {
  const n = entero(cantidad)
  return n > 0 && _subPetalos.run(n, userNum, n).changes > 0
}

// ─── Economía: cooldowns ──────────────────────────────────────────────────────

const _getCd = db.prepare(`SELECT hasta FROM cooldowns WHERE user_num = ? AND clave = ?`)
const _setCd = db.prepare(`
  INSERT INTO cooldowns (user_num, clave, hasta) VALUES (?,?,?)
  ON CONFLICT(user_num, clave) DO UPDATE SET hasta = excluded.hasta
`)

// Segundos que faltan para que la clave quede libre (0 = ya se puede)
export function cooldownRestante(userNum, clave) {
  return Math.max(0, (_getCd.get(userNum, clave)?.hasta || 0) - ahora())
}
export function ponerCooldown(userNum, clave, segundos) {
  _setCd.run(userNum, clave, ahora() + Math.max(0, entero(segundos) || 0))
}

// ─── Economía: contadores por día (transferencias, XP del día, etc.) ──────────

const _getContador = db.prepare(`SELECT valor FROM contadores_dia WHERE user_num = ? AND dia = ? AND clave = ?`)
const _sumContador = db.prepare(`
  INSERT INTO contadores_dia (user_num, dia, clave, valor) VALUES (?,?,?,?)
  ON CONFLICT(user_num, dia, clave) DO UPDATE SET valor = valor + excluded.valor
`)

export function getContadorDia(userNum, clave) {
  return _getContador.get(userNum, hoy(), clave)?.valor || 0
}
export function sumarContadorDia(userNum, clave, n = 1) {
  _sumContador.run(userNum, hoy(), clave, entero(n))
}

// ─── Economía: XP y top ───────────────────────────────────────────────────────

const _addXp    = db.prepare(`UPDATE users SET xp = xp + ? WHERE user_num = ?`)
const _topXp    = db.prepare(`SELECT user_num, nombre, xp FROM users WHERE xp > 0 ORDER BY xp DESC LIMIT ?`)
const _puestoXp = db.prepare(`SELECT COUNT(*) + 1 AS puesto FROM users WHERE xp > ?`)

// Suma XP respetando el tope diario. Devuelve { agregado, xp } o null si no se sumó nada.
const _otorgarXp = db.transaction((userNum, cantidad, tope) => {
  const permitido = Math.min(cantidad, tope - getContadorDia(userNum, 'xp'))
  if (!(permitido > 0)) return null
  if (!_addXp.run(permitido, userNum).changes) return null
  sumarContadorDia(userNum, 'xp', permitido)
  return { agregado: permitido, xp: _getEco.get(userNum).xp }
})
export function otorgarXp(userNum, cantidad, topeDiario) {
  const n = entero(cantidad)
  return n > 0 ? _otorgarXp(userNum, n, entero(topeDiario)) : null
}

export function getTopXp(limit = 10) { return _topXp.all(limit) }
export function getPuestoXp(userNum) {
  const eco = _getEco.get(userNum)
  return eco ? _puestoXp.get(eco.xp).puesto : null
}

// ─── Economía: auto-mantenimiento ─────────────────────────────────────────────

const _limpiarCd         = db.prepare(`DELETE FROM cooldowns WHERE hasta <= ?`)
const _limpiarContadores = db.prepare(`DELETE FROM contadores_dia WHERE dia < ?`)
const _limpiarStats      = db.prepare(`DELETE FROM economia_stats WHERE dia < ?`)

export function limpiarEconomia() {
  _limpiarCd.run(ahora())
  _limpiarContadores.run(hoy())
  _limpiarStats.run(hoy(90 * 86400 * 1000))
}

limpiarEconomia()
setInterval(limpiarEconomia, 60 * 60 * 1000).unref()

// ─── Reset global de perfiles ─────────────────────────────────────────────────

const _resetAllProfiles = db.transaction(() => {
  db.exec(`DELETE FROM users; DELETE FROM cooldowns; DELETE FROM contadores_dia;`)
})

export function resetTodosLosPerfiles() {
  _resetAllProfiles()
}

// ─── Ignored ─────────────────────────────────────────────────────────────────

const _ignoreUser   = db.prepare(`INSERT OR IGNORE INTO ignored (group_id, user) VALUES (?,?)`)
const _unignoreUser = db.prepare(`DELETE FROM ignored WHERE group_id = ? AND user = ?`)
const _isIgnored    = db.prepare(`SELECT 1 FROM ignored WHERE group_id = ? AND user = ?`)
const _getIgnored   = db.prepare(`SELECT user FROM ignored WHERE group_id = ?`)

export function ignoreUser(groupId, user)   { _ignoreUser.run(groupId, user) }
export function unignoreUser(groupId, user) { _unignoreUser.run(groupId, user) }
export function isIgnored(groupId, user)    { return !!_isIgnored.get(groupId, user) }
export function getIgnored(groupId)         { return _getIgnored.all(groupId).map(r => r.user) }

export default db