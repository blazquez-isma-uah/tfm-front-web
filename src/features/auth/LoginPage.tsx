import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './LoginPage.css'

function LoginPage() {
    const { isAuthenticated, isLoading, login, hasRole } = useAuth()
    const navigate = useNavigate()
    const location = useLocation() as any

    // Si ya está autenticado, redirigimos según rol
    useEffect(() => {
        if (isLoading) return
        if (!isAuthenticated) return

        // Si venía de una ruta concreta, podríamos usarla:
        const from = location.state?.from?.pathname as string | undefined

        if (from && from !== '/login') {
            navigate(from, { replace: true })
            return
        }

        // Redirección por rol
        if (hasRole('ADMIN')) {
            navigate('/admin/events', { replace: true })
        } else if (hasRole('MUSICIAN')) {
            navigate('/me/events', { replace: true })
        } else {
            // fallback: dashboard
            navigate('/dashboard', { replace: true })
        }
    }, [isAuthenticated, isLoading, hasRole, location.state, navigate])

    if (isLoading) {
        return (
            <div className="login-root">
                <div className="login-card">
                    <p className="login-status">Comprobando sesión...</p>
                </div>
            </div>
        )
    }

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
                <p className="login-subtitle">Autenticación centralizada con Keycloak</p>

                <p className="login-text">
                    Para acceder a la plataforma se utiliza el sistema de identidad
                    corporativo basado en Keycloak. Al iniciar sesión serás redirigido a
                    la página de login segura del servidor de identidad y, tras
                    autenticarte, volverás automáticamente a la aplicación.
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
