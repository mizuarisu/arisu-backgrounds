import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, createUser, deleteUser, updateUserRole, getUserById, generateTempPassword } from '@/lib/db-users'
import { getValidSessionFromCookie, requireRole } from '@/lib/session-guard'
import { kickAllSessionsForUser } from '@/lib/sessions'
import { notifyAccountCreated, notifyAccountRemoved, notifyRoleChanged } from '@/lib/discord'
import { logEvent } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function getSession(req: NextRequest) {
  return getValidSessionFromCookie(req.cookies.get('bgcheck-session')?.value)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'admin-users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const users = await getAllUsers()
    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        description: u.description || '',
        createdAt: u.createdAt,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'admin-users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { username, role: newRole, description } = await req.json()

    if (!username || !newRole) {
      return NextResponse.json({ error: 'Username and role required' }, { status: 400 })
    }
    if (!['user', 'admin', 'manager'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const tempPassword = generateTempPassword()
    const user = await createUser(username, tempPassword, newRole, description)

    logEvent('info', 'system', `${session.username} created account "${username}" (role: ${newRole})`, { createdBy: session.username, newUsername: username, role: newRole })
    notifyAccountCreated(session.username, username, newRole)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        description: user.description || '',
        createdAt: user.createdAt,
      },
      tempPassword,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create user'
    return NextResponse.json({ error: message }, { status: message.includes('exists') ? 409 : 500 })
  }
}

// PATCH — change a user's role
export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'admin-users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id, role: newRole } = await req.json()
    if (!id || !newRole) {
      return NextResponse.json({ error: 'id and role required' }, { status: 400 })
    }
    if (!['user', 'admin', 'manager'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const target = await getUserById(id)
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const oldRole = target.role
    const updated = await updateUserRole(id, newRole)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update role (no change made)' }, { status: 500 })
    }

    logEvent('info', 'system', `${session.username} changed ${target.username}'s role: ${oldRole} → ${newRole}`, { changedBy: session.username, targetUsername: target.username, oldRole, newRole })
    notifyRoleChanged(session.username, target.username, oldRole, newRole)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to update role' }, { status: 500 })
  }
}

// DELETE — remove a user account. Managers cannot remove other managers
// (prevents accidental lockouts / power struggles); a manager CAN remove
// themselves if they really want to, but not another manager.
export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!requireRole(session.role, 'admin-users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const target = await getUserById(id)
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (target.role === 'manager' && target.id !== session.userId) {
      return NextResponse.json({ error: 'Managers cannot remove other managers' }, { status: 403 })
    }

    await deleteUser(id)
    await kickAllSessionsForUser(id) // immediately invalidate any active sessions for the removed account

    logEvent('warn', 'system', `${session.username} removed account "${target.username}"`, { removedBy: session.username, removedUsername: target.username })
    notifyAccountRemoved(session.username, target.username)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to remove user' }, { status: 500 })
  }
}
