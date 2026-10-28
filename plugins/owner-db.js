import { createWriteStream, existsSync, unlinkSync } from 'fs'
import { resolve, join } from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'

export default {
  command:   'db',
  tag:       'db',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Respalda la base de datos del bot',

  async execute(sock, msg, { from }) {
    const dbFiles = ['midori.db', 'midori.db-shm', 'midori.db-wal']
      .map(f => resolve(f))
      .filter(f => existsSync(f))

    if (!dbFiles.length) {
      await sock.sendMessage(from, { text: '⚠️ No se encontró ningún archivo de base de datos.' }, { quoted: msg })
      return
    }

    const zipPath = join(tmpdir(), `midori-db-${Date.now()}.zip`)

    try {
      await sock.sendMessage(from, { react: { text: '💾', key: msg.key } })

      // Comprimir archivos en ZIP
      await new Promise((res, rej) => {
        const output  = createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })
        output.on('close', res)
        archive.on('error', rej)
        archive.pipe(output)
        dbFiles.forEach(f => archive.file(f, { name: f.split('/').pop() }))
        archive.finalize()
      })

      const { readFileSync } = await import('fs')
      const zipBuffer = readFileSync(zipPath)
      const fecha     = new Date().toLocaleString('es', { hour12: false })

      await sock.sendMessage(from, {
        document:  zipBuffer,
        mimetype:  'application/zip',
        fileName:  `midori-db-backup-${Date.now()}.zip`,
        caption:   `💾 *Backup de base de datos*\n✦ Archivos: ${dbFiles.length}\n✦ Tamaño: ${(zipBuffer.length / 1024).toFixed(1)} KB\n✦ Fecha: ${fecha}`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    } finally {
      if (existsSync(zipPath)) unlinkSync(zipPath)
    }
  }
}