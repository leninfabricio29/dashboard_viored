import { useEffect, useState } from "react";
import {
  FiUsers,
  FiMap,
  FiActivity,
  FiClock,
  FiAlertCircle,
  FiBarChart2,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import userService from "../services/user-service";
import neighborhoodService, {
  Neighborhood,
} from "../services/neighborhood-service";
import statisticsService from "../services/statis-service";

import { getActivityLogs } from "../services/activity-log-service";
import { ActivityLog } from "../types/activity-log";

const Dashboard = () => {
  // Datos de ejemplo (deberías reemplazarlos con tus datos reales)
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [totalAlertas, setTotalAlertas] = useState<number>(0);
  const [alertasDia, setAlertasDia] = useState<number>(0);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("No se pudieron cargar los datos. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNeighborhoods = async () => {
    try {
      setLoading(true);
      const data = await neighborhoodService.getAllNeighborhoods();
      setNeighborhoods(data);
    } catch (err) {
      console.error("Error al cargar barrios:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalAlertas = async () => {
    const stats = await statisticsService.getEmergencyAlertsByDate();
    const totalAlerts = stats.reduce((sum, item) => sum + item.count, 0);
    setTotalAlertas(totalAlerts);
  };

  const fetchAlertasDia = async () => {
    try {
      const stats = await statisticsService.getEmergencyAlertsByDate();

      // Obtener la fecha actual en formato YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];

      // Filtrar solo las alertas de hoy y sumar
      const alertasHoy = stats
        .filter((item) => item.date === today)
        .reduce((sum, item) => sum + item.count, 0);

      setAlertasDia(alertasHoy);
    } catch (error) {
      console.error("Error al cargar las estadísticas de emergencias:", error);
      setAlertasDia(0); // Establecer a 0 en caso de error
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const activityLogs = await getActivityLogs();

      const recentLogs = (activityLogs || [])
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 3)
        .map((log) => ({
          user: log.user.name,
          action: log.action,
          target: log.target,
          time: formatTimeAgo(log.timestamp), // Necesitarías implementar esta función
        }));

      setLogs(recentLogs);
    } catch (err) {
      // ... manejo de errores
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear la fecha como "Hace X tiempo"
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Hace unos segundos";
    if (diffInSeconds < 3600)
      return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400)
      return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;

    return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  };

  useEffect(() => {
    fetchUsers();
    fetchNeighborhoods();
    fetchTotalAlertas();
    fetchAlertasDia();
    fetchLogs();
  }, []);

  const activeUsersCount = users.length;
  const registerNeighborhood = neighborhoods.length;

  const stats = [
    {
      name: "Usuarios activos",
      value: activeUsersCount,
      icon: FiUsers,
      trend: "up",
    },
    {
      name: "Barrios registrados",
      value: registerNeighborhood,
      icon: FiMap,
      trend: "up",
    },
    {
      name: "Alertas por día",
      value: alertasDia,
      icon: FiActivity,
      trend: "down",
    },
    {
      name: "Total de Alertas",
      value: totalAlertas,
      icon: FiAlertCircle,
      trend: "down",
    },
  ];



  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Panel de Administración
        </h1>
        <p className="text-slate-600">Resumen general del sistema</p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.name}
                </p>
                <p className="text-2xl font-semibold text-slate-800 mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  stat.trend === "up"
                    ? "bg-emerald-50 text-emerald-600"
                    : stat.trend === "down"
                    ? "bg-red-50 text-red-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos y contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de actividad (ejemplo) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Actividad reciente
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              <FiBarChart2 className="mr-1" /> Ver reporte completo
            </button>
          </div>
          <div className="h-64 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
            {/* Aquí iría tu gráfico (Chart.js, ApexCharts, etc) */}
            <p className="text-slate-400">Gráfico de actividad</p>
          </div>
        </div>

        {/* Últimos registros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">
            Registros recientes
          </h2>
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FiClock className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="text-blue-600">{log.user}</span>{" "}
                    {log.action}{" "}
                    <span className="text-slate-600">{log.target}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Módulos rápidos */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModuleCard
            title="Gestión de Usuarios"
            description="Administra los usuarios del sistema"
            icon={<FiUsers className="w-5 h-5" />}
            link="/users"
            color="from-blue-500 to-blue-600"
          />
          <ModuleCard
            title="Mapas interactivos"
            description="Visualiza datos geográficos"
            icon={<FiMap className="w-5 h-5" />}
            link="/maps"
            color="from-emerald-500 to-emerald-600"
          />
          <ModuleCard
            title="Reportes"
            description="Genera reportes del sistema"
            icon={<FiBarChart2 className="w-5 h-5" />}
            link="/reports"
            color="from-purple-500 to-purple-600"
          />
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para las tarjetas de módulo
const ModuleCard = ({ title, description, icon, link, color }) => (
  <Link
    to={link}
    className={`bg-gradient-to-r ${color} rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow`}
  >
    <div className="p-5 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-sm opacity-90">{description}</p>
    </div>
  </Link>
);

export default Dashboard;
