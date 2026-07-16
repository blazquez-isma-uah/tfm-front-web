import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './LoginPage.css'

/**
 * LoginPage — Página de inicio de sesión con comprobación del estado de RDS.
 *
 * Si el usuario no está autenticado, muestra un botón para iniciar sesión
 * que redirige al formulario del proveedor de identidad.
 *
 * Si el usuario ya está autenticado (por ejemplo, tras volver del proveedor de identidad),
 * redirige automáticamente a la ruta original guardada o al dashboard.
 *
 * Maneja la persistencia de la ruta de destino usando sessionStorage, ya que
 * el redirect externo del proveedor de identidad perderá el estado de React Router.
 *
 * En entorno AWS (VITE_AUTH_PROVIDER=cognito), antes de iniciar el login
 * comprueba si la base de datos está disponible llamando a GET /health/database.
 * Si RDS está arrancando, muestra una pantalla de espera con cuenta atrás
 * y reintenta automáticamente cada 30 segundos hasta que esté disponible.
 *
 * En entorno local (VITE_AUTH_PROVIDER=keycloak), omite la comprobación
 * porque RDS no existe en Docker Compose.
 *
 * Estados de la base de datos:
 *   IDLE      — estado inicial, mostrando el formulario de login
 *   CHECKING  — comprobando el estado de RDS (petición en curso)
 *   STARTING  — RDS arrancando, mostrando pantalla de espera con cuenta atrás
 *   ERROR     — fallo de red u otro error inesperado, mostrando botón de reintento
 */

type DbStatus = 'IDLE' | 'CHECKING' | 'STARTING' | 'ERROR'

const IS_LOCAL = import.meta.env.VITE_AUTH_PROVIDER === 'keycloak'

async function checkDatabaseHealth(): Promise<'AVAILABLE' | 'STARTING' | 'ERROR'> {
  try {
    const response = await fetch('/health/database')
    if (!response.ok) return 'ERROR'
    const data = await response.json() as { status: string }
    return data.status === 'AVAILABLE' ? 'AVAILABLE' : 'STARTING'
  } catch {
    return 'ERROR'
  }
}
function LoginPage() {
    const { isAuthenticated, isLoading, login, hasRole } = useAuth()
    const navigate = useNavigate()
    const location = useLocation() as any

  const [dbStatus, setDbStatus]   = useState<DbStatus>('IDLE')
  const [countdown, setCountdown] = useState(30)
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

  // Cuenta atrás y reintento automático mientras RDS está arrancando.
  // Cuando countdown llega a 0, comprueba de nuevo el estado de RDS:
  //   - AVAILABLE → lanza login automáticamente
  //   - STARTING  → reinicia la cuenta atrás (otros 30 segundos)
  //   - ERROR     → muestra pantalla de error con botón de reintento manual
  useEffect(() => {
    if (dbStatus !== 'STARTING') return

    if (countdown === 0) {
      checkDatabaseHealth().then(status => {
        if (status === 'AVAILABLE') {
          login()
        } else if (status === 'ERROR') {
          setDbStatus('ERROR')
        } else {
          setCountdown(30)
        }
      })
      return
    }

    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [dbStatus, countdown, login])

  const handleLoginClick = async () => {
    // En local (Docker Compose) no existe RDS ni el endpoint de health.
    // Se omite la comprobación y se procede directamente con el login.
    if (IS_LOCAL) {
      login()
      return
    }

    setDbStatus('CHECKING')
    const status = await checkDatabaseHealth()
    if (status === 'AVAILABLE') {
      login()
    } else if (status === 'STARTING') {
      setDbStatus('STARTING')
      setCountdown(30)
    } else {
      setDbStatus('ERROR')
    }
  }

  // Pantalla de carga mientras el proveedor de identidad se inicializa
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

  // Pantalla de verificación: petición de health en curso
  if (dbStatus === 'CHECKING') {
    return (
      <div className="login-root">
        <div className="login-card">
          <p className="login-status">Verificando el sistema ...</p>
        </div>
      </div>
    )
  }

  // Pantalla de espera: RDS arrancando, cuenta atrás con reintento automático
  if (dbStatus === 'STARTING') {
    return (
      <div className="login-root">
        <div className="login-card">
          <h1 className="login-title">El sistema está arrancando</h1>
          <p className="login-text">
            La base de datos está iniciando tras un período de inactividad.
            Este proceso puede tardar entre 1 y 5 minutos. El acceso se abrirá
            automáticamente en cuanto esté disponible.
          </p>
          <p className="login-status">
            Comprobando de nuevo en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    )
  }

  // Pantalla de error: fallo de red u error inesperado
  if (dbStatus === 'ERROR') {
    return (
      <div className="login-root">
        <div className="login-card">
          <h1 className="login-title">Error de conexión</h1>
          <p className="login-text">
            No se ha podido comprobar el estado del sistema. Comprueba
            tu conexión a internet e inténtalo de nuevo.
          </p>
          <div className="login-footer">
            <div>
              <div className="login-brand">TFM Bandas</div>
              <div>Panel de gestión y asistencia</div>
            </div>
            <button
              className="login-button"
              onClick={() => { setDbStatus('IDLE') }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Estado IDLE: formulario de login normal
  return (
    <div className="login-root">
      <div className="login-card">
        <h1 className="login-title">Acceso a TFM Bandas</h1>
        <p className="login-subtitle">Sistema de gestión de bandas de música</p>

        <p className="login-subtitle">
          Para acceder a la plataforma inicia sesión con tus credenciales.
        </p>

        <div className="login-footer">
          <div>
            <div className="login-brand">TFM Bandas</div>
          </div>
          <button className="login-button" onClick={handleLoginClick}>
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
