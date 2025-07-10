import React, { useEffect, useState } from "react";

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
      //await entityUsersService.updateEntityStatus(id, { is_active: newStatus });
      console.log(id)
      setEntity((prev: any) => ({ ...prev, is_active: newStatus }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm max-h-[85vh] overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-blue-950 p-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Detalles de Entidad</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600 text-sm">Cargando...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2">
              <svg
                className="w-4 h-4 text-red-500 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {entity && (
            <div className="space-y-4">
              {/* Main Title */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">
                  {entity.name}
                </h3>
                <p className="text-slate-500 text-xs">Entidad registrada</p>
              </div>

              {/* Info Box */}
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Email */}
                  <div className="col-span-2">
                    <p className="text-slate-500 font-semibold mb-0.5">Email</p>
                    <p className="text-slate-800">{entity.email}</p>
                  </div>

                  {/* Type */}
                  <div>
                    <p className="text-slate-500 font-semibold mb-0.5">Tipo</p>
                    <p className="text-slate-800">
                      {getTypeLabel(entity.type)}
                    </p>
                  </div>

                  {/* Collaborators */}
                  <div>
                    <p className="text-slate-500 font-semibold mb-0.5">
                      Colaboradores
                    </p>
                    <p className="text-slate-800">
                      {entity.users_sons?.length || 0}
                    </p>
                  </div>

                  {/* Subscription */}
                  <div>
                    <p className="text-slate-500 font-semibold mb-0.5">
                      Suscripción
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${subscriptionBadge.color}`}
                    >
                      {subscriptionBadge.label}
                    </span>
                  </div>

                  {/* Status with Toggle */}
                  <div>
                    <p className="text-slate-500 font-semibold mb-0.5">
                      Estado
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          entity.is_active ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {entity.is_active ? "Activo" : "Inactivo"}
                      </span>
                      <button
                        onClick={() =>
                          handleToggle(entity._id, !entity.is_active)
                        }
                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                          entity.is_active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            entity.is_active ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
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
