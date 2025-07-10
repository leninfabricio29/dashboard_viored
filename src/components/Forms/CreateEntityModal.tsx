import React, { useState } from 'react';
import { entityUsersService } from '../../services/entity.service'; // ajusta si está en otra ruta
import { FiCheck, FiLock, FiMail, FiUser, FiUsers, FiX } from 'react-icons/fi';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
    <FiUsers className="text-blue-600" />
    Crear nueva entidad
  </h2>

  <div className="grid grid-cols-1 gap-4">
    {/* Nombre */}
    <div className="relative">
      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        name="name"
        placeholder="Nombre"
        value={form.name}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
    </div>

    {/* Email */}
    <div className="relative">
      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
    </div>

    {/* Contraseña */}
    <div className="relative">
      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        value={form.password}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
    </div>

    {/* Tipo de entidad */}
    <div className="relative">
      <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <select
        name="type"
        value={form.type}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700"
      >
        <option value="">Tipo de entidad</option>
        <option value="police">Policía</option>
        <option value="ambulance">Ambulancia</option>
        <option value="fire">Bomberos</option>
        <option value="security_private">Seguridad Privada</option>
        <option value="other">Otro</option>
      </select>
    </div>

    {/* Mensajes */}
    {error && (
      <div className="text-red-500 text-sm flex items-center gap-2">
        <FiX className="w-4 h-4" />
        {error}
      </div>
    )}
    {success && (
      <div className="text-green-600 text-sm flex items-center gap-2">
        <FiCheck className="w-4 h-4" />
        Entidad creada correctamente
      </div>
    )}

    {/* Botones */}
    <div className="flex justify-end gap-3 pt-2">
      <button
        onClick={onClose}
        disabled={loading}
        className="px-4 py-2 bg-red-500 hover:bg-red-400 cursor-pointer text-white rounded-lg transition-all"
      >
        Cancelar
      </button>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
            Creando...
          </>
        ) : (
          <>
            <FiCheck />
            Crear
          </>
        )}
      </button>
    </div>
  </div>
</div>
    </div>
  );
};
