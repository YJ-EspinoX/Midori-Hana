import bot      from './settings/bot.js'
import features from './settings/features.js'
import messages from './settings/messages.js'
import { logger }             from './utils/helpers.js'
import { loadPlugins }        from './core/plugins.js'
import { startWatcher }       from './core/watcher.js'
import { startBot }           from './core/bot.js'
import { getRandomReaction }  from './settings/reaction.js'

global.getRandomReaction = getRandomReaction

if (!global.bot || !global.features || !global.messages) {
  console.error('Error crítico: settings no cargados')
  process.exit(1)
}

logger.banner()
await loadPlugins()
startWatcher()

startBot().catch(err => {
  logger.error('Inicio', err)
  process.exit(1)
})