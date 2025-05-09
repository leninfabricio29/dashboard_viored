import { useEffect, useState } from "react";
import {
  getAllPackages,
  createPackage,
  getImages,
} from "../../../services/media-service";
import CreatePackageModal from "../../../components/layout/CreatePackageModal";
import EditPackageModal from "../../../components/layout/EditPackageModal";

interface PackageImage {
  _id: string;
  url: string;
  public_id: string;
  package: string;
  createdAt: string;
}

interface Package {
  _id: string;
  name: string;
  type: string;
  description?: string;
  status: boolean;
  images: PackageImage[];
  createdAt: string;
}

// Componente para mostrar las imágenes de un paquete
const PackageImageGallery = ({ images }: { images: PackageImage[] }) => {
  const [showAllImages, setShowAllImages] = useState(false);

  if (images.length === 0)
    return <p className="text-gray-500 text-sm italic">Sin imágenes</p>;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        {(showAllImages ? images : images.slice(0, 3)).map((image, index) => (
          <div
            key={image._id}
            className="relative group rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all"
          >
            <img
              src={image.url}
              alt="Imagen de paquete"
              className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
              <button
                onClick={() => window.open(image.url, "_blank")}
                className="opacity-0 group-hover:opacity-100 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-1.5 transition-all cursor-pointer"
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

        {images.length > 3 && !showAllImages && (
          <button
            onClick={() => setShowAllImages(true)}
            className="w-20 h-20 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl flex items-center justify-center text-gray-700 font-semibold transition "
          >
            +{images.length - 3}
          </button>
        )}
      </div>

      {showAllImages && images.length > 3 && (
        <div className="mt-2">
          <button
            onClick={() => setShowAllImages(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            Mostrar menos
          </button>
        </div>
      )}
    </div>
  );
};

// Componente para una tarjeta de paquete

// Componente principal para gestionar el contenido multimedia
const MultimediaManager = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Obtener los paquetes de la API
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPackages();
      setPackages(data);
    } catch (error) {
      console.error("Error al obtener los paquetes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const image = await getImages();
      console.log(image);
    } catch (error) {
      console.error("Error al obtener las imagenes:", error);
    }
  };

  // Filtrar paquetes según la categoría seleccionada
  useEffect(() => {
    if (activeCategory === "all") {
      setFilteredPackages(packages);
    } else {
      setFilteredPackages(
        packages.filter((pkg) => pkg.type === activeCategory)
      );
    }
  }, [activeCategory, packages]);

  // Obtener categorías únicas para los filtros
  const categories = [
    "all",
    ...Array.from(new Set(packages.map((pkg) => pkg.type))),
  ];

  // Manejador para editar un paquete
  const handleEditPackage = (pkg: Package) => {
  };

  // Manejador para crear un nuevo paquete
  const handleCreatePackage = async (formData) => {
    try {
      await createPackage(formData);
      fetchPackages();
    } catch (error) {
      console.error("Error al crear el paquete:", error);
    } finally {
      setIsModalOpen(false);
    }
  };

  const PackageCard = ({
    pkg,
    onEdit,
  }: {
    pkg: Package;
    onEdit: (pkg: string) => void;
  }) => {
    return (
      <div
        className="bg-white  rounded-2xl shadow-sm transition-all hover:shadow-indigo-300 duration-300 hover:shadow-lg hover:-translate-y-1 
        border border-gray-100"
      >
        <div className="p-5">
          {/* Título y estado */}
          <div className="flex justify-between items-start">
            <div className="space-y-1 w-64">
              <h3 className="text-xl font-semibold text-gray-900">
                {pkg.name}
              </h3>
              {pkg.description && (
                <p className="text-sm text-gray-600">{pkg.description}</p>
              )}
            </div>
            <div>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  pkg.status
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {pkg.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>

          {/* Galería de imágenes */}
          <div className="mt-4">
            <PackageImageGallery images={pkg.images} />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-5 pt-3 border-t border-indigo-200">
            <span className="text-xs text-gray-500">
              Creado: {new Date(pkg.createdAt).toLocaleDateString()}
            </span>
            <button
              onClick={() => onEdit(pkg)}
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          Gestor de Contenido Multimedia
        </h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nuevo Paquete
        </button>
        <CreatePackageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreatePackage}
        />
      </div>

      {/* Filtros de categoría */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const label =
              category === "all"
                ? "Todos"
                : category === "avatar"
                ? "Avatares"
                : category === "barrio"
                ? "Barrios"
                : category === "publicidad"
                ? "Publicidad"
                : category.charAt(0).toUpperCase() + category.slice(1);

            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium shadow-sm border transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {category === "avatar" && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5.121 17.804A10 10 0 0112 2a10 10 0 016.879 15.804M15 12a3 3 0 01-6 0" />
                  </svg>
                )}
                {category === "barrio" && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0v6a1 1 0 01-1 1h-3m-4 0h-4" />
                  </svg>
                )}
                {category === "publicidad" && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 5h18M3 12h18M3 19h18" />
                  </svg>
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {filteredPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg._id}
                  pkg={pkg}
                  onEdit={handleEditPackage}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12a4 4 0 100-8 4 4 0 000 8z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay paquetes disponibles
              </h3>
              <p className="text-gray-600 mb-4">
                {activeCategory === "all"
                  ? "No se encontraron paquetes en el sistema."
                  : `No se encontraron paquetes de tipo ${activeCategory}.`}
              </p>
              <button
                onClick={handleCreatePackage}
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Crear primero paquete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MultimediaManager;
