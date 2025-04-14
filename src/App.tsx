import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import UsersList from './pages/modules/Users/UsersList'
import UserDetail from './pages/modules/Users/UserDetail'
import ResetPassword from './pages/ResetPassword'
import Login from './pages/Login'
import MapIndicator from './pages/modules/Maps/MapsIndicator'
import NotificationDetail from './pages/modules/Notifications/NotificationDetail'

// Función para verificar si el usuario está autenticado
const isAuthenticated = (): boolean => {
  // En una aplicación real, verificaría el token JWT, la sesión, etc.
  return localStorage.getItem('token') !== null
}

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Rutas protegidas con MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* Rutas para módulo de usuarios */}
        <Route path="users">
          <Route index element={<UsersList />} />
          <Route path=":id" element={<UserDetail />} />
        </Route>

         {/* Rutas para el modulo maps */}
      <Route path="maps" element={<MapIndicator />} />
      <Route path="/notificaciones/:id" element={<NotificationDetail />} />

      </Route>


     

      
      {/* Redireccionar cualquier ruta no encontrada al dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

