import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './features/layout/MainLayout'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/layout/DashboardPage'
import UsersPage from './features/users/UsersPage'
import ProfilePage from './features/users/ProfilePage'
import InstrumentsPage from './features/instruments/InstrumentsPage'
import EventsPage from './features/events/EventsPage'
import SurveysPage from './features/surveys/SurveysPage'
import MySurveysPage from './features/surveys/MySurveysPage'
import { AuthProvider } from './features/auth/AuthContext'
import RequireAuth from './features/auth/RequireAuth'

function App() {
  return (
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
          
          {/* Zona común - todos los usuarios autenticados */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="surveys" element={<MySurveysPage />} />
          <Route path="scores" element={<div>Partituras - Por implementar</div>} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Zona administrador - solo usuarios con rol ADMIN */}
          <Route path="admin/users" element={<UsersPage />} />
          <Route path="admin/instruments" element={<InstrumentsPage />} />
          <Route path="admin/events" element={<EventsPage />} />
          <Route path="admin/surveys" element={<SurveysPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
