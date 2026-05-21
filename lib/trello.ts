// Trello API wrapper for blacklist management
// User needs to set TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID in .env.local

const KEY = process.env.TRELLO_API_KEY
const TOKEN = process.env.TRELLO_TOKEN
const BOARD_ID = process.env.TRELLO_BOARD_ID

interface TrelloCard {
  id: string
  name: string
  desc: string
  idList: string
}

interface BlacklistEntry {
  id: string
  type: 'user' | 'group'
  value: string // username or group ID
  severity: 'high' | 'medium' | 'low'
  reason: string
  addedAt: string
}

// Get all lists on the board
export async function getTrelloLists() {
  if (!KEY || !TOKEN || !BOARD_ID) return []
  const res = await fetch(`https://api.trello.com/1/boards/${BOARD_ID}/lists?key=${KEY}&token=${TOKEN}`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  return res.json()
}

// Get cards from a list
export async function getTrelloCards(listId: string): Promise<TrelloCard[]> {
  if (!KEY || !TOKEN) return []
  const res = await fetch(`https://api.trello.com/1/lists/${listId}/cards?key=${KEY}&token=${TOKEN}`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  return res.json()
}

// Create a card
export async function createTrelloCard(listId: string, name: string, desc: string) {
  if (!KEY || !TOKEN) return null
  const res = await fetch(`https://api.trello.com/1/cards?key=${KEY}&token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idList: listId, name, desc }),
  })
  if (!res.ok) return null
  return res.json()
}

// Delete a card
export async function deleteTrelloCard(cardId: string) {
  if (!KEY || !TOKEN) return false
  const res = await fetch(`https://api.trello.com/1/cards/${cardId}?key=${KEY}&token=${TOKEN}`, { method: 'DELETE' })
  return res.ok
}

// Parse blacklist from Trello
export async function getBlacklistFromTrello(): Promise<{ users: BlacklistEntry[]; groups: BlacklistEntry[] }> {
  const lists = await getTrelloLists()
  const userList = lists.find((l: { name: string }) => l.name.toLowerCase().includes('user'))
  const groupList = lists.find((l: { name: string }) => l.name.toLowerCase().includes('group'))

  const users: BlacklistEntry[] = []
  const groups: BlacklistEntry[] = []

  if (userList) {
    const cards = await getTrelloCards(userList.id)
    cards.forEach((card: TrelloCard) => {
      const lines = card.desc.split('\n')
      const severity = lines.find(l => l.startsWith('Severity:'))?.split(':')[1]?.trim().toLowerCase() as 'high' | 'medium' | 'low' || 'medium'
      const reason = lines.find(l => l.startsWith('Reason:'))?.split(':')[1]?.trim() || ''
      const addedAt = lines.find(l => l.startsWith('Added:'))?.split(':')[1]?.trim() || new Date().toISOString()
      users.push({ id: card.id, type: 'user', value: card.name, severity, reason, addedAt })
    })
  }

  if (groupList) {
    const cards = await getTrelloCards(groupList.id)
    cards.forEach((card: TrelloCard) => {
      const lines = card.desc.split('\n')
      const severity = lines.find(l => l.startsWith('Severity:'))?.split(':')[1]?.trim().toLowerCase() as 'high' | 'medium' | 'low' || 'medium'
      const reason = lines.find(l => l.startsWith('Reason:'))?.split(':')[1]?.trim() || ''
      const addedAt = lines.find(l => l.startsWith('Added:'))?.split(':')[1]?.trim() || new Date().toISOString()
      groups.push({ id: card.id, type: 'group', value: card.name, severity, reason, addedAt })
    })
  }

  return { users, groups }
}
