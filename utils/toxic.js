// utils/toxic.js

const TOXIC_WORDS = [
  'puta', 'puto', 'mierda', 'idiota', 'imbécil', 'imbecil', 'estúpido', 'estupido',
  'pendejo', 'pendeja', 'culero', 'culera', 'cabrón', 'cabron', 'cabra',
  'malparido', 'malparida', 'hijueputa', 'hijo de puta', 'hija de puta',
  'hp', 'hdp', 'hijue', 'joputa', 'ptm', 'ptmre', 'ctm', 'ctmr',
  'verga', 'joder', 'jodido', 'nmms','jodida', 'chinga', 'chingada',
  'perra', 'perro', 'zorra', 'zorro', 'puerco', 'puerca', 'cerdo', 'cerda',
  'basura', 'escoria', 'maldito', 'maldita', 'desgraciado', 'desgraciada',
  'pajero', 'pajera', 'pelotudo', 'pelotuda', 'boludo', 'boluda',
  'mogólico', 'mogolico', 'retrasado', 'retrasada', 'mongolo', 'mongola',
  'careverga', 'carepicha', 'soplapollas', 'capullo', 'gilipollas',
  'hijo de', 'hija de', 'tu madre', 'tu hermana', 'tu abuela',
  'la concha', 'la puta', 'al carajo', 'a la mierda', 'a la verga',
  'te voy a matar', 'te mato', 'muérete', 'muerete', 'ojalá te mueras',
  'desvivir', 'desvivirte', 'suicídate', 'suicidate',
]

const ANGRY_WORDS = [
  'odio', 'detesto', 'me enfurece', 'me enoja', 'me caga', 'me jode',
  'fastidio', 'harto', 'harta',  'no mames',  'puta', 'puto',  'pndj',
]

// Contador de advertencias por usuario
const warnings = new Map()

export function isToxic(text) {
  if (!text) return { toxic: false, level: 0, word: '' }
  
  const lower = text.toLowerCase()
  
  for (const word of TOXIC_WORDS) {
    if (lower.includes(word)) {
      return { toxic: true, level: 2, word }
    }
  }
  
  for (const word of ANGRY_WORDS) {
    if (lower.includes(word)) {
      return { toxic: true, level: 1, word }
    }
  }
  
  return { toxic: false, level: 0, word: '' }
}

export function getWarningCount(userNum) {
  return warnings.get(userNum) || 0
}

export function addWarning(userNum) {
  const count = (warnings.get(userNum) || 0) + 1
  warnings.set(userNum, count)
  // Limpiar después de 10 minutos
  setTimeout(() => {
    warnings.delete(userNum)
  }, 600000)
  return count
}

export function clearWarnings(userNum) {
  warnings.delete(userNum)
}

export function getToxicResponse(userTag, warningCount) {
  if (warningCount === 1) {
    const frases = [
      `🌸 @${userTag}, esas palabras no son bonitas. Te borré el mensaje, esta es tu primera advertencia.`,
      `🍃 @${userTag}, aquí hablamos con cariño. Borré tu mensaje, cuidadito con la próxima.`,
      `✨ @${userTag}, respira hondo, no hace falta hablar así. Primera advertencia.`
    ]
    return frases[Math.floor(Math.random() * frases.length)]
  }
  
  if (warningCount === 2) {
    const frases = [
      `⚠️ @${userTag}, segunda advertencia. Una más y te silencio 3 minutos.`,
      `😔 @${userTag}, ya te lo dije antes... borré tu mensaje otra vez. Una más y hay castigo.`,
      `💢 @${userTag}, van dos. La tercera no te va a gustar. Te silenciaré un rato.`
    ]
    return frases[Math.floor(Math.random() * frases.length)]
  }
  
  if (warningCount >= 3) {
    const frases = [
      `🔇 @${userTag}, te lo advertí. Tres minutos en silencio para que te calmes.`,
      `🍂 @${userTag}, se acabaron las advertencias. Silencio por 3 minutos.`,
      `😤 @${userTag}, no me gusta hacer esto pero no me dejaste opción. Tres minutos muteado.`
    ]
    return frases[Math.floor(Math.random() * frases.length)]
  }
}