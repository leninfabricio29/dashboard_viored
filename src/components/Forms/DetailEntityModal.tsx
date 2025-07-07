import React, { useEffect, useState } from 'react';
import { entityUsersService } from '../../services/entity.service';
import { Entity } from '../../types/user.types'; // Asegúrate de que la ruta sea correcta

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
}

export const DetailEntityModel: React.FC<Props> = ({ isOpen, onClose, entityId }) => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      setError('No se pudo cargar la entidad');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Detalles de la Entidad</h2>

        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {entity && (
          <>
            <div className="mb-4">
              <p><strong>Nombre:</strong> {entity.name}</p>
              <p><strong>Email:</strong> {entity.email}</p>
              <p><strong>Tipo:</strong> {entity.type}</p>
              <p><strong>Suscripción:</strong> {entity.suscription}</p>
            </div>

            <h3 className="font-semibold mt-4 mb-2">Colaboradores registrados:</h3>
            {entity.users_sons.length === 0 ? (
              <p className="text-gray-600 text-sm">Sin colaboradores.</p>
            ) : (
              <ul className="space-y-2">
                {entity.users_sons.map((user:any) => (
                  <li key={user._id} className="border p-2 rounded text-sm">
                    <p><strong>{user.name}</strong></p>
                    <p className="text-gray-500">{user.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="flex justify-end mt-6">
          <button
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
