import { NextRequest, NextResponse } from 'next/server'
import { getDatabase, addEntry, removeEntry, type BlacklistEntry } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDatabase()
    return NextResponse.json(db)
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch database' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, value, name, severity, reason } = await req.json()
    
    if (!type || !value || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const entry: BlacklistEntry = {
      id: Date.now().toString(),
      type,
      value,
      name,
      severity,
      reason,
      addedAt: new Date().toISOString(),
    }

    await addEntry(entry)
    return NextResponse.json({ success: true, entry })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to add entry' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await removeEntry(id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to delete entry' }, { status: 500 })
  }
}
