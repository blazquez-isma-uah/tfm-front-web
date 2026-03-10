import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './MainLayout.css'
import { useAuth } from '../auth/AuthContext'

/**
 * MainLayout — Estructura principal de la aplicación.
 *
 * Estructura del layout:
 * - Header: barra superior con logo, botón hamburguesa (móvil), usuario y logout.
 * - Sidebar/Drawer: menú de navegación lateral.
 * - Contenido principal: área donde se renderizan las rutas hijas (Outlet).
 *
 * Comportamiento responsive:
 * - Móvil (< 768px): el sidebar es un drawer (cajón deslizante) que se abre
 *   con el botón hamburguesa. Un overlay oscuro cubre el contenido cuando
 *   el drawer está abierto.
 * - Tablet y superior (>= 768px): el sidebar es fijo y siempre visible.
 *   El botón hamburguesa y el overlay están ocultos por CSS.
 *
 * El drawer se cierra automáticamente al cambiar de ruta, para que el usuario
 * vea el contenido inmediatamente tras pulsar un enlace de navegación.
 */
function MainLayout() {
    const { logout, userName, hasRole } = useAuth()
    const location = useLocation()
    const isAdmin = hasRole('ADMIN')

    // Estado que controla si el drawer está abierto o cerrado en móvil
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Cierra el drawer automáticamente al cambiar de ruta.
    // Esto garantiza que el usuario vea el nuevo contenido inmediatamente
    // tras pulsar un enlace de navegación, sin tener que cerrar el menú manualmente.
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location.pathname])

    // Bloquea el scroll del body mientras el drawer está abierto en móvil.
    // Esto evita que el fondo de la página se desplace mientras el usuario
    // navega por el menú, mejorando la experiencia en dispositivos táctiles.
    useEffect(() => {
        if (isMobileMenuOpen) {
            // Deshabilita el scroll vertical del body
            document.body.style.overflow = 'hidden'
        } else {
            // Restaura el comportamiento de scroll por defecto
            document.body.style.overflow = ''
        }
        // Limpieza: restaura el overflow al desmontar el componente, para evitar
        // que el body quede con scroll bloqueado si MainLayout se desmonta mientras
        // el drawer estaba abierto.
        return () => {
            document.body.style.overflow = ''
        }
    }, [isMobileMenuOpen])

    const handleLogout = () => {
        logout()
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev)
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }

    return (
        <div className="layout-root">

            {/* ── HEADER ─────────────────────────────────────────── */}
            <header className="layout-header">
                <div className="layout-header-left">
                    {/* Botón hamburguesa: visible solo en móvil (< 768px).
                        En tablet y superior se oculta con display: none desde CSS. */}
                    <button
                        className={`layout-hamburger ${isMobileMenuOpen ? 'is-open' : ''}`}
                        onClick={toggleMobileMenu}
                        aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="main-sidebar"
                    >
                        <span className="layout-hamburger-line" />
                        <span className="layout-hamburger-line" />
                        <span className="layout-hamburger-line" />
                    </button>

                    <span className="layout-logo">TFM Bandas</span>
                </div>

                <div className="layout-header-right">
                    {userName && (
                        <span className="layout-username" title={userName}>
                            {userName}
                        </span>
                    )}
                    <button className="layout-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* ── CUERPO (sidebar + contenido) ───────────────────── */}
            <div className="layout-body">

                {/* Overlay: capa semitransparente que cubre el contenido cuando el drawer
                    está abierto en móvil. Al hacer click en el overlay, se cierra el menú.
                    En tablet y superior, el overlay está oculto por CSS. */}
                <div
                    className={`layout-sidebar-overlay ${isMobileMenuOpen ? 'is-visible' : ''}`}
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />

                {/* ── SIDEBAR / DRAWER ─────────────────────────────── */}
                <nav
                    id="main-sidebar"
                    className={`layout-sidebar ${isMobileMenuOpen ? 'is-open' : ''}`}
                    aria-label="Navegación principal"
                >
                    {/* Sección General: accesible por todos los usuarios */}
                    <div className="menu-section">
                        <div className="menu-section-title">General</div>

                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                'menu-link' + (isActive ? ' menu-link-active' : '')
                            }
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/events"
                            className={({ isActive }) =>
                                'menu-link' + (isActive ? ' menu-link-active' : '')
                            }
                        >
                            Eventos
                        </NavLink>
                        <NavLink
                            to="/surveys"
                            className={({ isActive }) =>
                                'menu-link' + (isActive ? ' menu-link-active' : '')
                            }
                        >
                            Encuestas
                        </NavLink>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                'menu-link' + (isActive ? ' menu-link-active' : '')
                            }
                        >
                            Mi perfil
                        </NavLink>
                    </div>

                    {/* Sección Administración: solo para usuarios con rol ADMIN */}
                    {isAdmin && (
                        <div className="menu-section">
                            <div className="menu-section-title">Administración</div>

                            <NavLink
                                to="/admin/users"
                                className={({ isActive }) =>
                                    'menu-link' + (isActive ? ' menu-link-active' : '')
                                }
                            >
                                Usuarios
                            </NavLink>
                            <NavLink
                                to="/admin/instruments"
                                className={({ isActive }) =>
                                    'menu-link' + (isActive ? ' menu-link-active' : '')
                                }
                            >
                                Instrumentos
                            </NavLink>
                            <NavLink
                                to="/admin/events"
                                className={({ isActive }) =>
                                    'menu-link' + (isActive ? ' menu-link-active' : '')
                                }
                            >
                                Eventos
                            </NavLink>
                            <NavLink
                                to="/admin/surveys"
                                className={({ isActive }) =>
                                    'menu-link' + (isActive ? ' menu-link-active' : '')
                                }
                            >
                                Encuestas
                            </NavLink>
                        </div>
                    )}
                </nav>

                {/* ── CONTENIDO PRINCIPAL ──────────────────────────── */}
                <main className="layout-content" id="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default MainLayout