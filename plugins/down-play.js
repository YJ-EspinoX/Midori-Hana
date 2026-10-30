import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import yts from 'yt-search'

const MSG_ERROR = 'Ocurrió un error inesperado.'

export default {
  command: ['play', 'mp3'],
  tag: 'descargas',
  categoria: 'descargas',
  descripcion: 'Busca o descarga audio de YouTube',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    const query = args.join(' ')
    if (!query) return sock.sendMessage(from, { text: MSG_ERROR }, { quoted: msg })

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      let url = query
      
      // Si no es URL, buscar en YouTube
      if (!url.startsWith('http')) {
        const search = await yts(query)
        if (!search.videos.length) throw new Error('Sin resultados')
        url = search.videos[0].url
      }

      // Descargar con yt-dlp a un archivo temporal
      const tmpDir = os.tmpdir()
      const fileName = `audio_${Date.now()}.mp3`
      const outputPath = path.join(tmpDir, fileName)

      await new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', [
          '-x',
          '--audio-format', 'mp3',
          '-o', outputPath,
          url
        ])

        ytdlp.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`yt-dlp falló con código ${code}`))
        })
        
        ytdlp.on('error', reject)
      })

      // Leer el archivo y enviarlo
      const audioBuffer = fs.readFileSync(outputPath)

      await sock.sendMessage(from, { 
        audio: audioBuffer, 
        mimetype: 'audio/mpeg' 
      }, { quoted: msg })

      // Limpiar el archivo temporal
      fs.unlinkSync(outputPath)

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (error) {
      console.error(error)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      return sock.sendMessage(from, { text: MSG_ERROR }, { quoted: msg })
    }
  }
}