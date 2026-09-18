import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS, subscribeToAuthFailure } from '../api/client'

const AuthContext = createContext(null)

function readStoredUser() {
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(STORAGE_KEYS.USER)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN))
  const [user, setUser] = useState(readStoredUser)

  useEffect(() => {
    const clearSession = () => {
      setToken(null)
      setUser(null)
    }

    const unsubscribe = subscribeToAuthFailure(clearSession)
    window.addEventListener('live-polling:auth-failure', clearSession)

    return () => {
      unsubscribe()
      window.removeEventListener('live-polling:auth-failure', clearSession)
    }
  }, [])

  const setSession = (nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, nextToken)
    }

    if (nextUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser))
    }

    setToken(nextToken || null)
    setUser(nextUser || null)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    setSession,
    logout,
  }), [token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
