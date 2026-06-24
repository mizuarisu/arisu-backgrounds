import { redirect } from 'next/navigation'
import { getValidSession, requireRole } from '@/lib/session-guard'
import AdminUsersClient from './AdminUsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getValidSession()
  if (!session) redirect('/login')
  if (!requireRole(session.role, 'admin-users')) redirect('/login')

  return <AdminUsersClient />
}
