import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

import { entityUsersService } from "../../services/entity.service";
import { Entity } from "../../types/user.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
}

export const DetailEntityModel: React.FC<Props> = ({
  isOpen,
  onClose,
  entityId,
}) => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (id: string, newStatus: boolean) => {
  try {
    await entityUsersService.updateEntityStatus(id, newStatus); // ← aquí se hace el PUT real
    setEntity((prev: any) => prev ? { ...prev, is_active: newStatus } : prev);
  } catch (err) {
    console.error("Error al actualizar estado:", err);
  }
};

  const getTypeLabel = (type: string) => {
    const types = {
      police: "Policía",
      fire: "Bomberos",
      medical: "Médico",
      admin: "Administrador",
    };
    return (types as any)[type] || type;
  };

  const getSubscriptionBadge = (subscription: string) => {
    const badges = {
      free: { color: "bg-gray-100 text-gray-700", label: "Gratuito" },
      premium: {
        color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
        label: "Premium",
      },
      enterprise: {
        color: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
        label: "Empresarial",
      },
    };
    return (badges as any)[subscription] || "";
  };

  useEffect(() => {
    if (isOpen && entityId) {
      fetchEntity();
    }
  }, [isOpen, entityId]);

  const fetchEntity = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await entityUsersService.getEntityById(entityId);
      setEntity(data);
    } catch {
      setError("No se pudo cargar la entidad");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const subscriptionBadge = entity
    ? getSubscriptionBadge(entity.suscription)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-4 py-3 text-white flex items-center justify-between">
          <h2 className="text-lg font-semibold">Detalles de Entidad</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <span className="text-gray-600 text-sm">Cargando información...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-red-800 font-medium text-sm">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {entity && (
              <div className="space-y-6">
                {/* Entity Header */}
                <div className="text-center pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-blue-600">
                      {entity.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    {entity.name}
                  </h3>
                  <p className="text-gray-500 text-sm">{entity.email}</p>
                </div>

                {/* Information Grid Mejorada */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Tipo */}
                    <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center">
                      <p className="text-gray-500 font-medium text-sm mb-1">Tipo</p>
                      <p className="text-gray-800 font-semibold text-base">{getTypeLabel(entity.type)}</p>
                    </div>
                    {/* Colaboradores */}
                    <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center">
                      <p className="text-gray-500 font-medium text-sm mb-1">Tu grupo</p>
                      <p className="text-gray-800 font-semibold text-xl">{entity.users_sons?.length || 0}</p>
                    </div>
                  </div>
                  {/* Suscripción */}
                  <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center">
                    <p className="text-gray-500 font-medium text-sm mb-1">Suscripción</p>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${subscriptionBadge.color}`}>
                      {subscriptionBadge.label}
                    </span>
                  </div>
                  {/* Estado con Toggle Mejorado */}
                  <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-4 w-full justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${entity.is_active ? "bg-green-500" : "bg-red-500"}`} />
                        <div>
                          <p className="text-gray-500 font-medium text-sm">Estado</p>
                          <p className={`text-sm font-semibold ${entity.is_active ? "text-green-600" : "text-red-600"}`}>{entity.is_active ? "Activo" : "Inactivo"}</p>
                        </div>
                      </div>
                      {/* Toggle visual mejorado */}
                      <button
                        onClick={() => handleToggle(entity._id, !entity.is_active)}
                        className={`relative w-12 h-7 flex items-center rounded-full transition-colors duration-200 focus:outline-none border-2 ${entity.is_active ? "bg-green-500 border-green-600" : "bg-gray-300 border-gray-400"}`}
                        aria-label="Cambiar estado"
                      >
                        <span
                          className={`absolute left-0 top-0 w-7 h-7 rounded-full shadow-md bg-white border transition-transform duration-200 ${entity.is_active ? "translate-x-5 border-green-500" : "translate-x-0 border-gray-400"}`}
                          style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)" }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};