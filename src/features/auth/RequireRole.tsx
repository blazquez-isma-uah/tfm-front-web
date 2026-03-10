import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useToast } from '../../context/toast/ToastContext'

type RequireRoleProps = {
  role: string
  children: React.ReactElement
  redirectTo?: string  // por defecto: '/dashboard'
}

/**
 * RequireRole — Guard de autorización por rol.
 *
 * Se usa DENTRO del árbol ya protegido por RequireAuth, por lo que
 * puede asumir que el usuario está autenticado.
 *
 * Renderiza null durante isLoading para evitar el flash de contenido
 * o de mensajes de error antes de que Keycloak haya resuelto los roles.
 * Una vez resuelto, redirige a redirectTo si el usuario no tiene el rol
 * requerido, o renderiza children si lo tiene.
 */
function RequireRole({ role, children, redirectTo }: RequireRoleProps) {
  const { isLoading, hasRole } = useAuth()
  const { showToast } = useToast()
  const toastShownRef = useRef(false)

  // Mostrar toast síncronamente cuando detectamos falta de permisos
  // ANTES de renderizar el Navigate
  if (!isLoading && !hasRole(role) && !toastShownRef.current) {
    toastShownRef.current = true
    // Ejecutar en el siguiente tick para evitar warning de React sobre
    // actualizar estado durante render
    setTimeout(() => {
      showToast('No tienes permisos para acceder a esta sección', 'warning')
    }, 0)
  }

  // Resetear flag cuando el usuario sale de este guard
  useEffect(() => {
    return () => {
      toastShownRef.current = false
    }
  }, [])

  if (isLoading) {
    return null
  }

  if (!hasRole(role)) {
    return <Navigate to={redirectTo ?? '/dashboard'} replace />
  }

  return children
}

export default RequireRole
