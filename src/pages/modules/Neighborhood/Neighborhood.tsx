import { useEffect, useState } from "react";
import {
  FiPlus,
  FiSave,
  FiX,
  FiTrash2,
  FiUsers,
  FiInfo,
  FiEye,
} from "react-icons/fi";
import neighborhoodService from "../../../services/neighborhood-service";
import type { Neighborhood } from "../../../services/neighborhood-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import NeighborhoodMapEditor from "../../../components/layout/NeighborhoodMapEditor";

const Neighborhood = () => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNeighborhood, setNewNeighborhood] = useState({
    name: "",
    description: "",
    area: {
      type: "Polygon",
      coordinates: [] as [number, number][][],
    },
  });

  // States for user modal
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<Neighborhood | null>(null);
  const [neighborhoodUsers, setNeighborhoodUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Image gallery states
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      !newNeighborhood.description ||
      !hasValidCoords ||
      !selectedImage
    ) {
      alert(
        "Debe ingresar nombre, descripción, seleccionar una imagen y dibujar un área válida"
      );
      return;
    }

    try {
      // Include the image in the neighborhood data
      const neighborhoodWithImage = {
        ...newNeighborhood,
        image: selectedImage,
      };

      await neighborhoodService.createNeighborhood(neighborhoodWithImage);
      fetchNeighborhoods();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Error al guardar barrio:", error);
      alert("Ocurrió un error al guardar el barrio");
    }
  };

  const handleDisable = async (id: string) => {
    try {
      await neighborhoodService.disableNeighborhood(id);
      fetchNeighborhoods();
    } catch (err) {
      console.error("Error al deshabilitar barrio:", err);
    }
  };

  // Reset the form
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
    setSelectedImage(null);
  };

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Listado de Barrios
          </h1>
          <p className="text-gray-500 mt-1">
            Administra los barrios de la ciudad y sus usuarios
          </p>
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
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase"
                >
                  Descripción
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase"
                >
                  Usuarios
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase"
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
                      {n.description}
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
                        <div className="relative w-8 h-8">
                          <svg
                            className="w-8 h-8 text-blue-200"
                            viewBox="0 0 30 30"
                            fill="currentColor"
                          >
                            <path d="M15 30c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15z" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {n.isActive && (
                        <button
                          onClick={() => handleDisable(n._id)}
                          className="flex items-center text-red-600 hover:text-red-900"
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
      </div>

      {/* Modal for creating/editing neighborhood */}
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
                      Descripción *
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagen *
                    </label>
                    <div
                      onClick={() => setShowImageGallery(true)}
                      className="w-full h-32 border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {selectedImage ? (
                        <div className="relative w-full h-full">
                          <img
                            src={selectedImage}
                            alt="Imagen del barrio"
                            className="w-full h-full object-cover rounded-md"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-medium">
                              Cambiar imagen
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <svg
                            className="w-10 h-10 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                          </svg>
                          <span className="mt-2 text-sm text-gray-500">
                            Click para seleccionar una imagen
                          </span>
                        </>
                      )}
                    </div>
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
                  !newNeighborhood.description.trim() ||
                  !selectedImage ||
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-indigo-700  p-2.5 flex justify-center">
              <span className="text-white text-sm font-medium">
                Total: {neighborhoodUsers.length} usuario(s)
              </span>
            </div>

            <div className="overflow-y-auto max-h-60">
              {loadingUsers ? (
                <div className="text-center py-12">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3"
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
                  <p className="text-gray-500">Cargando usuarios...</p>
                </div>
              ) : neighborhoodUsers.length === 0 ? (
                <div className="text-center py-12">
                  <FiUsers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">
                    No hay usuarios en este barrio
                  </p>
                  <p className="text-gray-400 text-sm">
                    Los usuarios se mostrarán aquí cuando sean agregados
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {neighborhoodUsers.map((user) => (
                    <li key={user._id} className="flex items-center py-3 px-4">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mr-3">
                        {user.email && user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">
                        {user.email}
                      </span>
                      <span className="px-3 py-1 ml-2  inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Activo
                        </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 flex justify-end bg-gray-50">
              <button
                onClick={() => setShowUsersModal(false)}
                className="px-4 py-2 text-blue-600 font-medium text-sm"
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
