import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import keycloak from './keycloak'

type AuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  token: string | undefined
  userName: string | undefined
  hasRole: (role: string) => boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso', // no forzamos login al cargar, lo decide el usuario
        pkceMethod: 'S256',
      })
      .then((authenticated) => {
        setIsAuthenticated(authenticated)
        if (authenticated) {
          setToken(keycloak.token)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const refreshTokenIfNeeded = async () => {
    try {
      if (!keycloak.token) return
      const refreshed = await keycloak.updateToken(30) // refresca si caduca en < 30s
      if (refreshed) {
        setToken(keycloak.token)
      }
    } catch (e) {
      console.error('Error refreshing token', e)
      setIsAuthenticated(false)
      setToken(undefined)
    }
  }

  const login = () => {
    keycloak.login({
      redirectUri: window.location.origin + '/',
    })
  }

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin + '/login',
    })
  }

  const hasRole = (role: string) => {
    const realmRoles = keycloak.tokenParsed?.realm_access?.roles || []
    return realmRoles.includes(role)
  }

  const userName =
    (keycloak.tokenParsed?.preferred_username as string | undefined) ??
    (keycloak.tokenParsed?.email as string | undefined)

  // Opcional: refrescar token periódicamente
  useEffect(() => {
    if (!isAuthenticated) return

    const intervalId = window.setInterval(() => {
      refreshTokenIfNeeded()
    }, 20000) // cada 20s

    return () => window.clearInterval(intervalId)
  }, [isAuthenticated])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      token,
      userName,
      hasRole,
      login,
      logout,
    }),
    [isLoading, isAuthenticated, token, userName],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
