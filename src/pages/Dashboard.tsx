import { useEffect, useState } from "react";
import {
  FiUsers,
  FiMap,
  FiActivity,
  FiClock,
  FiAlertCircle,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import userService from "../services/user-service";
import neighborhoodService, { Neighborhood } from "../services/neighborhood-service";
import statisticsService, { EmergencyAlertStat } from "../services/statis-service";

import { getActivityLogs } from "../services/activity-log-service";
import { ActivityLog } from "../types/activity-log";
import ActivityBarChart from "../components/layout/ActivityBarChart";

interface User {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
}

// interface EmergencyAlertStat {
//   date: string;
//   count: number;
// }

const Dashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [totalAlertas, setTotalAlertas] = useState<number>(0);
  const [alertasDia, setAlertasDia] = useState<number>(0);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [adminId, setAdminId] = useState<string>("");

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
      // Buscar el usuario con rol de admin
      const admin = data.find(user => user.role === "admin");
      if (admin) {
        setAdminId(admin._id);
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const fetchNeighborhoods = async () => {
    try {
      const data = await neighborhoodService.getAllNeighborhoods();
      setNeighborhoods(data);
    } catch (err) {
      console.error("Error al cargar barrios:", err);
    }
  };

  const fetchTotalAlertas = async () => {
    const stats: EmergencyAlertStat[] = await statisticsService.getEmergencyAlertsByDate();
    const totalAlerts = stats.reduce((sum, item) => sum + item.count, 0);
    setTotalAlertas(totalAlerts);
  };

  const fetchAlertasDia = async () => {
    try {
      const stats: EmergencyAlertStat[] = await statisticsService.getEmergencyAlertsByDate();
      const today = new Date().toISOString().split("T")[0];
      const alertasHoy = stats
        .filter((item: EmergencyAlertStat) => item.date === today)
        .reduce((sum, item) => sum + item.count, 0);
      setAlertasDia(alertasHoy);
    } catch (error) {
      console.error("Error al cargar las estadísticas de emergencias:", error);
      setAlertasDia(0);
    }
  };

  const fetchLogs = async () => {
    try {
      const activityLogs: ActivityLog[] = await getActivityLogs();
      const recentLogs = (activityLogs || [])
        .sort((a: ActivityLog, b: ActivityLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
      setLogs(recentLogs);
    } catch (err) {
      console.error("Error al cargar registros de actividad:", err);
    }
  };

  ;

  useEffect(() => {
    fetchUsers();
    fetchNeighborhoods();
    fetchTotalAlertas();
    fetchAlertasDia();
    fetchLogs();
  }, []);

  const registerNeighborhood = neighborhoods.length;
const usersFilteres = users.filter(user => user.role === 'user')
  const stats = [
    { name: "Usuarios activos", value: usersFilteres.length, icon: FiUsers,  },
    { name: "Barrios registrados", value: registerNeighborhood, icon: FiMap,  },
    { name: "Alertas por día", value: alertasDia, icon: FiActivity,  },
    { name: "Total de Alertas", value: totalAlertas, icon: FiAlertCircle, },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
        <p className="text-slate-600">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          // Define a different bg color for each card
          const bgColors = [
        "bg-blue-100",
        "bg-emerald-100",
        "bg-yellow-100",
        "bg-red-100"
          ];
          return (
        <div
          key={index}
          className={`${bgColors[index % bgColors.length]} rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
          <p className="text-sm font-medium text-slate-500">{stat.name}</p>
          <p className="text-2xl font-semibold text-slate-800 mt-1">{stat.value}</p>
            </div>
            <div className="text-gray-800">
          <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Distribución de actividades</h2>
            <FiBarChart2 className="text-slate-400 w-5 h-5" />
          </div>
          <div className="flex-1 min-h-[300px]">
            <ActivityBarChart logs={logs} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Registros recientes</h2>
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
                    <span className="text-blue-600">
                      {typeof log.user === "string"
                      ? log.user
                      : log.user?.name || "SIN USUARIO"}
                    </span>{" "}
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

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Accesos rápidos</h2>
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
            title="Configuración"
            description="Cambia la información del admin"
            icon={<FiSettings className="w-5 h-5" />}
            link={`/settings/${adminId}`}
            color="from-purple-500 to-purple-600"
          />
        </div>
      </div>
    </div>
  );
};

interface ModuleCardProps {
  title: string;
  description: string;
  icon: JSX.Element;
  link: string;
  color: string;
}

const ModuleCard = ({ title, description, icon, link, color }: ModuleCardProps) => (
  <Link
    to={link}
    className={`bg-gradient-to-r ${color} rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow`}
  >
    <div className="p-5 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">{icon}</div>
      </div>
      <p className="mt-2 text-sm opacity-90">{description}</p>
    </div>
  </Link>
);

export default Dashboard;