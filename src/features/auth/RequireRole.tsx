import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useToast } from '../../context/ToastContext'

type RequireRoleProps = {
  role: string
  children: React.ReactElement
  redirectTo?: string  // por defecto: '/dashboard'
}

/**
 * RequireRole — Guard de autorización por rol específico.
 *
 * Se usa DENTRO del árbol ya protegido por RequireAuth, por lo que
 * puede asumir que el usuario está autenticado.
 *
 * Diferencia con RequireAuth:
 * - RequireAuth: solo verifica autenticación (¿tiene sesión?).
 * - RequireRole: verifica rol específico (¿es ADMIN?, ¿es MUSICIAN?).
 *
 * Renderiza null durante isLoading para evitar el flash de contenido
 * o de mensajes de error antes de que Keycloak haya terminado de inicializar.
 * Si hasRole() se invoca mientras isLoading es true, puede devolver false
 * incorrectamente porque el token aún no está disponible.
 *
 * Una vez resuelto, redirige a redirectTo si el usuario no tiene el rol
 * requerido, o renderiza children si lo tiene.
 */
function RequireRole({ role, children, redirectTo }: RequireRoleProps) {
  const { isLoading, hasRole } = useAuth()
  const { showToast } = useToast()
  const toastShownRef = useRef(false)

  // Muestra un toast cuando detectamos falta de permisos, antes de redirigir.
  // Se usa un ref para evitar mostrar el toast múltiples veces si el componente
  // se re-renderiza antes de que el Navigate tome efecto.
  if (!isLoading && !hasRole(role) && !toastShownRef.current) {
    toastShownRef.current = true
    // setTimeout(..., 0): ejecuta en el siguiente tick del event loop para evitar
    // el warning de React sobre actualizar estado (del ToastContext) durante render.
    setTimeout(() => {
      showToast('No tienes permisos para acceder a esta sección', 'warning')
    }, 0)
  }

  // Limpia el flag cuando el componente se desmonta, para que si el usuario
  // vuelve más tarde, el toast pueda mostrarse de nuevo si sigue sin permisos.
  useEffect(() => {
    return () => {
      toastShownRef.current = false
    }
  }, [])

  // Mientras Keycloak se está inicializando, no renderiza nada.
  // Esto evita el flash de contenido o mensajes de error antes de saber
  // si el usuario tiene el rol requerido.
  if (isLoading) {
    return null
  }

  // Si el usuario no tiene el rol, redirige al dashboard u otra ruta especificada
  if (!hasRole(role)) {
    return <Navigate to={redirectTo ?? '/dashboard'} replace />
  }

  // Si tiene el rol, renderiza el contenido protegido
  return children
}

export default RequireRole
