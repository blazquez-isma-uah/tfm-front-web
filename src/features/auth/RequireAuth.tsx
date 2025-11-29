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
    // guardamos dónde quería ir para un posible uso futuro
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default RequireAuth
