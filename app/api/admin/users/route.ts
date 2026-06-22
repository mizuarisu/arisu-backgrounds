import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, createUser, generateTempPassword } from '@/lib/db-users'
import { UserRole } from '@/lib/auth'

function getRole(req: NextRequest): UserRole | null {
  return (req.headers.get('x-user-role') as UserRole) || null
}

export async function GET(req: NextRequest) {
  const role = getRole(req)
  if (role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const users = await getAllUsers()
    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const role = getRole(req)
  if (role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { username, role: newRole } = await req.json()

    if (!username || !newRole) {
      return NextResponse.json({ error: 'Username and role required' }, { status: 400 })
    }

    if (!['user', 'admin', 'manager'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const tempPassword = generateTempPassword()
    const user = await createUser(username, tempPassword, newRole)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      tempPassword,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create user'
    return NextResponse.json({ error: message }, { status: err instanceof Error && message.includes('exists') ? 409 : 500 })
  }
}
