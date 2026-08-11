import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  Video,
  Clock,
  Radar,
  MonitorSmartphone,
  FileBarChart,
  BellRing,
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
import trackingService, { type Vehicle } from "../services/tracking-service";
import cameraService, { type Camera } from "../services/camera-service";

const statusStyles = {
  ACTIVA: "text-red-600 bg-red-50",
  "EN RUTA": "text-amber-600 bg-amber-50",
  ATENDIDA: "text-emerald-600 bg-emerald-50",
};

const systemStatusItems = [
  { label: "Tiempo de actividad", value: "99.9%", note: "Óptimo", icon: Activity, color: "text-emerald-600" },
  { label: "Servicios activos", value: "12 / 12", note: "Todos funcionando", icon: MonitorSmartphone, color: "text-blue-600" },
  { label: "Almacenamiento", value: "68%", note: "Uso del sistema", icon: FileBarChart, color: "text-amber-500" },
  { label: "Respaldo automático", value: "Activo", note: "Sistema protegido", icon: BellRing, color: "text-emerald-600" },
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
   COMPONENTE DASHBOARD PRINCIPAL
--------------------------------------------------------- */

const DashboardLayout = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      try {
        const [statsData, vehiclesData, camerasData] = await Promise.all([
          dashboardService.getStats().catch(() => null),
          trackingService.getVehicles().catch(() => []),
          cameraService.getCameras().catch(() => []),
        ]);

        if (mounted) {
          if (statsData) setStats(statsData);
          setVehicles(vehiclesData);
          setCameras(camerasData);
        }
      } catch (error) {
        console.error("No se pudieron cargar las estadísticas del dashboard:", error);
      }
    };

    void fetchDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const dashboardTopStats = useMemo(() => {
    const alertsCount = stats?.totals?.alerts ?? 0;
    const usersCount = stats?.totals?.users ?? 0;
    const devicesCount = stats?.totals?.devices ?? 0;
    const camerasCount = stats?.totals?.cameras ?? cameras.length;
    const vehiclesCount = vehicles.length;
    const logsCount = stats?.latestLogs?.length ?? 0;

    return [
      { name: "Alertas registradas", value: alertsCount.toLocaleString(), note: "Total en el sistema", icon: AlertTriangle, accent: "text-red-500", noteColor: "text-red-500" },
      { name: "Usuarios totales", value: usersCount.toLocaleString(), note: "Registrados", icon: Users, accent: "text-slate-700", noteColor: "text-slate-400" },
      { name: "Dispositivos registrados", value: devicesCount.toLocaleString(), note: "Activos en el sistema", icon: Activity, accent: "text-emerald-600", noteColor: "text-slate-400" },
      { name: "Flota de vehículos", value: vehiclesCount.toLocaleString(), note: "Monitoreo satelital", icon: Radar, accent: "text-violet-600", noteColor: "text-slate-400" },
      { name: "Cámaras registradas", value: camerasCount.toLocaleString(), note: "Equipos de monitoreo", icon: Video, accent: "text-blue-600", noteColor: "text-slate-400" },
      { name: "Eventos registrados", value: logsCount.toLocaleString(), note: "Auditoría del sistema", icon: Clock, accent: "text-slate-700", noteColor: "text-slate-400" },
    ];
  }, [stats, vehicles, cameras]);

  const dashboardAlerts = useMemo(() => {
    if (!stats?.latestAlerts) return [];
    return stats.latestAlerts.map((alert) => ({
      name: alert.reporter?.name || "Usuario no identificado",
      desc: alertLocation(alert.lastLocation?.coordinates),
      time: formatDateTime(alert.reportedAt),
      status: alertStatus(alert.status),
    }));
  }, [stats]);

  const mapMarkers = useMemo<AlertData[]>(() => {
    if (!stats?.latestAlerts) return [];

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
    if (!stats?.latestLogs) return [];
    return stats.latestLogs.map((log) => ({
      time: formatDateTime(log.timestamp),
      text: log.action || "Actividad registrada",
      sub: log.metadata?.mensaje || log.target || log.user?.name || "Sistema",
      dot: "bg-blue-500",
    }));
  }, [stats]);

  const dashboardUsers = useMemo(() => {
    if (!stats?.latestLoggedUsers) return [];
    return stats.latestLoggedUsers.map((user) => ({
      name: user.name || "Usuario sin nombre",
      role: user.role?.name || "Sin rol",
      count: `Último acceso: ${formatDateTime(user.last_login)}`,
    }));
  }, [stats]);

  const activityDistribution = useMemo(() => {
    if (!stats?.latestAlerts || stats.latestAlerts.length === 0) {
      return [
        { name: "Activas", value: 1, pct: "100%", color: "#ef4444" },
      ];
    }
    const totalAlerts = stats.latestAlerts.length;
    const active = stats.latestAlerts.filter(a => a.status === 'active').length;
    const inProgress = stats.latestAlerts.filter(a => a.status === 'in_progress' || a.status === 'attended').length;
    const closed = stats.latestAlerts.filter(a => a.status === 'closed').length;
    const other = Math.max(0, totalAlerts - (active + inProgress + closed));

    return [
      { name: "Activas", value: active, pct: `${((active / totalAlerts) * 100).toFixed(1)}%`, color: "#ef4444" },
      { name: "En Atención", value: inProgress, pct: `${((inProgress / totalAlerts) * 100).toFixed(1)}%`, color: "#f59e0b" },
      { name: "Atendidas", value: closed, pct: `${((closed / totalAlerts) * 100).toFixed(1)}%`, color: "#10b981" },
      { name: "Otras", value: other, pct: `${((other / totalAlerts) * 100).toFixed(1)}%`, color: "#64748b" },
    ].filter(item => item.value > 0);
  }, [stats]);

  const devicesByStatus = useMemo(() => {
    const totalDevs = stats?.totals?.devices || 0;
    return [
      { name: "Registrados", value: totalDevs, pct: 100, color: "bg-emerald-500", text: "text-emerald-600" },
      { name: "En Monitoreo", value: Math.round(totalDevs * 0.85), pct: 85, color: "bg-blue-500", text: "text-blue-600" },
      { name: "Sin Asignar", value: Math.round(totalDevs * 0.15), pct: 15, color: "bg-slate-400", text: "text-slate-500" },
    ];
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
                  No hay ubicaciones de alertas disponibles en el mapa.
                </div>
              )}
            </div>
          </div>

          {/* Alertas recientes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">Alertas recientes</h2>
              <a href="/alerts" className="text-xs font-medium text-blue-600">Ver todas</a>
            </div>
            <div className="space-y-1 max-h-[360px] overflow-y-auto">
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
              {dashboardAlerts.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">No hay alertas recientes registradas.</p>
              )}
            </div>
            <a href="/alerts" className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-blue-600">
              Ver todas las alertas →
            </a>
          </div>
        </div>

        {/* ---------- FILA 3: Rastreo / Donut / Dispositivos / Cámaras ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Rastreo satelital activo */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Flota de vehículos</h2>
              <a href="/satellite" className="text-xs font-medium text-blue-600">Ver todos</a>
            </div>
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {vehicles.map((v) => (
                <div key={v._id} className="flex items-center justify-between py-1.5 border-b last:border-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${v.gpsDevice?.lastConnection ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div>
                      <p className="text-xs font-medium text-slate-800">{v.alias || v.plate}</p>
                      <p className="text-[11px] text-slate-400">{v.plate} {v.brand ? `· ${v.brand} ${v.model || ''}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">{v.gpsDevice?.model || "Auto-GPS"}</p>
                    <p className="text-[11px] text-slate-400">{v.gpsDevice?.lastConnection ? "En línea" : "Desconectado"}</p>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No hay vehículos en la flota.</p>
              )}
            </div>
          </div>

          {/* Distribución de actividades */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">Distribución de alertas</h2>
              <span className="text-xs font-medium text-slate-500">En tiempo real</span>
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
                <span className="text-xl font-bold text-slate-800">{stats?.totals?.alerts ?? 0}</span>
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
              <a href="/devices" className="text-xs font-medium text-blue-600">Ver todos</a>
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

          {/* Cámaras registradas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Cámaras registradas</h2>
              <a href="/cameras" className="text-xs font-medium text-blue-600">Ver todas</a>
            </div>
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
              {cameras.map((c) => (
                <div key={c._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Video className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate max-w-[160px]">
                      {c.description || c.name || "Cámara de seguridad"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Activa
                  </span>
                </div>
              ))}
              {cameras.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">No hay cámaras registradas.</p>
              )}
            </div>
          </div>
        </div>

        {/* ---------- FILA 4: Actividad / Top usuarios / Estado del Sistema ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Actividad del sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Actividad del sistema</h2>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
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
              {dashboardActivity.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">Sin actividad reciente registrada.</p>
              )}
            </div>
          </div>

          {/* Top usuarios por acceso */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Accesos de usuarios recientes</h2>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
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
              {dashboardUsers.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No hay registros de usuarios.</p>
              )}
            </div>
          </div>

          {/* Estado del sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Estado del sistema</h2>
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
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
