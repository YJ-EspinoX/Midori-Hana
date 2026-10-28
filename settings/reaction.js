//settings/reaction.js

export const REACTIONS = {
  admin:      ['🌴', '🌾', '🌱', '🍃', '🎐'],
  busqueda:   ['🔍', '👁️', '🧬', '🔮', '🛰️'],
  descargas:  ['📥', '⚡', '🛸', '🌀', '💎'],
  diversion:  ['🎈', '🌸', '🧸', '🎐', '✨'],
  economia:   ['🪙', '💰', '💳', '📊', '📈'],
  juego:      ['🎮', '🎲', '🧩', '🎯', '🎰'],
  main:       ['🌸', '🎐', '🍀', '🦋', '✨'],
  owner:      ['👑', '🛡️', '⚙️', '🌌', '⚡'],
  utilidades: ['🛠️', '⚙️', '📍', '📦', '🗂️']
}

export function getRandomReaction(categoria) {
  const list = REACTIONS[categoria?.toLowerCase()] || REACTIONS.main
  return list[Math.floor(Math.random() * list.length)]
}