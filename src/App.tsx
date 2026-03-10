import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './features/layout/MainLayout'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/layout/DashboardPage'
import UsersPage from './features/users/UsersPage'
import ProfilePage from './features/users/ProfilePage'
import InstrumentsPage from './features/instruments/InstrumentsPage'
import EventsPage from './features/events/EventsPage'
import MyEventsPage from './features/events/MyEventsPage'
import SurveysPage from './features/surveys/SurveysPage'
import MySurveysPage from './features/surveys/MySurveysPage'
import { AuthProvider } from './features/auth/AuthContext'
import RequireAuth from './features/auth/RequireAuth'
import RequireRole from './features/auth/RequireRole'
import { ToastProvider } from './context/ToastContext'

/**
 * Orden de providers:
 *   BrowserRouter (en main.tsx)
 *     └─ ToastProvider   ← UI global, no depende de auth
 *          └─ AuthProvider
 *               └─ Routes
 *
 * ToastProvider envuelve AuthProvider (y no al revés) porque los toasts
 * son una capa de UI pura, independiente del estado de autenticación.
 * AuthProvider podría en teoría llamar a showToast si necesitara
 * notificar al usuario de expiración de sesión, por ejemplo.
 */
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* Zona común — todos los usuarios autenticados */}
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="events"    element={<MyEventsPage />} />
            <Route path="surveys"    element={<MySurveysPage />} />
            <Route path="scores"     element={<div>Partituras — Por implementar</div>} />
            <Route path="profile"    element={<ProfilePage />} />

            {/* Zona administrador — solo usuarios con rol ADMIN */}
            <Route path="admin/users"       element={<RequireRole role="ADMIN"><UsersPage /></RequireRole>} />
            <Route path="admin/instruments" element={<RequireRole role="ADMIN"><InstrumentsPage /></RequireRole>} />
            <Route path="admin/events"      element={<RequireRole role="ADMIN"><EventsPage /></RequireRole>} />
            <Route path="admin/surveys"     element={<RequireRole role="ADMIN"><SurveysPage /></RequireRole>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App