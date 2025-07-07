import React, { useState } from 'react';
import { entityUsersService } from '../../services/entity.service'; // ajusta si está en otra ruta

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateEntityModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    type: '',
    suscription: 'free'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await entityUsersService.createEntity(form);
      setSuccess(true);
      if (onCreated) onCreated();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al crear la entidad');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Crear nueva entidad</h2>

        <input
          className="w-full border p-2 mb-2"
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={handleChange}
        />
        <input
          className="w-full border p-2 mb-2"
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          className="w-full border p-2 mb-2"
          name="password"
          placeholder="Contraseña"
          type="password"
          value={form.password}
          onChange={handleChange}
        />
        <select
          name="type"
          className="w-full border p-2 mb-2"
          value={form.type}
          onChange={handleChange}
        >
          <option value="">Tipo de entidad</option>
          <option value="police">Policía</option>
          <option value="ambulance">Ambulancia</option>
          <option value="fire">Bomberos</option>
          <option value="security_private">Seguridad Privada</option>
          <option value="other">Otro</option>
        </select>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-2">Entidad creada correctamente</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
};
