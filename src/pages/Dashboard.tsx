import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  Video,
  Clock,
  Radar,
  Plus,
  UserPlus,
  MonitorSmartphone,
  FileBarChart,
  BellRing,
  ChevronDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import MapAlert from "../components/UI/MapAlert";
import type { AlertData } from "../components/UI/AlertMapContainer";
import dashboardService, {
  type DashboardStats,
} from "../services/dashboard-service";

/* ---------------------------------------------------------
   MOCK DATA — sustituye esto por tus llamadas a servicios
   (userService, statisticsService, etc.) como en tu Dashboard.tsx
--------------------------------------------------------- */

const topStats = [
  { name: "Alertas activas", value: "23", note: "Requieren atención", icon: AlertTriangle, accent: "text-red-500", noteColor: "text-red-500" },
  { name: "Usuarios totales", value: "1,254", note: "+ 12 hoy", icon: Users, accent: "text-slate-700", noteColor: "text-slate-400" },
  { name: "Dispositivos activos", value: "1,048", note: "En línea", icon: Activity, accent: "text-emerald-600", noteColor: "text-slate-400" },
  { name: "Rastreos activos", value: "86", note: "En seguimiento", icon: Radar, accent: "text-violet-600", noteColor: "text-slate-400" },
  { name: "Cámaras en línea", value: "104", note: "Transmitiendo", icon: Video, accent: "text-blue-600", noteColor: "text-slate-400" },
  { name: "Tiempo promedio de respuesta", value: "4:32 min", note: "Tiempo actual", icon: Clock, accent: "text-slate-700", noteColor: "text-slate-400" },
];

const recentAlerts = [
  { name: "Edison Geovanny Cabrera", desc: "Emergencia a 5 m de ti", time: "17:29:03", status: "ACTIVA" },
  { name: "María Fernanda López", desc: "Av. Kennedy y 9 de Noviembre", time: "17:20:15", status: "ACTIVA" },
  { name: "Juan Carlos Morales", desc: "Calles Sucre y Bolívar", time: "17:15:42", status: "EN RUTA" },
  { name: "Carlos Andrade", desc: "Sector Centro - Loja", time: "17:10:05", status: "ATENDIDA" },
];

const statusStyles = {
  ACTIVA: "text-red-600 bg-red-50",
  "EN RUTA": "text-amber-600 bg-amber-50",
  ATENDIDA: "text-emerald-600 bg-emerald-50",
};

const trackedVehicles = [
  { name: "Vehículo 01 - Patrulla", plate: "ABC-1234", speed: "80 km/h", status: "En movimiento", dot: "bg-emerald-500" },
  { name: "Vehículo 02 - Transporte", plate: "XYZ-5678", speed: "45 km/h", status: "En movimiento", dot: "bg-emerald-500" },
  { name: "Motocicleta - Unidad 3", plate: "MOTO-789", speed: "35 km/h", status: "En movimiento", dot: "bg-emerald-500" },
  { name: "Camión - Logística", plate: "LOG-456", speed: "0 km/h", status: "Detenido", dot: "bg-slate-400" },
];

const activityDistribution = [
  { name: "Emergencias", value: 534, pct: "42.6%", color: "#0ea5e9" },
  { name: "Rastreos", value: 286, pct: "22.8%", color: "#14b8a6" },
  { name: "Asistencias", value: 234, pct: "18.7%", color: "#8b5cf6" },
  { name: "Pruebas", value: 200, pct: "16.0%", color: "#f59e0b" },
];

const devicesByStatus = [
  { name: "En línea", value: 1048, pct: 78.5, color: "bg-emerald-500", text: "text-emerald-600" },
  { name: "Fuera de línea", value: 186, pct: 13.9, color: "bg-red-500", text: "text-red-500" },
  { name: "Mantenimiento", value: 68, pct: 5.1, color: "bg-amber-500", text: "text-amber-500" },
  { name: "Sin asignar", value: 32, pct: 2.4, color: "bg-slate-400", text: "text-slate-500" },
];

const cameras = [
  { name: "Calle Principal - Norte" },
  { name: "Parque Central" },
  { name: "Entrada Vehicular" },
  { name: "Oficinas Administrativas" },
];

const systemActivity = [
  { time: "17:29:03", text: "Nueva emergencia registrada", sub: "Edison Geovanny Cabrera - Emergencia a 5 m de ti", dot: "bg-red-500" },
  { time: "17:29:05", text: "Usuario asignado a emergencia", sub: "Agente asignado: Carlos Andrade", dot: "bg-blue-500" },
  { time: "17:25:10", text: "Dispositivo conectado", sub: "Botón de Pánico #BPC-001 - Unidad 12", dot: "bg-emerald-500" },
  { time: "17:20:45", text: "Rastreo iniciado", sub: "Vehículo 01 - Patrulla", dot: "bg-slate-400" },
];

