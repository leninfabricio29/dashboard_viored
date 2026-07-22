import  { useState, useEffect, useMemo } from "react";
import {
  FiFileText,
  FiFile,
  FiCalendar,
  FiFilter,
  FiFilePlus,
  FiUsers,
  FiAlertCircle,
  FiSmartphone,
  FiRefreshCw,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiUserCheck,
  FiUserMinus,
} from "react-icons/fi";
import api from "../../../services/api";
import accessService from "../../../services/access-service";
import authService from "../../../services/auth-service";

type ReportType =
  | "alerts"
  | "users"
  | "devices"
  | "entity-subscriptions"
  | "entity-unsubscriptions";

export default function Reports() {
  const [isEntity, setIsEntity] = useState<boolean>(false);
  const [reportType, setReportType] = useState<ReportType>("alerts");
  const [datePreset, setDatePreset] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<"pdf" | "excel" | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Detectar si el usuario actual es Entidad o Administrador/SuperAdmin
  useEffect(() => {
    const checkRole = async () => {
      try {
        const access = await accessService.getCurrentUserAccess();
        const roleNameRaw = String(access.roleName || localStorage.getItem("role") || "").toLowerCase();

        // SuperAdmin o Admin SIEMPRE ven la reportería centralizada (global)
        const isAdminOrSuper = roleNameRaw === "admin" || roleNameRaw === "superadmin";

        let isEnt = false;
        if (!isAdminOrSuper) {
          const entityId = authService.getEntityIdFromToken();
          const storedEntityId = localStorage.getItem("entity_sonId");
          if (
            roleNameRaw.includes("entity") ||
            roleNameRaw.includes("entidad") ||
            roleNameRaw.includes("son") ||
            !!entityId ||
            !!storedEntityId
          ) {
            isEnt = true;
          }
        }
        setIsEntity(isEnt);
      } catch (err) {
        console.error("Error al verificar rol en reportería:", err);
        const storedRole = String(localStorage.getItem("role") || "").toLowerCase();
        const isAdminOrSuper = storedRole === "admin" || storedRole === "superadmin";
        let isEnt = false;
        if (!isAdminOrSuper) {
          const entityId = authService.getEntityIdFromToken();
          if (
            storedRole.includes("entity") ||
            storedRole.includes("entidad") ||
            storedRole.includes("son") ||
            !!entityId
          ) {
            isEnt = true;
          }
        }
        setIsEntity(isEnt);
      }
    };
    void checkRole();
  }, []);

  // Inicializar rango de fechas según preset por defecto
  useEffect(() => {
    handleDatePreset(datePreset);
  }, []);

  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    if (preset === "today") {
      const dateStr = today.toISOString().split("T")[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (preset === "week") {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      setStartDate(lastWeek.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    } else if (preset === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Cargar previsualización de datos desde el backend
  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      if (reportType === "alerts") {
        const response = await api.get("/api/alerts");
        const raw = Array.isArray(response.data?.alerts) ? response.data.alerts : Array.isArray(response.data) ? response.data : [];
        setPreviewData(raw);
      } else if (reportType === "users") {
        const response = await api.get("/api/users");
        const raw = Array.isArray(response.data?.users) ? response.data.users : Array.isArray(response.data) ? response.data : [];
        setPreviewData(raw);
      } else if (reportType === "devices") {
        const response = await api.get("/api/devices");
        const raw = Array.isArray(response.data?.devices) ? response.data.devices : Array.isArray(response.data) ? response.data : [];
        setPreviewData(raw);
      } else if (reportType === "entity-subscriptions") {
        const response = await api.get("/api/reports/entity-subscriptions");
        const raw = Array.isArray(response.data?.subscriptions) ? response.data.subscriptions : [];
        setPreviewData(raw);
      } else if (reportType === "entity-unsubscriptions") {
        const response = await api.get("/api/reports/entity-unsubscriptions");
        const raw = Array.isArray(response.data?.unsubscriptions) ? response.data.unsubscriptions : [];
        setPreviewData(raw);
      }
    } catch (err) {
      console.error("❌ Error al cargar previsualización:", err);
      setPreviewData([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    void loadPreview();
  }, [reportType]);

  // Generar y descargar reporte centralizado desde el Backend
  const handleDownloadReport = async (format: "pdf" | "excel") => {
    setDownloadingFormat(format);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (roleFilter && roleFilter !== "todos") params.append("role", roleFilter);
      if (searchQuery) params.append("search", searchQuery);

      const endpoint = `/api/reports/${reportType}/${format}?${params.toString()}`;
      const response = await api.get(endpoint, { responseType: "blob" });

      const mimeType = format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const fileExt = format === "pdf" ? "pdf" : "xlsx";
      const fileName = `reporte_${reportType}_${new Date().toISOString().slice(0, 10)}.${fileExt}`;

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(`❌ Error al descargar reporte ${format.toUpperCase()}:`, err);
      alert(`Error al generar el reporte en formato ${format.toUpperCase()} desde el servidor.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Filtrado de datos de previsualización
  const filteredPreview = useMemo(() => {
    return previewData.filter((item) => {
      if (startDate) {
        const itemDate = new Date(item.reportedAt || item.createdAt || item.requestedAt || item.exitedAt || "");
        if (!isNaN(itemDate.getTime()) && itemDate < new Date(startDate)) return false;
      }
      if (endDate) {
        const itemDate = new Date(item.reportedAt || item.createdAt || item.requestedAt || item.exitedAt || "");
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(itemDate.getTime()) && itemDate > end) return false;
      }

      if (reportType === "alerts" && statusFilter !== "all") {
        if (statusFilter === "active" && item.status !== "active") return false;
        if (statusFilter === "attended" && item.status !== "attended") return false;
        if (statusFilter === "closed" && item.status !== "closed") return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = item.name || item.reporter?.name || item.emitterName || "";
        const email = item.email || item.reporter?.email || "";
        const phone = item.phone || item.reporter?.phone || item.emitterPhone || "";
        const id = item._id || "";
        const msg = item.message || "";
        if (
          !name.toLowerCase().includes(q) &&
          !email.toLowerCase().includes(q) &&
          !phone.toLowerCase().includes(q) &&
          !id.toLowerCase().includes(q) &&
          !msg.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [previewData, startDate, endDate, statusFilter, roleFilter, searchQuery, reportType]);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, statusFilter, roleFilter, searchQuery, reportType]);

  // Paginación calculada
  const totalPages = Math.ceil(filteredPreview.length / pageSize) || 1;
  const paginatedPreview = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredPreview.slice(startIdx, startIdx + pageSize);
  }, [filteredPreview, currentPage, pageSize]);

  // Métricas KPI calculadas
  const totalAlertas = reportType === "alerts" ? filteredPreview.length : 0;
  const pendientesCount = reportType === "alerts" ? filteredPreview.filter(a => a.status === "active").length : 0;
  const atendidasCount = reportType === "alerts" ? filteredPreview.filter(a => a.status === "attended").length : 0;
  const cerradasCount = reportType === "alerts" ? filteredPreview.filter(a => a.status === "closed").length : 0;

  const totalSuscripciones = reportType === "entity-subscriptions" ? filteredPreview.length : 0;
  const suscritosActivosCount = reportType === "entity-subscriptions" ? filteredPreview.filter(s => s.status === "Activo").length : 0;

  const totalSalidas = reportType === "entity-unsubscriptions" ? filteredPreview.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <FiFilePlus className="text-blue-600" /> {isEntity ? "Centro de Reportería de la Entidad" : "Centro de Reportería Centralizada"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEntity
                ? "Informes ejecutivos en PDF y Excel para las alertas recibidas, suscripciones de usuarios y desuscripciones de tu entidad."
                : "Generación e impresión de informes oficiales ejecutivos en PDF y Excel para emergencias, usuarios y dispositivos."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadReport("excel")}
              disabled={downloadingFormat !== null}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {downloadingFormat === "excel" ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiFile />
              )}
              Exportar Excel (.xlsx)
            </button>
            <button
              onClick={() => handleDownloadReport("pdf")}
              disabled={downloadingFormat !== null}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              {downloadingFormat === "pdf" ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiFileText />
              )}
              Exportar PDF Oficial
            </button>
          </div>
        </div>

        {/* Selector de Módulo / Tipo de Reporte */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Botón 1: Alertas (para Entidad o Admin) */}
          <button
            onClick={() => setReportType("alerts")}
            className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition ${
              reportType === "alerts"
                ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <FiAlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {isEntity ? "Alertas Recibidas por la Entidad" : "Alertas y Emergencias"}
              </p>
              <p className="text-xs text-slate-500">
                {isEntity ? "Emergencias asignadas directamente a tu entidad" : "Informes por rango, estado y bitácora"}
              </p>
            </div>
          </button>

          {/* Si es Entidad: Reporte de Suscripciones | Si es Admin: Reporte de Usuarios */}
          {isEntity ? (
            <button
              onClick={() => setReportType("entity-subscriptions")}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition ${
                reportType === "entity-subscriptions"
                  ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <FiUserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Suscripciones a la Entidad</p>
                <p className="text-xs text-slate-500">Usuarios protegidos, fechas y aprobador</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setReportType("users")}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition ${
                reportType === "users"
                  ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <FiUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Usuarios e Interacciones</p>
                <p className="text-xs text-slate-500">Alertas emitidas, roles e historial</p>
              </div>
            </button>
          )}

          {/* Si es Entidad: Reporte de Salidas | Si es Admin: Dispositivos */}
          {isEntity ? (
            <button
              onClick={() => setReportType("entity-unsubscriptions")}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition ${
                reportType === "entity-unsubscriptions"
                  ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
                <FiUserMinus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Salidas de Usuarios de la Entidad</p>
                <p className="text-xs text-slate-500">Historial de desuscripciones registradas</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setReportType("devices")}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition ${
                reportType === "devices"
                  ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
                <FiSmartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Dispositivos y Tokens Push</p>
                <p className="text-xs text-slate-500">Tokens FCM y última conexión</p>
              </div>
            </button>
          )}
        </div>

        {/* Tarjetas KPI si el módulo seleccionado es Alertas */}
        {reportType === "alerts" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Registradas</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalAlertas}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Pendientes</p>
              <p className="mt-1 text-2xl font-bold text-red-700">{pendientesCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">En Atención</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{atendidasCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Cerradas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{cerradasCount}</p>
            </div>
          </div>
        )}

        {/* Tarjetas KPI para Suscripciones de Entidad */}
        {reportType === "entity-subscriptions" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Usuarios Suscritos</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{totalSuscripciones}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Suscripciones Activas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{suscritosActivosCount}</p>
            </div>
          </div>
        )}

        {/* Tarjetas KPI para Salidas de Entidad */}
        {reportType === "entity-unsubscriptions" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Total Salidas Registradas</p>
              <p className="mt-1 text-2xl font-bold text-amber-900">{totalSalidas}</p>
            </div>
          </div>
        )}

        {/* Barra de Filtros, Buscador y Rango de Fechas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FiFilter className="text-blue-600" /> Filtros de Generación de Reporte
            </h3>
            {/* Presets de fecha */}
            <div className="flex gap-1.5">
              {[
                { id: "today", label: "Hoy" },
                { id: "week", label: "Últimos 7 días" },
                { id: "month", label: "Este Mes" },
                { id: "all", label: "Todo el Histórico" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleDatePreset(p.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    datePreset === p.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                <FiCalendar className="inline mr-1" /> Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setStartDate(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                <FiCalendar className="inline mr-1" /> Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setEndDate(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {reportType === "alerts" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado de Emergencia
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white font-medium"
                >
                  <option value="all">Todas las Emergencias</option>
                  <option value="active">Pendientes (Activas)</option>
                  <option value="attended">En Atención</option>
                  <option value="closed">Cerradas (Finalizadas)</option>
                </select>
              </div>
            )}

            {reportType === "users" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tipo de Usuario / Rol
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white font-medium"
                >
                  <option value="todos">Todos los Usuarios</option>
                  <option value="User">Ciudadano / Usuario</option>
                  <option value="Entity">Entidad de Respuesta</option>
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Buscador General
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nombre, email, teléfono o mensaje..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Previsualización de Datos */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FiEye className="text-blue-600" /> Vista Previa del Informe ({filteredPreview.length} registros)
            </h3>
            <button
              onClick={loadPreview}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <FiRefreshCw className={loadingPreview ? "animate-spin" : ""} /> Actualizar Vista
            </button>
          </div>

          <div className="overflow-x-auto">
            {loadingPreview ? (
              <div className="flex justify-center py-16">
                <FiRefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredPreview.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No se encontraron registros que coincidan con los filtros aplicados.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold">
                  <tr>
                    {reportType === "alerts" && (
                      <>
                        <th className="px-4 py-3">Código Alerta</th>
                        <th className="px-4 py-3">Fecha Reporte</th>
                        <th className="px-4 py-3">Reportero</th>
                        <th className="px-4 py-3">Teléfono</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Coordenadas</th>
                      </>
                    )}
                    {reportType === "users" && (
                      <>
                        <th className="px-4 py-3">Nombre Completo</th>
                        <th className="px-4 py-3">Correo Electrónico</th>
                        <th className="px-4 py-3">Teléfono</th>
                        <th className="px-4 py-3">Tipo / Rol</th>
                        <th className="px-4 py-3">Fecha Registro</th>
                      </>
                    )}
                    {reportType === "devices" && (
                      <>
                        <th className="px-4 py-3">Usuario Asignado</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">FCM Token Preview</th>
                        <th className="px-4 py-3">Última Conexión</th>
                      </>
                    )}
                    {reportType === "entity-subscriptions" && (
                      <>
                        <th className="px-4 py-3">Usuario</th>
                        <th className="px-4 py-3">Correo Electrónico</th>
                        <th className="px-4 py-3">Teléfono</th>
                        <th className="px-4 py-3">Fecha Solicitud</th>
                        <th className="px-4 py-3">Fecha Aprobación</th>
                        <th className="px-4 py-3">Aprobado Por</th>
                        <th className="px-4 py-3">Estado</th>
                      </>
                    )}
                    {reportType === "entity-unsubscriptions" && (
                      <>
                        <th className="px-4 py-3">Usuario</th>
                        <th className="px-4 py-3">Correo Electrónico</th>
                        <th className="px-4 py-3">Teléfono</th>
                        <th className="px-4 py-3">Fecha de Salida</th>
                        <th className="px-4 py-3">Detalle / Notificación</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedPreview.map((row, idx) => (
                    <tr key={row._id || idx} className="hover:bg-slate-50/80 transition">
                      {reportType === "alerts" && (
                        <>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900">{row._id}</td>
                          <td className="px-4 py-3">{row.reportedAt ? new Date(row.reportedAt).toLocaleString("es-EC") : "N/A"}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.reporter?.name || row.emitterName || "Desconocido"}</td>
                          <td className="px-4 py-3">{row.reporter?.phone || row.emitterPhone || "N/A"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              row.status === "closed" ? "bg-emerald-100 text-emerald-700" : row.status === "attended" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            }`}>
                              {row.status === "closed" ? "Cerrada" : row.status === "attended" ? "En atención" : "Pendiente"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                            {row.lastLocation?.coordinates ? `${row.lastLocation.coordinates[1].toFixed(4)}, ${row.lastLocation.coordinates[0].toFixed(4)}` : "N/A"}
                          </td>
                        </>
                      )}

                      {reportType === "users" && (
                        <>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                          <td className="px-4 py-3">{row.email}</td>
                          <td className="px-4 py-3">{row.phone || "N/A"}</td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                              {row.kind || "User"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-EC") : "N/A"}</td>
                        </>
                      )}

                      {reportType === "devices" && (
                        <>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                          <td className="px-4 py-3">{row.email}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{row.fcmToken ? `${row.fcmToken.slice(0, 24)}...` : "Sin token"}</td>
                          <td className="px-4 py-3">{row.updatedAt ? new Date(row.updatedAt).toLocaleString("es-EC") : "N/A"}</td>
                        </>
                      )}

                      {reportType === "entity-subscriptions" && (
                        <>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                          <td className="px-4 py-3">{row.email}</td>
                          <td className="px-4 py-3">{row.phone}</td>
                          <td className="px-4 py-3">{row.requestedAt ? new Date(row.requestedAt).toLocaleDateString("es-EC") : "N/A"}</td>
                          <td className="px-4 py-3 font-semibold text-blue-700">{row.approvedAt ? new Date(row.approvedAt).toLocaleDateString("es-EC") : "N/A"}</td>
                          <td className="px-4 py-3 text-slate-600">{row.approvedBy}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                              {row.status}
                            </span>
                          </td>
                        </>
                      )}

                      {reportType === "entity-unsubscriptions" && (
                        <>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                          <td className="px-4 py-3">{row.email}</td>
                          <td className="px-4 py-3">{row.phone}</td>
                          <td className="px-4 py-3 font-semibold text-red-600">{row.exitedAt ? new Date(row.exitedAt).toLocaleString("es-EC") : "N/A"}</td>
                          <td className="px-4 py-3 text-slate-600">{row.message}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {!loadingPreview && filteredPreview.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Página <strong className="text-slate-800">{currentPage}</strong> de{" "}
                <strong className="text-slate-800">{totalPages}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft /> Anterior
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}