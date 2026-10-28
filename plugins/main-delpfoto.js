// plugins/delpfoto.js
import { setUserField, getUser, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

export default {
  command: 'delpfoto',
  tag: 'delpfoto',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Elimina tu foto de perfil',

  async onMessage(sock, msg, { from, text, userNum }) {
    if (!userNum) return

    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()?.toLowerCase()
    if (!respuesta) return

    if (respuesta !== 'si' && respuesta !== 'no') return

    sesiones.delete(userNum)

    if (respuesta === 'no') {
      return sock.sendMessage(from, { text: '> 🩷 Bueno, tu foto se queda donde está.' }, { quoted: msg })
    }

    setUserField(userNum, 'foto', '')
    return sock.sendMessage(from, { text: '> 🩷 Foto eliminada. Usa *.pfoto* si quieres poner una nueva.' }, { quoted: msg })
  },

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const perfil = getUser(selfNum)

    if (!perfil.foto) {
      return sock.sendMessage(from, { text: '> 🩷 No tienes ninguna foto de perfil puesta.' }, { quoted: msg })
    }

    sesiones.set(selfNum, { paso: 'confirmar' })

    await sock.sendMessage(from, {
      text: '> 🩷 ¿Seguro que quieres eliminar tu foto de perfil? Responde *si* o *no*.'
    }, { quoted: msg })
  }
}