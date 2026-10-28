const imageUrl = 'https://www.image2url.com/r2/default/images/1776639876334-87e327fb-c225-42d5-bf68-a594f976fb49.jpg'

export default {
  command:   'broadcast',
  tag:       'broadcast',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un mensaje a todos los grupos',

  async execute(sock, msg, { from, args }) {
    const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const cmdEnd = fullText.indexOf(' ')
    const texto = cmdEnd > -1 ? fullText.slice(cmdEnd + 1) : ''

    if (!texto) {
      await sock.sendMessage(from, { text: global.messages.broadcastEmpty }, { quoted: msg })
      return
    }

    try {
      const groups = await sock.groupFetchAllParticipating()
      const ids    = Object.keys(groups)
      let sent     = 0

      const mensaje = `  · · ─────── ·🌸· ─────── · ·\n\n${texto}\n\n  · · ─────── ·🌸· ─────── · ·\n     Midori-Hana Bot ✦`

      for (const id of ids) {
        try {
          let mentions = []
          try {
            const meta = await sock.groupMetadata(id)
            mentions = meta.participants.map(p => p.id)
          } catch {}

          await sock.sendMessage(id, {
            image: { url: imageUrl },
            caption: mensaje,
            mentions
          })
          sent++
          await new Promise(r => setTimeout(r, 1500))
        } catch {}
      }

      await sock.sendMessage(from, {
        text: global.messages.broadcastSent.replace('{count}', sent)
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}