export interface AdminPermissions {
  bookings: boolean
  masters: boolean
  schedule: boolean
  services: boolean
  vacancies: boolean
  testimonials: boolean
  content: boolean
  notifications: boolean
}

export interface AdminUser {
  id: string
  username: string
  role: 'owner' | 'staff' | 'master'
  masterId: string | null
  active: boolean
  createdAt: string
  permissions: AdminPermissions
}

const TOKEN_KEY = 'sa_admin_token'
const USER_KEY = 'sa_admin_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AdminUser) : null
  } catch {
    return null
  }
}

export function setSession(token: string, user: AdminUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/** 'owner' accounts implicitly have every permission. */
export function hasPermission(user: AdminUser | null, perm: keyof AdminPermissions): boolean {
  if (!user) return false
  if (user.role === 'owner') return true
  return !!user.permissions?.[perm]
}
