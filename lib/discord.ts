// Sends notifications to a Discord channel via webhook URL.
// Set DISCORD_WEBHOOK_URL in env vars to enable. If unset, these are no-ops —
// the app works fine without Discord notifications configured.

async function sendWebhook(content: string, color: number) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return // silently skip if not configured

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            description: content,
            color,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })
  } catch {
    // Don't let a Discord failure break the actual app action
  }
}

export async function notifyAccountCreated(byUsername: string, newUsername: string, role: string) {
  await sendWebhook(`🆕 **${byUsername}** created a new account: **${newUsername}** (role: \`${role}\`)`, 0x5fa88a)
}

export async function notifyAccountRemoved(byUsername: string, removedUsername: string) {
  await sendWebhook(`🗑️ **${byUsername}** removed account: **${removedUsername}**`, 0xe8748a)
}

export async function notifyRoleChanged(byUsername: string, targetUsername: string, oldRole: string, newRole: string) {
  await sendWebhook(`🔧 **${byUsername}** changed **${targetUsername}**'s role: \`${oldRole}\` → \`${newRole}\``, 0xd9924a)
}

export async function notifyLogin(username: string, role: string, ip?: string) {
  await sendWebhook(`🔑 **${username}** (\`${role}\`) logged in${ip ? ` from \`${ip}\`` : ''}`, 0x7b8fc4)
}

export async function notifySessionKicked(byUsername: string, kickedUsername: string) {
  await sendWebhook(`👋 **${byUsername}** kicked **${kickedUsername}**'s session`, 0xe8748a)
}
