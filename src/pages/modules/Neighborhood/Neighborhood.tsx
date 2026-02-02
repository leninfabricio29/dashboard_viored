import { useEffect, useState } from "react";
import { FiPlus, FiSave, FiX, FiUsers, FiInfo } from "react-icons/fi";
import neighborhoodService from "../../../services/neighborhood-service";
import type { Neighborhood } from "../../../services/neighborhood-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import NeighborhoodMapEditor from "../../../components/layout/NeighborhoodMapEditor";
import DeleteConfirmationModal from "../../../components/layout/DeleteConfirmationModal";

const Neighborhood = () => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNeighborhood, setNewNeighborhood] = useState({
    name: "",
    port: "",
    area: {
      type: "Polygon",
      coordinates: [] as [number, number][][],
    },
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // States for user modal
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<Neighborhood | null>(null);
  const [neighborhoodUsers, setNeighborhoodUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Image gallery states
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<
    string | null
  >(null);

  // Sample gallery images (replace with actual images from your project)
  const galleryImages = [
    "https://blog.uber-cdn.com/cdn-cgi/image/width=2160,quality=80,onerror=redirect,format=auto/wp-content/uploads/2019/01/6-barrios-de-Guayaquil-que-te-deslumbrar%C3%A1n-por-sus-edificaciones-1024x512.png",
    "https://blog.uber-cdn.com/cdn-cgi/image/width=2160,quality=80,onerror=redirect,format=auto/wp-content/uploads/2019/01/Barrio-Las-Pe%C3%B1as.png",
    "https://c.files.bbci.co.uk/AA22/production/_95845534_gettyimages-499950022.jpg",
    "https://blog.uber-cdn.com/cdn-cgi/image/width=2160,quality=80,onerror=redirect,format=auto/wp-content/uploads/2019/01/6-barrios-de-Guayaquil-que-te-deslumbrar%C3%A1n-por-sus-edificaciones-1024x512.png",
    "https://blog.uber-cdn.com/cdn-cgi/image/width=2160,quality=80,onerror=redirect,format=auto/wp-content/uploads/2019/01/Barrio-Las-Pe%C3%B1as.png",
    "https://c.files.bbci.co.uk/AA22/production/_95845534_gettyimages-499950022.jpg",
  ];

  // Function to load all neighborhoods
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

  // Function to fetch neighborhood users and update counts
  const fetchNeighborhoodUsers = async (neighborhoodId: string) => {
    try {
      setLoadingUsers(true);
      const users = await neighborhoodService.getNeighborhoodUsers(
        neighborhoodId
      );
      setNeighborhoodUsers(users);
    } catch (err) {
      console.error("Error al cargar usuarios del barrio:", err);
      setNeighborhoodUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handler to view users when clicking on the users icon/count
  const handleViewUsers = (neighborhood: Neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setShowUsersModal(true);
    fetchNeighborhoodUsers(neighborhood._id);
  };

  const handleCreateNeighborhood = async () => {
    const coords = newNeighborhood.area.coordinates;
    const hasValidCoords = Array.isArray(coords) && coords[0]?.length >= 3;

    if (
      !newNeighborhood.name ||
      !newNeighborhood.port ||
      !hasValidCoords 
    ) {
      alert(
        "Debe ingresar nombre, puerto y dibujar un área válida"
      );
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

  const handleDisableClick = (id: string) => {
    setSelectedNeighborhoodId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleDisableConfirmation = async () => {
    if (!selectedNeighborhoodId) return;

    try {
      await neighborhoodService.disableNeighborhood(selectedNeighborhoodId);
      fetchNeighborhoods();
      setShowDeleteModal(false); // cerrar el modal
    } catch (err) {
      console.error("Error al deshabilitar barrio:", err);
    }
  };

  // Reset the form
  const resetForm = () => {
    setNewNeighborhood({
      name: "",
      port: "",
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Listado de Barrios
          </h1>
          <div className="flex items-center text-slate-500">
            <FiInfo className="mr-2" />
            +{neighborhoods.length} barrio(s) registrado(s)
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition duration-200"
        >
          <FiPlus /> Agregar Barrio
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead
              className="shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 
         transition-all duration-300 
        overflow-hidden "
            >
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-white uppercase"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-white uppercase"
                >
                  Sirenas en barrio
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-white uppercase"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-white uppercase"
                >
                  Usuarios
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-white uppercase"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingNeighborhoods ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="animate-spin h-8 w-8 text-blue-500 mb-2"
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
                      <p>Cargando barrios...</p>
                    </div>
                  </td>
                </tr>
              ) : neighborhoods.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FiInfo className="h-8 w-8 text-gray-400 mb-2" />
                      <p>No se encontraron barrios</p>
                      <button
                        onClick={() => {
                          resetForm();
                          setShowCreateModal(true);
                        }}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Agregar un barrio
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                neighborhoods.map((n) => (
                  <tr
                    key={n._id}
                    className="hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {n.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {n.port}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {n.isActive ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewUsers(n)}
                        className="flex items-center justify-center"
                      >
                        <div className="relative bg-amber-400 rounded-md cursor-pointer px-2 py-1 hover:bg-amber-400 transition-colors">
                          <strong className="text-white">Ver usuarios</strong> 
                          <div>
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {n.isActive && (
                        <button
                          onClick={() => handleDisableClick(n._id)}
                          className="flex items-center px-4 py-2 bg-white border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
                        >
                          <svg
                            className="w-5 h-5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDisableConfirmation}
          userName={
            neighborhoods.find((n) => n._id === selectedNeighborhoodId)?.name || ""
          }
          entityType="barrio"
        />
      </div>

      {/* Modal for creating/editing neighborhood */}
      {showCreateModal && import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                   {/*
                   
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puerto de activación Rele *
                    </label>
                    <input
                      required={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newNeighborhood.port}
                      onChange={(e) =>
                        setNewNeighborhood({
                          ...newNeighborhood,
                          port: e.target.value,
                        })
                      }
                      placeholder="Ingresar el puerto del barrio (ej: 8080)"
                    />
                  </div>*/}     
                 

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
                        La forma debe ser cerrada, no se puede hacer un polígono
                        con forma de estrella o de cualquier otra figura
                        compleja.
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
                  !newNeighborhood.port.trim() ||
                  !Array.isArray(newNeighborhood.area.coordinates[0]) ||
                  newNeighborhood.area.coordinates[0].length < 3
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

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Seleccione una imagen
              </h3>
              <button
                onClick={() => setShowImageGallery(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryImages.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedImage(image);
                      setShowImageGallery(false);
                    }}
                    className={`aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImage === image
                        ? "border-blue-500 ring-2 ring-blue-500"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Imagen de galería ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Seleccione una imagen para el barrio
              </div>
              <button
                onClick={() => setShowImageGallery(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing users */}
      {showUsersModal && selectedNeighborhood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
          
          {/* Encabezado */}
          <div className="bg-slate-900 py-3 px-4 flex justify-between items-center">
            <h2 className="text-white font-semibold text-base">Usuarios del barrio</h2>
            <span className="text-white text-sm opacity-90">
              Total: {neighborhoodUsers.length}
            </span>
          </div>
      
          {/* Lista */}
          <div className="overflow-y-auto max-h-72 divide-y divide-gray-100">
            {loadingUsers ? (
              <div className="text-center py-12">
                <svg
                  className="animate-spin h-8 w-8 text-slate-500 mx-auto mb-3"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">Cargando usuarios...</p>
              </div>
            ) : neighborhoodUsers.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay usuarios en este barrio</p>
                <p className="text-gray-400 text-sm mt-1">
                  Los usuarios se mostrarán aquí cuando sean agregados
                </p>
              </div>
            ) : (
              <ul>
                {neighborhoodUsers.map((user) => (
                  <li key={user._id} className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 transition">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 font-semibold flex items-center justify-center text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm font-medium">{user.email}</p>
                      <span className="text-green-600 text-xs font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
      
          {/* Footer */}
          <div className="p-4 bg-gray-50 flex justify-end">
            <button
              onClick={() => setShowUsersModal(false)}
              className="flex items-center px-4 py-2 bg-white border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
      
      )}
    </div>
  );
};

export default Neighborhood;
