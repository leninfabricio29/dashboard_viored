import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAllPackages,
  uploadImages,
} from "../../../services/media-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import ModalUpload from "../../../components/layout/ModalUpload";

const PackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const packageId = id || ""; // Asegúrate de que packageId sea un string

  const fetchPackage = async () => {
    try {
      const data = await getAllPackages();
      const packageFound = data.find((pkg: any) => pkg._id === id);
      if (!packageFound) {
        throw new Error("Paquete no encontrado");
      }
      setPackageData(packageFound);
    } catch (error) {
      console.error("Error al obtener el paquete:", error);
      navigate("/multimedia", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackage();
  }, [id, navigate]);

  const handleUploadImages = async (files: FileList) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    try {
      // Aquí puedes pasar el packageId dinámicamente o como prop/estado
      const response = await uploadImages(formData, packageId);
      fetchPackage(); // Refresca los datos del paquete después de subir las imágenes
    } catch (error) {
      console.error("Error al subir imágenes:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Paquete no encontrado
          </h1>
          <button
            onClick={() => navigate("/multimedia")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Volver al gestor multimedia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      {/* Panel principal */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Encabezado del panel */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {packageData.name}
              </h2>
              <div className="flex items-center mt-2 space-x-4">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    packageData.status
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {packageData.status ? "Activo" : "Inactivo"}
                </span>
                <span className="text-sm text-gray-500">
                  Tipo:{" "}
                  {packageData.type === "avatar"
                    ? "Avatar"
                    : packageData.type === "barrio"
                    ? "Barrio"
                    : packageData.type === "publicidad"
                    ? "Publicidad"
                    : packageData.type}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowUploadModal(true);
              }}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Agregar Fotos
            </button>
            <ModalUpload
              isOpen={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              onUpload={handleUploadImages}
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Descripción (si existe) */}
          {packageData.description && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Descripción
              </h3>
              <p className="text-gray-700">{packageData.description}</p>
            </div>
          )}

          {/* Galería de imágenes */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Galería de imágenes ({packageData.images.length})
            </h3>

            {packageData.images.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {packageData.images.map((image) => (
                  <div
                    key={image._id}
                    className="relative group rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all"
                  >
                    <img
                      src={image.url}
                      alt="Imagen del paquete"
                      className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300 flex items-center justify-center">
                      <button
                        onClick={() => window.open(image.url, "_blank")}
                        className="opacity-0 group-hover:opacity-100 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-1.5 transition-all cursor-pointer"
                        title="Ver en tamaño completo"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay imágenes
                </h3>
                <p className="mt-1 text-sm text-gray-500 mb-4">
                  Agrega fotos para este paquete
                </p>
                <button
                  onClick={() => {
                    /* Lógica para agregar fotos */
                    setShowUploadModal(true);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="-ml-0.5 mr-1.5 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Agregar fotos
                </button>
                <ModalUpload
                  isOpen={showUploadModal}
                  onClose={() => setShowUploadModal(false)}
                  onUpload={handleUploadImages}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pie del panel */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Creado el {new Date(packageData.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailPage;
