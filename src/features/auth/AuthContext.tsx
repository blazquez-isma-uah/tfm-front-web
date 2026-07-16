import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

// ─── Imports Keycloak ─────────────────────────────────────────────────────────
import keycloak from './keycloak'

// ─── Imports Cognito / Amplify v6 ─────────────────────────────────────────────
import { Amplify } from 'aws-amplify'
import {
  signInWithRedirect,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

// ─── Selector de proveedor (resuelto en tiempo de compilación por Vite) ────────
const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER ?? 'keycloak'


// Tiempo de inactividad tras el cual se fuerza logout automático, 
// independientemente de que el token siga siendo técnicamente válido.
const IDLE_TIMEOUT_MINUTES = 2
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000

// Eventos que cuentan como "actividad real" del usuario.
// Se excluye mousemove deliberadamente: dispara con demasiada frecuencia
// y no implica que el usuario esté realmente atendiendo a la pantalla.
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const

/**
 * useIdleLogout — cierra sesión tras IDLE_TIMEOUT_MS sin actividad del usuario.
 * Independiente del refresco proactivo de token: el token puede seguir siendo
 * válido y aun así forzamos logout si no hay interacción real con la pantalla.
 */
function useIdleLogout(onIdle: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    let timeoutId: number

    const resetTimer = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(onIdle, IDLE_TIMEOUT_MS)
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      window.clearTimeout(timeoutId)
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer))
    }
  }, [enabled, onIdle])
}

/**
 * Configuración de Amplify.
 * Se ejecuta una sola vez al cargar el módulo, solo en el perfil cognito.
 * En el perfil docker, Amplify se importa pero no se configura ni se usa.
 */
if (AUTH_PROVIDER === 'cognito') {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        loginWith: {
          oauth: {
            // El dominio de la Hosted UI de Cognito (sin https://)
            domain: import.meta.env.VITE_COGNITO_DOMAIN,
            scopes: ['openid', 'email', 'profile'],
            // URLs a las que Cognito puede redirigir tras login/logout
            redirectSignIn: [window.location.origin],
            redirectSignOut: [window.location.origin + '/login'],
            // PKCE: Authorization Code + code_challenge (equivalente al S256 de Keycloak)
            responseType: 'code',
          },
        },
      },
    },
  })
}

// ─── Tipo del contexto — idéntico para ambos proveedores ─────────────────────
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

// =============================================================================
// AuthProvider — Selecciona la implementación según VITE_AUTH_PROVIDER
// =============================================================================

/**
 * AuthProvider — Punto de entrada único para la autenticación.
 *
 * Selecciona la implementación concreta en función de la variable de entorno
 * VITE_AUTH_PROVIDER, resuelta en tiempo de compilación por Vite:
 *   - "keycloak" → KeycloakAuthProvider (Docker Compose, desarrollo local)
 *   - "cognito"  → CognitoAuthProvider  (AWS Lambda, producción)
 *
 * El resto de la aplicación (RequireAuth, RequireRole, API calls) usa
 * useAuth() sin saber qué proveedor está activo.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (AUTH_PROVIDER === 'cognito') {
    return <CognitoAuthProvider>{children}</CognitoAuthProvider>
  }
  return <KeycloakAuthProvider>{children}</KeycloakAuthProvider>
}

// =============================================================================
// KeycloakAuthProvider — Docker Compose (VITE_AUTH_PROVIDER=keycloak)
// =============================================================================

/**
 * Implementación de autenticación con Keycloak para el entorno local.
 * Lógica equivalente a la implementación original, sin cambios de comportamiento.
 */
const KeycloakAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    keycloak
      .init({ onLoad: 'check-sso', pkceMethod: 'S256' })
      .then((authenticated) => {
        setIsAuthenticated(authenticated)
        if (authenticated) setToken(keycloak.token)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const refreshTokenIfNeeded = async () => {
    try {
      if (!keycloak.token) return
      const refreshed = await keycloak.updateToken(30)
      if (refreshed) setToken(keycloak.token)
    } catch (e) {
      console.error('Error refreshing Keycloak token', e)
      setIsAuthenticated(false)
      setToken(undefined)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    const intervalId = window.setInterval(refreshTokenIfNeeded, 20000)
    return () => window.clearInterval(intervalId)
  }, [isAuthenticated])

  const login = () => keycloak.login({ redirectUri: window.location.origin + '/' })
  const logout = () => keycloak.logout({ redirectUri: window.location.origin + '/login' })

  // Cierre de sesión automático tras IDLE_TIMEOUT_MS sin actividad del usuario.
  useIdleLogout(logout, isAuthenticated)

  // Roles en Keycloak: realm_access.roles en el JWT
  const hasRole = (role: string) =>
    (keycloak.tokenParsed?.realm_access?.roles ?? []).includes(role)

  const userName =
    (keycloak.tokenParsed?.preferred_username as string | undefined) ??
    (keycloak.tokenParsed?.email as string | undefined)

  const value = useMemo<AuthContextValue>(
    () => ({ isLoading, isAuthenticated, token, userName, hasRole, login, logout }),
    [isLoading, isAuthenticated, token, userName],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// =============================================================================
// CognitoAuthProvider — AWS Lambda (VITE_AUTH_PROVIDER=cognito)
// =============================================================================

/**
 * Implementación de autenticación con Amazon Cognito via Amplify v6.
 *
 * Flujo de autenticación:
 * 1. El usuario hace clic en "Iniciar sesión" → signInWithRedirect()
 * 2. Cognito muestra la Hosted UI → el usuario se autentica
 * 3. Cognito redirige a window.location.origin + '/' con ?code=xxx
 * 4. Amplify detecta el callback, intercambia el código por tokens (PKCE)
 * 5. Hub emite 'signedIn' → applySession() actualiza el estado de React
 *
 * Diferencias con Keycloak:
 * - Los roles están en el claim "cognito:groups" (no en realm_access.roles)
 * - El username se obtiene de getCurrentUser() (no de preferred_username)
 * - El logout redirige al logout endpoint de Cognito antes de volver a /login
 */
const CognitoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | undefined>(undefined)
  const [groups, setGroups] = useState<string[]>([])
  const [userName, setUserName] = useState<string | undefined>(undefined)

  /**
   * Lee la sesión actual de Amplify y actualiza el estado de React.
   * Llamado al montar el componente, en eventos Hub y cada 20 segundos.
   */
  const applySession = async () => {
    try {
      const session = await fetchAuthSession()
      const accessToken = session.tokens?.accessToken

      if (accessToken) {
        setIsAuthenticated(true)
        setToken(accessToken.toString())
        // Roles en Cognito: claim cognito:groups en el access token
        setGroups((accessToken.payload['cognito:groups'] as string[] | undefined) ?? [])
        try {
          const user = await getCurrentUser()
          setUserName(user.username)
        } catch {
          setUserName(undefined)
        }
      } else {
        setIsAuthenticated(false)
        setToken(undefined)
        setGroups([])
        setUserName(undefined)
      }
    } catch {
      setIsAuthenticated(false)
      setToken(undefined)
      setGroups([])
      setUserName(undefined)
    }
  }

  useEffect(() => {
    /**
     * Hub.listen escucha eventos del ciclo de vida de autenticación de Cognito:
     * - signedIn:             usuario autenticado (incluyendo tras OAuth callback)
     * - signedOut:            usuario cerró sesión
     * - tokenRefresh:         Amplify renovó el token automáticamente
     * - tokenRefresh_failure: falló la renovación → forzar logout
     */
    const unsubscribe = Hub.listen('auth', async ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
        case 'tokenRefresh':
          await applySession()
          break
        case 'signedOut':
          setIsAuthenticated(false)
          setToken(undefined)
          setGroups([])
          setUserName(undefined)
          break
        case 'tokenRefresh_failure':
          setIsAuthenticated(false)
          setToken(undefined)
          setGroups([])
          setUserName(undefined)
          break
      }
    })

    // Verificar sesión existente al cargar (recupera sesión SSO si existe)
    applySession().finally(() => setIsLoading(false))

    return () => unsubscribe()
  }, [])

  // Renovación proactiva cada 20 segundos — espejo del comportamiento de Keycloak.
  // fetchAuthSession() gestiona internamente el refresh con el refresh token.
  useEffect(() => {
    if (!isAuthenticated) return
    const intervalId = window.setInterval(applySession, 20000)
    return () => window.clearInterval(intervalId)
  }, [isAuthenticated])

  const login = () => signInWithRedirect()

  // signOut() en Cognito con Hosted UI redirige al logout endpoint de Cognito,
  // que invalida la sesión y redirige a la logoutUrl configurada (/login).
  const logout = () => signOut().catch(console.error)

  // Cierre de sesión automático tras IDLE_TIMEOUT_MS sin actividad del usuario.
  useIdleLogout(logout, isAuthenticated)

  // Roles en Cognito: claim cognito:groups en el access token
  const hasRole = (role: string) => groups.includes(role)

  const value = useMemo<AuthContextValue>(
    () => ({ isLoading, isAuthenticated, token, userName, hasRole, login, logout }),
    [isLoading, isAuthenticated, token, userName, groups],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// =============================================================================
// useAuth — Hook de consumo, idéntico para ambos proveedores
// =============================================================================

/**
 * useAuth — Hook para consumir el contexto de autenticación.
 * Debe usarse dentro de un componente descendiente de AuthProvider.
 */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}