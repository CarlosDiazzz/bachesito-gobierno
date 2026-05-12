/* @refresh reset */
import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const TOKEN_KEY = 'bachesito.auth.token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    fetch('/api/auth/me', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(async r => {
        if (r.ok) return r.json()
        if (r.status === 401) localStorage.removeItem(TOKEN_KEY)
        return null
      })
      .then(data => { if (data?.user) setUser(data.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getXsrf = () =>
    decodeURIComponent(
      document.cookie.split(';').find(c => c.trim().startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
    )

  const login = async (email, password) => {
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' })
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': getXsrf(),
      },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión')
    if (data?.token) localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': getXsrf(),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const hasRole = (role) => user?.roles?.includes(role)
  const hasPermission = (perm) => user?.permissions?.includes(perm)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
