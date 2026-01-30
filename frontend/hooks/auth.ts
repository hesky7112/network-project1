import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { User, LoginRequest, AuthResponse } from '@/types'
import { apiClient } from '@/lib/api'
import { authUtils } from '@/utils/auth'

interface AuthContextType {
  user: User | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = apiClient.getToken()
    if (token && authUtils.isTokenValid(token)) {
      const userData = authUtils.getUserFromToken(token)
      setUser(userData)
    }
    setLoading(false)
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      const response: AuthResponse = await apiClient.login(credentials)
      setUser(response.user)
      router.push('/dashboard')
    } catch (error) {
      throw new Error('Login failed')
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking user roles
export function useRole() {
  const { user } = useAuth()

  return {
    isAdmin: user?.role === 'admin',
    isEngineer: user?.role === 'engineer' || user?.role === 'admin',
    isViewer: user?.role === 'viewer',
    role: user?.role,
  }
}
