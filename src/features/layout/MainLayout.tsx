import { NavLink, Outlet } from 'react-router-dom'
import './MainLayout.css'
import { useAuth } from '../auth/AuthContext'

function MainLayout() {
    const { logout, userName, hasRole } = useAuth()

    const isAdmin = hasRole('ADMIN')

    const handleLogout = () => {
        logout()
    }

    return (
        <div className="layout-root">
            <header className="layout-header">
                <div className="layout-header-left">
                    <span className="layout-logo">TFM Bandas</span>
                </div>
                <div className="layout-header-right">
                    {userName && <span style={{fontWeight: 'bold', fontSize: '1rem' }}>{userName}</span>}
                    <button className="layout-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="layout-body">
                <nav className="layout-sidebar">
                    {/* Zona común - todos los usuarios autenticados */}
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

                    {/* Zona administrador - solo usuarios con rol ADMIN */}
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

                <main className="layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default MainLayout
