import { NextRequest, NextResponse } from 'next/server'
import { getBlacklistFromTrello, getTrelloLists, createTrelloCard, deleteTrelloCard } from '@/lib/trello'

export const dynamic = 'force-dynamic'

// GET - fetch blacklist
export async function GET() {
  try {
    const blacklist = await getBlacklistFromTrello()
    return NextResponse.json(blacklist)
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch blacklist' }, { status: 500 })
  }
}

// POST - add entry
export async function POST(req: NextRequest) {
  try {
    const { type, value, severity, reason } = await req.json()
    if (!type || !value || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const lists = await getTrelloLists()
    const targetList = lists.find((l: { name: string }) =>
      type === 'user' ? l.name.toLowerCase().includes('user') : l.name.toLowerCase().includes('group')
    )

    if (!targetList) {
      return NextResponse.json({ error: `No Trello list found for ${type}s. Create a list named "Blacklisted Users" or "Blacklisted Groups"` }, { status: 404 })
    }

    const desc = `Severity: ${severity}\nReason: ${reason || 'N/A'}\nAdded: ${new Date().toISOString()}`
    const card = await createTrelloCard(targetList.id, value, desc)

    if (!card) {
      return NextResponse.json({ error: 'Failed to create Trello card' }, { status: 500 })
    }

    return NextResponse.json({ success: true, card })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to add entry' }, { status: 500 })
  }
}

// DELETE - remove entry
export async function DELETE(req: NextRequest) {
  try {
    const { cardId } = await req.json()
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 })
    }

    const success = await deleteTrelloCard(cardId)
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to delete entry' }, { status: 500 })
  }
}
