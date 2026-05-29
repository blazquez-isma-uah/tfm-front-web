import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './LoginPage.css'

/**
 * LoginPage — Página de inicio de sesión y redirección post-autenticación.
 *
 * Si el usuario no está autenticado, muestra un botón para iniciar sesión
 * que redirige al formulario del proveedor de identidad.
 *
 * Si el usuario ya está autenticado (por ejemplo, tras volver del proveedor de identidad),
 * redirige automáticamente a la ruta original guardada o al dashboard.
 *
 * Maneja la persistencia de la ruta de destino usando sessionStorage, ya que
 * el redirect externo del proveedor de identidad perderá el estado de React Router.
 */
function LoginPage() {
    const { isAuthenticated, isLoading, login, hasRole } = useAuth()
    const navigate = useNavigate()
    const location = useLocation() as any

    // Redirige al usuario autenticado a la página de destino o al dashboard
    useEffect(() => {
        // Mientras proveedor de identidad se está inicializando, no hacemos nada
        if (isLoading) return
        // Si no está autenticado, permanece en la página de login
        if (!isAuthenticated) return

        // Intenta recuperar la URL guardada en sessionStorage.
        // Esta ruta sobrevive al redirect externo del proveedor de identidad, a diferencia
        // del location.state de React Router que se pierde.
        const savedRedirect = sessionStorage.getItem('redirectAfterLogin')
        if (savedRedirect && savedRedirect !== '/login') {
            sessionStorage.removeItem('redirectAfterLogin')
            navigate(savedRedirect, { replace: true })
            return
        }

        // Si no hay savedRedirect, intenta usar location.state (funciona solo
        // en navegación interna sin reload, por ejemplo, desde RequireAuth)
        const from = location.state?.from?.pathname as string | undefined
        if (from && from !== '/login') {
            navigate(from, { replace: true })
            return
        }

        navigate('/dashboard', { replace: true })
  }, [isAuthenticated, isLoading, hasRole, location.state, navigate])

    // Mientras proveedor de identidad se inicializa, muestra un mensaje de carga
    if (isLoading) {
        return (
            <div className="login-root">
                <div className="login-card">
                    <p className="login-status">Comprobando sesión...</p>
                </div>
            </div>
        )
    }

    // Si ya está autenticado, muestra un mensaje temporal mientras el useEffect
    // redirige al usuario (esto evita el flash del botón de login)
    if (isAuthenticated) {
        return (
            <div className="login-root">
                <div className="login-card">
                    <p className="login-status">Redirigiendo a la aplicación...</p>
                </div>
            </div>
        )
    }

  return (
    <div className="login-root">
      <div className="login-card">
        <h1 className="login-title">Acceso a TFM Bandas</h1>
        {/* Texto genérico — no menciona el proveedor específico */}
        <p className="login-subtitle">Sistema de gestión de bandas de música</p>

        <p className="login-text">
          Para acceder a la plataforma inicia sesión con tus credenciales.
          Serás redirigido al servidor de autenticación y, tras verificar
          tu identidad, volverás automáticamente a la aplicación.
        </p>

        <div className="login-footer">
          <div>
            <div className="login-brand">TFM Bandas</div>
            <div>Panel de gestión y asistencia</div>
          </div>
          <button className="login-button" onClick={login}>
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
