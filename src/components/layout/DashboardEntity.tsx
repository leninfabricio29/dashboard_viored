import { FiUsers, FiBell, FiClock, FiSettings, FiLogOut, FiHome, FiMenu, FiX, FiRadio, FiVolume2, FiVolumeX } from "react-icons/fi";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import Footer from "./Footer";
import { useLocation } from "react-router-dom";
import { useSocketListener } from "../../hooks/useSocketListener";
import MonitoringMap from "../../pages/modules/Entity/MonitoringMap";
import TrackingDetail from "../../pages/modules/Entity/TrackingDetail";
import Members from "../../pages/modules/Entity/Members";
import AlertsHistory from "../../pages/modules/Entity/AlertsHistory";
import HistoryAdmin from "../../pages/modules/Entity/HistoryAdmin";
import SettingsEntity from "../../pages/modules/Entity/SettingsEntity";
import Modal from "./Modal";

export const DashboardEntity = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [user, setUser] = useState<{ name: string; role: string; avatar?: string }>({
    name: "",
    role: "",
  });
  const [modalType, setModalType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  console.log("DashboardEntity rendered:", { pathname, modalType, user, loading });

  const modules = [
    { title: "Inicio", path: "/monitoring", icon: <FiHome size={15} /> },
    { title: "Colaboradores", path: "/monitoring/members", icon: <FiUsers size={15} /> },
    { title: "Notificaciones", path: "/monitoring/alerts-history", icon: <FiBell size={15} /> },
    { title: "Bitácora", path: "/monitoring/history-admin", icon: <FiClock size={15} /> },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getModalTypeFromPath = (path: string) => {
    if (path.includes("members")) return "members";
    if (path.includes("alerts-history")) return "alerts";
    if (path.includes("history-admin")) return "history";
    return null;
  };

  const isActiveModule = (module: (typeof modules)[0]) => {
    if (module.path === "/monitoring") return pathname === "/monitoring";
    return pathname.startsWith(module.path);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = authService.getUserIdFromToken();
        if (userId) {
          const userData = await userService.getUserById(userId);
          setUser({
            name: userData.name,
            role: userData.role,
            avatar:
              userData.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
          });
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const filteredModules = modules.filter((module) => {
    if (user.role === "entity") return true;
    if (user.role === "son")
      return module.title === "Inicio" || module.title === "Notificaciones";
    return false;
  });

  const isTrackingRoute = pathname.match(/^\/monitoring\/tracking\/[^\/]+$/);
  const trackingAlertId = isTrackingRoute
    ? pathname.match(/^\/monitoring\/tracking\/([^\/]+)$/)?.[1]
    : null;

  // ====================================================================
  // AUDIO GLOBAL: Escuchar alertas de pánico
  // ====================================================================
  useSocketListener("panic-alert", (data: any) => {
    console.log("🚨 Alerta de pánico recibida en DashboardEntity:", data);
    if (soundEnabled && audioRef.current) {
      console.log("🔊 Reproduciendo sonido de alerta global");
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error("❌ Error reproduciendo audio:", err);
      });
    }
  });

  // Detener audio cuando se atiende la alerta
  useSocketListener("alert-attended", (data: any) => {
    data = data || {};
    console.log("👤 Alerta atendida, deteniendo sonido");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  });

  // Detener audio cuando se finaliza la alerta
  useSocketListener("alert-finalized", (data: any) => {
    data = data || {};
    console.log("🛑 Alerta finalizada, deteniendo sonido");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  });

  // Detener audio cuando se entra al tracking
  useEffect(() => {
    if (isTrackingRoute && audioRef.current) {
      console.log("🚪 Entrando al tracking, deteniendo sonido");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isTrackingRoute]);
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-slate-300">
      {/* Audio global */}
      <audio 
        ref={audioRef} 
        src={`${window.location.origin}/sounds/alarm.mp3`}
        loop 
      />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 flex items-center h-14 px-4 md:px-6 bg-slate-900 border-b border-slate-800 shadow-lg shadow-black/30">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-6 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FiRadio size={16} className="text-cyan-400" />
          </div>
          <span className="font-bold text-sm tracking-wide text-slate-100">Sistema de monitoreo</span>
          <span className="text-[9px] font-bold tracking-widest text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded px-1.5 py-0.5 animate-pulse">
            LIVE
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {filteredModules.map((module) => {
            const active = isActiveModule(module);
            return (
              <button
                key={module.path}
                onClick={() => {
                  const mt = getModalTypeFromPath(module.path);
                  if (mt) setModalType(mt);
                }}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[0.95rem] font-medium transition-all duration-150
                  ${active ? "text-slate-100   border-slate-700" : "text-slate-300 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent"}`}
              >
                <span className={active ? "text-cyan-400" : "text-slate-600"}>
                  {module.icon}
                </span>
                {module.title}
                
              </button>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto shrink-0">

          {/* Settings */}
          <button
            onClick={() => setModalType("settings")}
            className="hidden md:flex w-8 h-8 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 items-center justify-center transition-all"
            title="Configuración"
          >
            <FiSettings size={16} />
          </button>

          {/* Volume Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`hidden md:flex w-8 h-8 rounded-lg border items-center justify-center transition-all ${
              soundEnabled
                ? "border-cyan-500/60 text-cyan-400 hover:border-cyan-400"
                : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
            }`}
            title={soundEnabled ? "Sonido activado" : "Sonido desactivado"}
          >
            {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
          </button>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-slate-700 mx-1" />

          {/* User chip */}
          <div className="hidden md:flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-lg object-cover border border-slate-600"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name || "U"
                )}&background=1e3a5f&color=22d3ee`;
              }}
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-slate-200">{user.name || "Usuario"}</span>
              <span className="text-[10px] text-slate-500 capitalize">{user.role || "—"}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium hover:bg-red-500/10 hover:border-red-500/30 transition-all"
          >
            <FiLogOut size={14} />
            <span>Salir</span>
          </button>

          {/* Mobile hamburger */}
          <button
            className="flex md:hidden w-9 h-9 rounded-lg border border-slate-700 text-slate-400 items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-64 bg-slate-900 border-l border-slate-800 flex flex-col p-4 gap-1 overflow-y-auto">

            <div className="flex items-center gap-2 pb-4 mb-2 border-b border-slate-800">
              <FiRadio size={15} className="text-cyan-400" />
              <span className="font-bold text-sm text-slate-100">SafeTrack</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/60 bg-slate-800/40 mb-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-600"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
              </div>
            </div>

            {filteredModules.map((module) => {
              const active = isActiveModule(module);
              return (
                <button
                  key={module.path}
                  onClick={() => {
                    const mt = getModalTypeFromPath(module.path);
                    if (mt) setModalType(mt);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left w-full
                    ${active
                      ? "bg-slate-800 text-slate-100 border border-slate-700"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent"
                    }`}
                >
                  <span className={active ? "text-cyan-400" : "text-slate-600"}>{module.icon}</span>
                  {module.title}
                </button>
              );
            })}

            <div className="h-px bg-slate-800 my-2" />

            <button
              onClick={() => { setModalType("settings"); setMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all w-full border border-transparent"
            >
              <FiSettings size={15} className="text-slate-600" />
              Configuración
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all w-full border border-transparent"
            >
              <FiLogOut size={15} />
              Cerrar sesión
            </button>
          </div>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-y-auto">

        {/* Tracking fullscreen */}
        {isTrackingRoute && trackingAlertId && (
          <TrackingDetail alertId={trackingAlertId} />
        )}

        {/* Normal view */}
        {!isTrackingRoute && (
          <>
          <div className="p-4">
            <MonitoringMap />

          </div>

            {pathname.includes("/monitoring/members") && (
              <div className="mx-4 md:mx-6 mb-6 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300 tracking-wide">
                  <FiUsers size={14} className="text-cyan-400" />
                  Gestión de Usuarios
                </div>
                <Members />
              </div>
            )}

            {pathname.includes("/monitoring/alerts-history") && (
              <div className="mx-4 md:mx-6 mb-6 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300 tracking-wide">
                  <FiBell size={14} className="text-cyan-400" />
                  Historial de Alertas
                </div>
                <AlertsHistory />
              </div>
            )}

            {pathname.includes("/monitoring/history-admin") && (
              <div className="mx-4 md:mx-6 mb-6 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300 tracking-wide">
                  <FiClock size={14} className="text-cyan-400" />
                  Bitácora del Sistema
                </div>
                <HistoryAdmin />
              </div>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      {!isTrackingRoute && <Footer />}

      {/* ── MODALS ── */}
      {modalType === "members" && (
        <Modal isOpen onClose={() => setModalType(null)} title="Gestión de Usuarios">
          <Members />
        </Modal>
      )}
      {modalType === "alerts" && (
        <Modal isOpen onClose={() => setModalType(null)} title="Historial de Alertas">
          <AlertsHistory />
        </Modal>
      )}
      {modalType === "history" && (
        <Modal isOpen onClose={() => setModalType(null)} title="Bitácora del Sistema">
          <HistoryAdmin />
        </Modal>
      )}
      {modalType === "settings" && (
        <Modal isOpen onClose={() => setModalType(null)} title="Configuración">
          <SettingsEntity id={localStorage.getItem("userId") || ""} />
        </Modal>
      )}
    </div>
  );
};

export default DashboardEntity;