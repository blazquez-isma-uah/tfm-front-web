import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

type RequireAuthProps = {
  children: React.ReactElement
}

/**
 * RequireAuth — Guard de autenticación básico.
 *
 * Protege rutas que requieren que el usuario esté autenticado,
 * sin verificar roles específicos.
 *
 * Diferencia con RequireRole:
 * - RequireAuth: solo verifica autenticación (¿tiene sesión?).
 * - RequireRole: verifica autenticación + rol específico (¿es ADMIN?).
 *
 * Renderiza un spinner durante isLoading para evitar redirecciones
 * incorrectas. Si proveedor de identidad de identidad aún está inicializando, isAuthenticated
 * puede ser false temporalmente aunque el usuario tenga sesión.
 * Esperar a que termine la inicialización garantiza decisiones correctas.
 */
function RequireAuth({ children }: RequireAuthProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Mientras proveedor de identidad se está inicializando, muestra un mensaje de carga.
  // Esto evita redirigir al login antes de saber si el usuario tiene sesión.
  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Cargando sesión...</div>
  }

  // Si no está autenticado, guarda la ruta actual y redirige al login
  if (!isAuthenticated) {
    // sessionStorage sobrevive al redirect externo del proveedor de identidad, a diferencia
    // del location.state de React Router que se pierde.
    if (location.pathname !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', location.pathname)
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Si está autenticado, renderiza el contenido protegido
  return children
}

export default RequireAuth
