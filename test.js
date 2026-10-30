import crypto from 'crypto'

const videoId = 'OwQsJsAvS6U'
const urlOriginal = 'https://youtu.be/OwQsJsAvS6U?si=-RnoFQzPQsArSqIO'

// Generamos algunas keys comunes a partir del ID o la URL
const keys = {
  md5_id: crypto.createHash('md5').update(videoId).digest('hex'),
  md5_url: crypto.createHash('md5').update(urlOriginal).digest('hex'),
  sha1_id: crypto.createHash('sha1').update(videoId).digest('hex'),
  sha1_url: crypto.createHash('sha1').update(urlOriginal).digest('hex'),
  base64_id: Buffer.from(videoId).toString('base64'),
}

async function probar() {
  for (const [tipo, key] of Object.entries(keys)) {
    console.log(`\nProbando tipo: ${tipo} (key: ${key})`)
    try {
      const res = await fetch('https://cdn400.savetube.vip/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://ytshortdown.com',
          'Referer': 'https://ytshortdown.com/',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          downloadType: 'audio',
          quality: '128',
          key: key
        })
      })

      const data = await res.json()
      if (data.status) {
        console.log('✅ ¡ÉXITO! Key encontrada:', key)
        console.log('URL:', data.data.downloadUrl)
        return
      }
    } catch (e) {
      // ignorar
    }
  }
  console.log('\n❌ Ninguna key simple funcionó. Necesitamos el código JS de la web.')
}

probar()