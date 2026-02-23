import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './MainLayout.css'
import { useAuth } from '../auth/AuthContext'

/**
 * MainLayout — Estructura principal de la aplicación.
 *
 * En móvil: el sidebar es un drawer (cajón deslizante) controlado
 * por un botón hamburguesa en el header. Un overlay oscuro
 * tapa el contenido cuando el drawer está abierto.
 *
 * En tablet (768px+): el sidebar siempre está visible.
 * El botón hamburguesa y el overlay están ocultos por CSS.
 *
 * El drawer se cierra automáticamente al cambiar de ruta,
 * para que el usuario vea el contenido nada más pulsar un link.
 */
function MainLayout() {
    const { logout, userName, hasRole } = useAuth()
    const location = useLocation()
    const isAdmin = hasRole('ADMIN')

    // Estado del drawer en móvil
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Cierra el drawer automáticamente al navegar a otra ruta
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location.pathname])

    // Bloquea el scroll del body cuando el drawer está abierto
    // (evita que el fondo se desplace mientras el usuario usa el menú)
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        // Limpieza al desmontar el componente
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
                    {/* Botón hamburguesa: solo visible en móvil (ocultado por CSS en tablet+) */}
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

                {/* Overlay: tapa el contenido cuando el drawer está abierto en móvil.
                    Al hacer click, cierra el menú. */}
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
                            to="/scores"
                            className={({ isActive }) =>
                                'menu-link' + (isActive ? ' menu-link-active' : '')
                            }
                        >
                            Partituras
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