import { NextRequest, NextResponse } from 'next/server'
import { deleteSessionRecord } from '@/lib/sessions'

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('bgcheck-session')?.value
  if (sessionId) {
    await deleteSessionRecord(sessionId)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('bgcheck-session')
  return response
}