const topUsers = [
  { name: "María José Vera", role: "Operadora", count: "156 actividades" },
  { name: "Carlos Andrade", role: "Supervisor", count: "142 actividades" },
  { name: "Luis Fernando Ochoa", role: "Despachador", count: "128 actividades" },
  { name: "Ana Belén Torres", role: "Monitoreo", count: "104 actividades" },
];

const systemStatusItems = [
  { label: "Tiempo de actividad", value: "99.9%", note: "Óptimo", icon: Activity, color: "text-emerald-600" },
  { label: "Servicios activos", value: "12 / 12", note: "Todos funcionando", icon: MonitorSmartphone, color: "text-blue-600" },
  { label: "Almacenamiento", value: "68%", note: "Uso del sistema", icon: FileBarChart, color: "text-amber-500" },
  { label: "Respaldo automático", value: "Activo", note: "Último: 17:00", icon: BellRing, color: "text-emerald-600" },
];

const quickActions = [
  { label: "Registrar nueva entidad", icon: Plus },
  { label: "Crear usuario", icon: UserPlus },
  { label: "Asignar dispositivo", icon: MonitorSmartphone },
  { label: "Generar reporte", icon: FileBarChart },
  { label: "Enviar alerta masiva", icon: BellRing },
];

const formatDateTime = (value?: string) => {
  if (!value) return "Sin registro";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";

  return date.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const alertStatus = (status?: string) => {
  if (status === "active") return "ACTIVA";
  if (status === "in_progress" || status === "attended") return "EN RUTA";
  return "ATENDIDA";
};

const alertLocation = (coordinates?: [number, number]) => {
  if (!coordinates) return "Ubicación no registrada";
  const [lng, lat] = coordinates;
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
};

/* ---------------------------------------------------------
   COMPONENTE
--------------------------------------------------------- */

const DashboardLayout = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        if (mounted) setStats(data);
      } catch (error) {
        console.error("No se pudieron cargar las estadísticas del dashboard:", error);
      }
    };

    void fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const dashboardTopStats = useMemo(() => {
    if (!stats) return topStats;

    return [
      { name: "Alertas registradas", value: stats.totals.alerts.toLocaleString(), note: "Total registrado", icon: AlertTriangle, accent: "text-red-500", noteColor: "text-red-500" },
      { name: "Usuarios totales", value: stats.totals.users.toLocaleString(), note: "Registrados en el sistema", icon: Users, accent: "text-slate-700", noteColor: "text-slate-400" },
      { name: "Dispositivos registrados", value: stats.totals.devices.toLocaleString(), note: "Total registrado", icon: Activity, accent: "text-emerald-600", noteColor: "text-slate-400" },
      topStats[3],
      { name: "Cámaras registradas", value: stats.totals.cameras.toLocaleString(), note: "Total registrado", icon: Video, accent: "text-blue-600", noteColor: "text-slate-400" },
      topStats[5],
    ];
  }, [stats]);

  const dashboardAlerts = useMemo(() => {
    if (!stats) return recentAlerts;
    return stats.latestAlerts.map((alert) => ({
      name: alert.reporter?.name || "Usuario no identificado",
      desc: alertLocation(alert.lastLocation?.coordinates),
      time: formatDateTime(alert.reportedAt),
      status: alertStatus(alert.status),
    }));
  }, [stats]);

  const mapMarkers = useMemo<AlertData[]>(() => {
    if (!stats) return [];

    return stats.latestAlerts.flatMap((alert) => {
      const coordinates = alert.lastLocation?.coordinates;
      if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) return [];
      const [lng, lat] = coordinates;
      return [{
        id: alert._id,
        alertId: alert._id,
        lat,
        lng,
        emitterName: alert.reporter?.name || "Usuario no identificado",
        emitterPhone: alert.reporter?.phone || "Teléfono no registrado",
        avatar: alert.reporter?.avatar || "N/A",
        emitterId: alert.reporter?._id || "",
        createdAt: alert.reportedAt,
        status: alert.status,
      }];
    });
  }, [stats]);

  const dashboardActivity = useMemo(() => {
    if (!stats) return systemActivity;
    return stats.latestLogs.map((log) => ({
      time: formatDateTime(log.timestamp),
      text: log.action || "Actividad registrada",
      sub: log.metadata?.mensaje || log.target || log.user?.name || "Sistema",
      dot: "bg-blue-500",
    }));
  }, [stats]);

  const dashboardUsers = useMemo(() => {
    if (!stats) return topUsers;
    return stats.latestLoggedUsers.map((user) => ({
      name: user.name || "Usuario sin nombre",
      role: user.role?.name || "Sin rol",
      count: `Último acceso: ${formatDateTime(user.last_login)}`,
    }));
  }, [stats]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 max-w-[1400px] space-y-6">
        {/* ---------- FILA 1: KPIs ---------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {dashboardTopStats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 leading-tight">{stat.name}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.accent}`}>{stat.value}</p>
                  <p className={`text-xs mt-1 ${stat.noteColor}`}>{stat.note}</p>
                </div>
                <stat.icon className={`w-5 h-5 ${stat.accent} shrink-0`} />
              </div>
            </div>
          ))}
        </div>

        {/* ---------- FILA 2: Mapa + Alertas recientes ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-slate-800">Mapa de últimas alertas</h2>

            </div>

            <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-slate-200">
              {mapMarkers.length > 0 ? (
                <MapAlert
                  markers={mapMarkers}
                  zoom={11}
                  alertZoom={13}
                  height="100%"
                  width="100%"
                  onAttend={() => undefined}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No hay ubicaciones de alertas disponibles.
                </div>
              )}
            </div>
          </div>

          {/* Alertas recientes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">Alertas recientes</h2>
              <a href="#" className="text-xs font-medium text-blue-600">Ver todas</a>
            </div>
            <div className="space-y-1">
              {dashboardAlerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0 border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{alert.name}</p>
                    <p className="text-xs text-slate-500">{alert.desc}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{alert.time}</p>
                  </div>
                  <span className={`text-[10px] font-semibold rounded px-2 py-1 ${statusStyles[alert.status as keyof typeof statusStyles]}`}>
                    {alert.status}
                  </span>
                </div>
              ))}
            </div>
            <a href="#" className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-blue-600">
              Ver todas las alertas →
            </a>
          </div>
        </div>

        {/* ---------- FILA 3: Rastreo / Donut / Dispositivos / Cámaras ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Rastreo satelital */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Rastreo satelital activo</h2>
              <a href="#" className="text-xs font-medium text-blue-600">Ver todos</a>
            </div>
            <div className="space-y-4">
              {trackedVehicles.map((v, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                    <div>
                      <p className="text-xs font-medium text-slate-800">{v.name}</p>
                      <p className="text-[11px] text-slate-400">{v.plate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">{v.speed}</p>
                    <p className="text-[11px] text-slate-400">{v.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución de actividades (donut) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">Distribución de actividades</h2>
              <button className="flex items-center gap-1 text-xs font-medium text-slate-500">
                Este mes <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <div className="relative h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityDistribution}
                    dataKey="value"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {activityDistribution.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800">1,254</span>
                <span className="text-[11px] text-slate-400">Total</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {activityDistribution.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-slate-700 font-medium">{d.value}</span>
                  <span className="text-slate-400">{d.pct}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dispositivos por estado */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Dispositivos por estado</h2>
              <a href="#" className="text-xs font-medium text-blue-600">Ver todos</a>
            </div>
            <div className="space-y-4">
              {devicesByStatus.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">{d.name}</span>
                    <span className={`text-xs font-semibold ${d.text}`}>
                      {d.value.toLocaleString()} <span className="text-slate-400 font-normal">{d.pct}%</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cámaras en vivo */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Cámaras en vivo</h2>
              <a href="#" className="text-xs font-medium text-blue-600">Ver todas</a>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cameras.map((c, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-900 opacity-90" />
                  <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] text-white font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- FILA 4: Actividad / Top usuarios / Estado / Acciones ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Actividad del sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Actividad del sistema</h2>
              <a href="#" className="text-xs font-medium text-blue-600">Ver historial completo</a>
            </div>
            <div className="space-y-4">
              {dashboardActivity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`w-2 h-2 rounded-full mt-1 ${a.dot}`} />
                    {i !== dashboardActivity.length - 1 && <span className="flex-1 w-px bg-slate-200 mt-1" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-[11px] text-slate-400">{a.time}</p>
                    <p className="text-xs font-medium text-slate-800">{a.text}</p>
                    <p className="text-[11px] text-slate-500">{a.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top usuarios */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Top usuarios por actividad</h2>
              <button className="flex items-center gap-1 text-xs font-medium text-slate-500">
                Este mes <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {dashboardUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-semibold text-slate-400">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-800">{u.name}</p>
                    <p className="text-[11px] text-slate-400">{u.role}</p>
                  </div>
                  <span className="text-[11px] text-slate-500">{u.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estado del sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Estado del sistema</h2>
              <a href="#" className="text-xs font-medium text-blue-600">Ver detalles</a>
            </div>
            <div className="space-y-4">
              {systemStatusItems.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <s.icon className={`w-4 h-4 ${s.color}`} /> {s.label}
                  </span>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-slate-400">{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Acciones rápidas</h2>
            <div className="space-y-2">
              {quickActions.map((a, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg px-3 py-2.5 transition-colors text-left"
                >
                  <a.icon className="w-4 h-4 text-slate-400" /> {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
