export default {
  command:     ['revoke', 'resetlink'],
  tag:         'revoke',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Revoca y regenera el enlace de invitación',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const code = await sock.groupRevokeInvite(from)
      await sock.sendMessage(from, {
        text: global.messages.inviteGenerated.replace('{code}', code)
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}