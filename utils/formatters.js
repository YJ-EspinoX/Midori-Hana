/**
 * Convierte texto a small caps (minúsculas pequeñas)
 * @param {string} text - Texto a convertir
 * @returns {string} Texto en small caps
 */
export function toSmallCaps(text) {
  const smallCaps = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ',
    'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
    'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ',
    'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ',
    'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ',
    'z': 'ᴢ', '-': '-'
  };
  return text.toLowerCase().split('').map(char => smallCaps[char] || char).join('');
}

/**
 * Retorna el nombre del bot en formato small caps con decoración
 * @param {object} bot - Objeto de configuración del bot
 * @returns {string} Nombre decorado del bot
 */
export function getBotSignature(bot) {
  const botName = toSmallCaps(bot.name);
  return `*· ${botName} ·*`;
}