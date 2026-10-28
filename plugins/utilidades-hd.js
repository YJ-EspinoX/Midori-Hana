// plugins/hd.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import got from 'got'
import { randomUUID } from 'crypto'

const PUBLIC_JWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJhdWQiOiIiLCJpYXQiOjE1MjMzNjQ4MjQsIm5iZiI6MTUyMzM2NDgyNCwianRpIjoicHJvamVjdF9wdWJsaWNfYzkwNWRkMWMwMWU5ZmQ3NzY5ODNjYTQwZDBhOWQyZjNfT1Vzd2EwODA0MGI4ZDJjN2NhM2NjZGE2MGQ2MTBhMmRkY2U3NyJ9.qvHSXgCJgqpC4gd6-paUlDLFmg0o2DsOvb1EUYPYx_E'
const TOOL = 'upscaleimage'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'

const activeUsers = new Map()

function multipart(fields, fileField = null) {
  const boundary = '----WebKitFormBoundary' + randomUUID().replace(/-/g, '').slice(0, 16)
  const parts = []
  for (const [name, val] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`))
  }
  if (fileField) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.mime}\r\n\r\n`
    ))
    parts.push(fileField.buffer)
    parts.push(Buffer.from('\r\n'))
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`))
  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` }
}

async function startTask() {
  const resp = await got({
    url: `https://api.iloveimg.com/v1/start/${TOOL}`,
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'user-agent': UA,
      'referer': 'https://www.iloveimg.com/',
      'origin': 'https://www.iloveimg.com',
      'authorization': `Bearer ${PUBLIC_JWT}`
    },
    timeout: { request: 30000 },
    throwHttpErrors: false,
  })
  if (resp.statusCode !== 200) throw new Error('API off')
  return JSON.parse(resp.body)
}

async function uploadImage(server, task, imageBuffer, filename, mime) {
  const { body, contentType } = multipart({ task }, { name: 'file', filename, mime, buffer: imageBuffer })
  const resp = await got({
    url: `https://${server}/v1/upload`,
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'user-agent': UA,
      'referer': 'https://www.iloveimg.com/',
      'origin': 'https://www.iloveimg.com',
      'authorization': `Bearer ${PUBLIC_JWT}`,
      'content-type': contentType
    },
    body,
    timeout: { request: 120000 },
    throwHttpErrors: false,
  })
  return JSON.parse(resp.body)
}

async function upscaleStep(server, task, serverFilename, scale) {
  const { body, contentType } = multipart({ task, server_filename: serverFilename, scale })
  await got({
    url: `https://${server}/v1/upscale`,
    method: 'POST',
    headers: {
      'user-agent': UA,
      'referer': 'https://www.iloveimg.com/',
      'origin': 'https://www.iloveimg.com',
      'authorization': `Bearer ${PUBLIC_JWT}`,
      'content-type': contentType
    },
    body,
    timeout: { request: 120000 },
    throwHttpErrors: false,
  })
}

async function processImage(server, task, serverFilename, filename, multiplier) {
  const { body, contentType } = multipart({
    packaged_filename: 'iloveimg-upscaled',
    task,
    tool: TOOL,
    'files[0][server_filename]': serverFilename,
    'files[0][filename]': filename,
    multiplier,
  })
  await got({
    url: `https://${server}/v1/process`,
    method: 'POST',
    headers: {
      'user-agent': UA,
      'referer': 'https://www.iloveimg.com/',
      'origin': 'https://www.iloveimg.com',
      'authorization': `Bearer ${PUBLIC_JWT}`,
      'content-type': contentType
    },
    body,
    timeout: { request: 120000 },
    throwHttpErrors: false,
  })
}

async function downloadResult(server, task) {
  const resp = await got({
    url: `https://${server}/v1/download/${task}`,
    method: 'GET',
    headers: { 'user-agent': UA, 'referer': 'https://www.iloveimg.com/' },
    responseType: 'buffer',
    timeout: { request: 120000 },
    throwHttpErrors: false,
  })
  return resp.body
}

export default {
  command: ['hd', 'upscale'],
  tag: 'hd',
  categoria: 'utilidad',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Mejora la resolución de una imagen',

  async execute(sock, msg, { from }) {
    const userId = msg.key.participant || from
    if (activeUsers.has(userId)) return

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const directMedia = msg.message?.imageMessage || msg.message?.documentMessage
    const quotedMedia = quoted?.imageMessage || quoted?.documentMessage
    const mediaMessage = directMedia ? msg.message : quotedMedia ? quoted : null
    const mime = (mediaMessage?.imageMessage || mediaMessage?.documentMessage)?.mimetype || ''

    if (!mediaMessage || !/image/g.test(mime)) {
      return sock.sendMessage(from, {
        text: 'Responde a una imagen con *.hd 2* o *.hd 4* para mejorar su resolución.'
      }, { quoted: msg })
    }

    activeUsers.set(userId, true)
    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

    try {
      const msgToDownload = directMedia ? msg : { key: msg.key, message: quoted }
      const buffer = await downloadMediaMessage(
        msgToDownload,
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      )

      if (!buffer) throw new Error('No se pudo descargar')

      const scale = '2'
      const filename = mime.includes('png') ? 'imagen.png' : 'imagen.jpg'

      const { server, task } = await startTask()
      const upload = await uploadImage(server, task, buffer, filename, mime)
      const serverFilename = upload.server_filename

      await upscaleStep(server, task, serverFilename, scale)
      await processImage(server, task, serverFilename, filename, scale)
      const resultBuffer = await downloadResult(server, task)

      await sock.sendMessage(from, {
        image: resultBuffer,
        caption: `Mejorada a ${scale}x`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🟢', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '🔴', key: msg.key } })
      await sock.sendMessage(from, { text: 'No pude mejorar la imagen.' }, { quoted: msg })
    } finally {
      activeUsers.delete(userId)
    }
  }
}