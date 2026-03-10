import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

type RequireAuthProps = {
  children: React.ReactElement
}

function RequireAuth({ children }: RequireAuthProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Cargando sesión...</div>
  }

  if (!isAuthenticated) {
    // Guardamos dónde quería ir en sessionStorage porque el redirect externo
    // de Keycloak perderá el location.state
    if (location.pathname !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', location.pathname)
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default RequireAuth
