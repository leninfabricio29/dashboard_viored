import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import authService from "./services/auth-service";
import userService from "./services/user-service";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import UsersList from "./pages/modules/Users/UsersList";
import UserDetail from "./pages/modules/Users/UserDetail";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";
import MapIndicator from "./pages/modules/Maps/MapsIndicator";
import NotificationRegister from "./pages/modules/Notifications/NotificationRegister";
import NotificationReset from "./pages/modules/Notifications/NotificationReset";
import NotificationRequest from "./pages/modules/Notifications/NotificationRequest";
import Notifications from "./pages/modules/Notifications/Notifications";
import StatisticsPage from "./pages/modules/Statistics/StatisticsPage";
import Neighborhood from "./pages/modules/Neighborhood/Neighborhood";
import HistoryLogs from "./pages/modules/History/HistoryLogs";
import Devices from "./pages/modules/Devices/Devices";
 //import PackageTable from "./pages/modules/Multimedia/PackageTable";
//import PackageDetailView from "./pages/modules/Multimedia/PackageDetailView"; 
import UserProfile from "./pages/modules/Settings/UserProfile";
import { DashboardEntity } from "./components/layout/DashboardEntity";


import EntityList from "./pages/modules/Users/Entitylist";
import { KeysPage } from "./pages/modules/keys/Keys";
//import LoginEntity from "./pages/LoginEntity";
//import LogsComponent from "./components/logs/LogsComponent";



// Función para verificar si el usuario está autenticado
const isAuthenticated = (): boolean => {
  // En una aplicación real, verificaría el token JWT, la sesión, etc.
  return localStorage.getItem("token") !== null;
};

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    // Polling: comprobar periódicamente si el usuario fue desactivado en el backend
    const currentUserId = authService.getUserIdFromToken() || localStorage.getItem("userId");
    if (!currentUserId) return;

    let cancelled = false;

    const checkActive = async () => {
      try {
        const user = await userService.getUserById(String(currentUserId));
        // Dependiendo del backend, el campo puede llamarse isActive o is_active
        const active = (user as any).isActive ?? (user as any).is_active ?? true;
        if (!active && !cancelled) {
          authService.logout();
          localStorage.removeItem("role");
          localStorage.removeItem("userId");
          // Redirigir al login
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Error comprobando estado de usuario:", err);
        // No interrumpimos el polling por errores temporales
      }
    };

    // Primera comprobación inmediata
    checkActive();

    // Comprobar cada 30 segundos (ajustable)
    const interval = setInterval(checkActive, 30 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Rutas para módulo de usuarios */}
        <Route path="users">
          <Route index element={<UsersList />} />
          <Route path=":id" element={<UserDetail />} />
        </Route>

        <Route path="entities">
          <Route index  element={<EntityList />} />
        </Route>

        <Route path="devices" element={<Devices />} />

        <Route path="keys" element={<KeysPage />} />
        {/* Rutas para el modulo maps */}
        <Route path="maps" element={<MapIndicator />} />
        <Route
          path="/notificaciones/register/:id"
          element={<NotificationRegister />}
        />
        <Route
          path="/notificaciones/reset/:id"
          element={<NotificationReset />}
        />
        <Route
          path="/notificaciones/request/:id"
          element={<NotificationRequest />}
        />
        <Route path="/notifications" element={<Notifications />} />

        <Route path="statistics" element={<StatisticsPage />} />

        {/* Rutas para el módulo de barrios */}
        <Route path="/neighborhood" element={<Neighborhood />} />

        {/* Rutas para el módulo de historial */}
        <Route path="/history" element={<HistoryLogs />} />
        {/* Rutas para el módulo de logs        //<Route path="/history" element={<LogsComponent />} />
         */}

          {/* Rutas para el módulo de multimedia
        // <Route path="multimedia" element={<PackageTable />} />
        // <Route path="multimedia/package/:id" element={<PackageDetailView />} />
        */}

        {/* Settings */}
        <Route path="/settings/:id" element={<UserProfile />} />
      </Route>
      

      {/* Redireccionar cualquier ruta no encontrada al dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} /> 

       
    <Route
      path="/monitoring/*"
      element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["entity", "son"]}>
            <DashboardEntity />
          </RoleProtectedRoute>
        </ProtectedRoute>
      }
    />
      

    </Routes>

    
  );
}

export default App;
