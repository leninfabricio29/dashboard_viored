import { useEffect, useState } from "react";
import { FiPlus, FiSave, FiX } from "react-icons/fi";
import neighborhoodService from "../../../services/neighborhood-service";
import type { Neighborhood } from "../../../services/neighborhood-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import NeighborhoodMapEditor from "../../../components/layout/NeighborhoodMapEditor";

// Componente Principal
const Neighborhood = () => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] =
    useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNeighborhood, setNewNeighborhood] = useState({
    name: "",
    description: "",
    area: {
      type: "Polygon",
      coordinates: [] as [number, number][][],
    },
  });

  const fetchNeighborhoods = async () => {
    try {
      setLoadingNeighborhoods(true);
      const data = await neighborhoodService.getAllNeighborhoods();
      setNeighborhoods(data);
    } catch (err) {
      console.error("Error al cargar barrios:", err);
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  const handleCreateNeighborhood = async () => {
    const coords = newNeighborhood.area.coordinates;
  
    const hasValidCoords =
      Array.isArray(coords) &&
      coords.length > 0 &&
      Array.isArray(coords[0]) &&
      coords[0].length >= 3;
  
    if (!newNeighborhood.name || !newNeighborhood.description || !hasValidCoords) {
      alert("Debe ingresar nombre, descripción y dibujar un área válida");
      return;
    }
  
    try {
      await neighborhoodService.createNeighborhood(newNeighborhood);
      fetchNeighborhoods();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Error al guardar barrio:", error);
      alert("Ocurrió un error al guardar el barrio");
    }
  };
  

  const resetForm = () => {
    setNewNeighborhood({
      name: "",
      description: "",
      area: {
        type: "Polygon",
        coordinates: [],
      },
    });
    setEditingId(null);
  };

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <ButtonIndicator />
      <div className="flex justify-between items-center">
        <ButtonHome />

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiPlus className="mr-2" />
          Agregar Barrio
        </button>
      </div>

      {/* Tabla de barrios */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingNeighborhoods ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Cargando barrios...
                    </div>
                  </td>
                </tr>
              ) : neighborhoods.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No se encontraron barrios registrados
                  </td>
                </tr>
              ) : (
                neighborhoods.map((neighborhood) => (
                  <tr
                    key={neighborhood._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {neighborhood.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {neighborhood.description || (
                        <span className="italic text-gray-400">
                          Sin descripción
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear/editar barrio */}
      {showCreateModal && import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? "Editar Barrio" : "Agregar Nuevo Barrio"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Barrio *
                    </label>
                    <input
                      type="text"
                      required={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newNeighborhood.name}
                      onChange={(e) =>
                        setNewNeighborhood({
                          ...newNeighborhood,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ej: Centro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      required={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newNeighborhood.description}
                      onChange={(e) =>
                        setNewNeighborhood({
                          ...newNeighborhood,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descripción del área del barrio"
                    />
                  </div>

                  <div className="pt-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Instrucciones:
                    </h4>
                    <ul className="text-xs text-gray-500 space-y-1 list-disc pl-5">
                      <li>Haz clic en el mapa para agregar puntos</li>
                      <li>Haz clic en "Reiniciar" para empezar de nuevo</li>
                      <li>
                        Al menos 3 puntos son necesarios para formar un área
                      </li>
                      <li>
                        La forma de ser cuadrada, no se puede hacer un poligono
                        con forma de estrella o de cualquier otra figura.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="md:col-span-2 h-96 bg-gray-100 rounded-md overflow-hidden">
                  <NeighborhoodMapEditor
                    onPolygonComplete={(coords) => {
                      setNewNeighborhood({
                        ...newNeighborhood,
                        area: {
                          type: "Polygon",
                          coordinates: [coords],
                        },
                      });
                    }}
                    initialCoordinates={
                      newNeighborhood.area.coordinates[0] || []
                    }
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNeighborhood}
                disabled={
                  !newNeighborhood.name.trim() ||
                  !newNeighborhood.description.trim() ||
                  newNeighborhood.area.coordinates[0]?.length < 3
                }
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="inline mr-2" />
                {editingId ? "Actualizar Barrio" : "Guardar Barrio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Neighborhood;
