// plugins/tourl.js
import fs from 'fs'
import path from 'path'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import fetch, { FormData, Blob } from 'node-fetch'

const TEMP_DIR = path.join(process.cwd(), 'tmp')
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

const activeUsers = new Map()
const randomUA = () => `Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0`

export default {
    command: ['tourl'],
    tag: 'tourl',
    categoria: 'utilidad',
    owner: false,
    group: false,
    nsfw: false,
    descripcion: 'Convierte imagen/video/sticker en URL permanente',

    async execute(sock, msg, { from }) {
        const userId = msg.key.participant || from
        
        console.log(`[TOURL] 👤 Usuario: ${userId}`)
        
        if (activeUsers.has(userId)) {
            console.log(`[TOURL] ⚠️ Usuario ya tiene proceso activo`)
            return
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const messageToDownload = quoted ? quoted : msg.message

        const mediaType = Object.keys(messageToDownload || {}).find(key => key.includes('Message') && !key.includes('protocol'))
        
        console.log(`[TOURL] 📱 Tipo de medio detectado: ${mediaType}`)
        
        if (!mediaType || !/image|video|sticker/g.test(mediaType)) {
            console.log(`[TOURL] ❌ No se encontró imagen/video/sticker`)
            return sock.sendMessage(from, { text: '🌸 Responde a una imagen, video o sticker con .tourl' }, { quoted: msg })
        }

        activeUsers.set(userId, true)
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
        
        try {
            console.log(`[TOURL] ⬇️ Descargando medio...`)
            const buffer = await downloadMediaMessage(
                { message: messageToDownload },
                'buffer',
                {},
                { logger: console, reuploadRequest: sock.updateMediaMessage }
            )

            if (!buffer) throw new Error('Error al descargar')
            console.log(`[TOURL] ✅ Descargado: ${buffer.length} bytes`)

            const mime = (messageToDownload[mediaType])?.mimetype || 'image/jpeg'
            let ext = '.jpg'
            if (mime.includes('png')) ext = '.png'
            else if (mime.includes('video/mp4')) ext = '.mp4'
            else if (mime.includes('webp')) ext = '.webp'
            else if (mime.includes('gif')) ext = '.gif'

            console.log(`[TOURL] 📁 MIME: ${mime}, extensión: ${ext}`)

            const fileName = `up_${Date.now()}${ext}`
            const tempFile = path.join(TEMP_DIR, fileName)
            fs.writeFileSync(tempFile, buffer)
            console.log(`[TOURL] 💾 Archivo temporal: ${tempFile}`)
            
            console.log(`[TOURL] 📤 Subiendo a qu.ax...`)
            const result = await uploadFile(tempFile, fileName, mime)
            
            if (result.success && result.url) {
                console.log(`[TOURL] ✅ URL obtenida: ${result.url}`)
                const txt = `🌸 *URL permanente:*\n\n🔗 ${result.url}`
                await sock.sendMessage(from, { text: txt }, { quoted: msg })
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
            } else {
                console.log(`[TOURL] ❌ Error en subida: ${result.message || 'sin mensaje'}`)
                await sock.sendMessage(from, { text: '🌿 No se pudo subir el archivo.' }, { quoted: msg })
            }

            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile)
                console.log(`[TOURL] 🗑️ Archivo temporal eliminado`)
            }
            
        } catch (err) {
            console.error(`[TOURL] ❌ Error:`, err.message)
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        } finally {
            activeUsers.delete(userId)
            console.log(`[TOURL] 👤 Usuario liberado: ${userId}`)
        }
    }
}

const uploadFile = async (filePath, fileName, mimeType) => {
    const endpoint = 'https://qu.ax/upload'
    console.log(`[UPLOAD] 🌐 Endpoint: ${endpoint}`)
    
    try {
        const buffer = fs.readFileSync(filePath)
        console.log(`[UPLOAD] 📦 Buffer size: ${buffer.length} bytes`)
        
        const form = new FormData()
        form.append('files[]', new Blob([buffer], { type: mimeType }), fileName)
        form.append('expiry', '-1') // -1 = permanente

        const res = await fetch(endpoint, {
            method: 'POST',
            body: form,
            headers: {
                'User-Agent': randomUA(),
                'Origin': 'https://qu.ax',
                'Referer': 'https://qu.ax/'
            }
        })

        console.log(`[UPLOAD] 📡 Status respuesta: ${res.status}`)
        
        const data = await res.json()
        console.log(`[UPLOAD] 📨 Data recibida:`, JSON.stringify(data, null, 2))
        
        if (data.success && data.files && data.files[0] && data.files[0].url) {
            return { success: true, url: data.files[0].url }
        }
        
        return { success: false, message: 'No se encontró URL en la respuesta' }
    } catch (err) {
        console.error(`[UPLOAD] ❌ Error:`, err.message)
        return { success: false, message: err.message }
    }
}