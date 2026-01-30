import { jwtDecode } from 'jwt-decode'
import { User } from '@/types'

export interface JWTPayload {
  user_id: number
  username: string
  role: string
  exp: number
  iat: number
}

export const authUtils = {
  isTokenValid(token: string | null): boolean {
    if (!token) return false

    try {
      const decoded = jwtDecode<JWTPayload>(token)
      const currentTime = Date.now() / 1000
      return decoded.exp > currentTime
    } catch {
      return false
    }
  },

  getUserFromToken(token: string | null): User | null {
    if (!token) return null

    try {
      const decoded = jwtDecode<JWTPayload>(token)
      return {
        id: decoded.user_id,
        username: decoded.username,
        email: '', // Not in JWT payload
        role: decoded.role as 'admin' | 'engineer' | 'viewer',
        created_at: '',
        updated_at: '',
      }
    } catch {
      return null
    }
  },

  hasRole(token: string | null, requiredRole: string): boolean {
    if (!token) return false

    try {
      const decoded = jwtDecode<JWTPayload>(token)
      return decoded.role === requiredRole
    } catch {
      return false
    }
  },

  isAdmin(token: string | null): boolean {
    return this.hasRole(token, 'admin')
  },

  isEngineer(token: string | null): boolean {
    return this.hasRole(token, 'engineer') || this.isAdmin(token)
  },
}
