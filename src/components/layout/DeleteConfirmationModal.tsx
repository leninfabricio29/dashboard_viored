import { FiAlertTriangle, FiX, FiTrash2 } from "react-icons/fi";

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Encabezado */}
        <div className="bg-red-50 p-4 flex items-center justify-between border-b border-red-100">
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-500 mr-2" size={20} />
            <h3 className="font-semibold text-red-600">Confirmar eliminación</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            ¿Estás seguro de que deseas eliminar permanentemente al usuario{" "}
            <span className="font-semibold text-gray-900">{userName}</span>?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer. Todos los datos asociados a este usuario serán eliminados.
          </p>
        </div>
        
        {/* Acciones */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center cursor-pointer"
          >
            <FiTrash2 className="mr-2" />
            Eliminar definitivamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;