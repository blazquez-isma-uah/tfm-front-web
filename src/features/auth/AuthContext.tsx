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

/**
 * AuthProvider — Proveedor de contexto de autenticación con Keycloak.
 *
 * Expone en el contexto:
 * - isLoading: verdadero mientras Keycloak se está inicializando.
 * - isAuthenticated: verdadero si el usuario tiene sesión activa.
 * - token: token de acceso JWT actual (undefined si no hay sesión).
 * - userName: nombre de usuario preferido o email extraído del token.
 * - hasRole(role): función que verifica si el usuario tiene un rol específico en el realm.
 * - login(): inicia el flujo de autenticación de Keycloak.
 * - logout(): cierra sesión y redirige al usuario.
 *
 * Renovación automática de token:
 * Cada 20 segundos, si el usuario está autenticado, se verifica si el token
 * caduca en menos de 30 segundos. Si es así, se renueva automáticamente.
 * Esto garantiza que las peticiones a backend siempre usen un token válido.
 *
 * check-sso vs login-required:
 * Se usa check-sso en keycloak.init para no forzar el login al cargar la app.
 * Con check-sso, si el usuario ya tiene sesión en Keycloak (SSO), se recupera
 * automáticamente; si no, permanece en la pantalla actual sin redirigir.
 * Con login-required se redirige obligatoriamente al formulario de Keycloak.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | undefined>(undefined)

  // Inicialización de Keycloak: se ejecuta una sola vez al montar el componente
  useEffect(() => {
    keycloak
      .init({
        // check-sso: no fuerza login al cargar. Si hay sesión SSO activa, la recupera;
        // si no, deja al usuario en la página actual sin redirigir a Keycloak.
        onLoad: 'check-sso',
        // pkceMethod: método de seguridad para el flujo OAuth2 (S256 es el estándar actual)
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

  // Función para renovar el token si está próximo a expirar
  const refreshTokenIfNeeded = async () => {
    try {
      if (!keycloak.token) return
      // updateToken(30): renueva el token si caduca en menos de 30 segundos.
      // Devuelve true si se renovó, false si aún es válido.
      const refreshed = await keycloak.updateToken(30)
      if (refreshed) {
        // Actualizamos el token en estado para que los componentes que dependen
        // de él reciban el nuevo valor y relancen sus peticiones.
        setToken(keycloak.token)
      }
    } catch (e) {
      // Si falla la renovación (token de refresco inválido o caducado),
      // cerramos la sesión localmente y forzamos al usuario a reautenticarse.
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

  // Verifica si el usuario tiene un rol específico en el realm de Keycloak
  const hasRole = (role: string) => {
    // Extrae los roles del realm desde el token JWT parseado.
    // Si tokenParsed no existe o realm_access es undefined, usa un array vacío.
    const realmRoles = keycloak.tokenParsed?.realm_access?.roles || []
    return realmRoles.includes(role)
  }

  const userName =
    (keycloak.tokenParsed?.preferred_username as string | undefined) ??
    (keycloak.tokenParsed?.email as string | undefined)

  // Configura un intervalo para renovar el token automáticamente cada 20 segundos.
  // Esto garantiza que el token siempre esté vigente antes de que expire.
  useEffect(() => {
    if (!isAuthenticated) return

    // Cada 20 segundos, verifica si el token caduca en menos de 30 segundos.
    // Si es así, lo renueva automáticamente. Esto mantiene las peticiones al
    // backend siempre con un token válido sin interrupciones para el usuario.
    const intervalId = window.setInterval(() => {
      refreshTokenIfNeeded()
    }, 20000)

    // Limpia el intervalo al desmontar o si el usuario cierra sesión
    return () => window.clearInterval(intervalId)
  }, [isAuthenticated])

  // Memoiza el objeto del contexto para evitar re-renderizados innecesarios
  // de los componentes consumidores. Solo se recrea cuando cambian las
  // dependencias (isLoading, isAuthenticated, token, userName).
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

/**
 * useAuth — Hook para consumir el contexto de autenticación.
 *
 * Debe usarse dentro de un componente descendiente de AuthProvider.
 * Si se invoca fuera, lanza un error para evitar comportamientos inesperados.
 */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
