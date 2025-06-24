import { useLocation, useNavigate } from "react-router-dom";

import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { label: "Inicio", path: "/monitoring" },
    { label: "Historial", path: "/entity/history" },
    { label: "Configuración", path: "/entity/settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
        <div className="text-xl font-bold text-blue-800">V-SOS Gestión</div>

        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`text-sm font-medium px-3 py-2 rounded-md ${
                location.pathname === tab.path
                  ? "bg-blue-100 text-blue-800"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="font-semibold text-slate-700">Juan Pérez</p>
            <p className="text-slate-500">Administrador</p>
          </div>
          <img
            src="https://i.pravatar.cc/40"
            alt="Avatar"
            className="w-10 h-10 rounded-full border"
          />
        </div>
      </nav>

      {/* Contenido */}
      <main className="p-6">{children}</main>
    </div>
  );
}
