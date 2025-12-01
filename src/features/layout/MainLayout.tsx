import { NavLink, Outlet } from 'react-router-dom'
import './MainLayout.css'
import { useAuth } from '../auth/AuthContext'

function MainLayout() {
    const { logout, userName } = useAuth()

    const handleLogout = () => {
        logout()
    }

    return (
        <div className="layout-root">
            <header className="layout-header">
                <div className="layout-header-left">
                    <span className="layout-logo">TFM Bandas</span>
                    <span className="layout-title">Panel de gestión</span>
                </div>
                <div className="layout-header-right">
                    {userName && <span style={{ fontSize: '0.85rem' }}>{userName}</span>}
                    <button className="layout-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="layout-body">
                <nav className="layout-sidebar">
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
                    </div>

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

                    <div className="menu-section">
                        <div className="menu-section-title">Músico</div>
                        <NavLink
                            to="/me/events"
                            className={({ isActive }) =>
                                'menu-link' + (isActive ? ' menu-link-active' : '')
                            }
                        >
                            Mis eventos
                        </NavLink>
                        <NavLink
                            to="/me/surveys"
                            className={({ isActive }) =>
                                'menu-link' + (isActive ? ' menu-link-active' : '')
                            }
                        >
                            Mis encuestas
                        </NavLink>
                    </div>
                </nav>

                <main className="layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default MainLayout
