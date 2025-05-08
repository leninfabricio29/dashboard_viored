import { useEffect, useState } from 'react';
import { getAllPackages } from '../../../services/media-service';

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
  
  if (images.length === 0) return <p className="text-gray-500 text-sm italic">Sin imágenes</p>;
  
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {(showAllImages ? images : images.slice(0, 3)).map((image, index) => (
          <div key={image._id} className="relative group">
            <img 
              src={image.url} 
              alt="Imagen de paquete" 
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 group-hover:border-blue-400 transition-all"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
              <button 
                onClick={() => window.open(image.url, '_blank')}
                className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white rounded-full p-1 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        
        {images.length > 3 && !showAllImages && (
          <button 
            onClick={() => setShowAllImages(true)}
            className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-medium"
          >
            +{images.length - 3}
          </button>
        )}
        
        {showAllImages && images.length > 3 && (
          <button 
            onClick={() => setShowAllImages(false)}
            className="text-sm text-blue-600 hover:text-blue-800 mt-2"
          >
            Mostrar menos
          </button>
        )}
      </div>
    </div>
  );
};

// Componente para una tarjeta de paquete
const PackageCard = ({ pkg, onEdit }: { pkg: Package, onEdit: (id: string) => void }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">{pkg.name}</h3>
            {pkg.description && (
              <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
            )}
          </div>
          <div>
            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
              pkg.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {pkg.status ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        
        <PackageImageGallery images={pkg.images} />
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-500">
            Creado: {new Date(pkg.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => onEdit(pkg._id)}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal para gestionar el contenido multimedia
const MultimediaManager = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  
  // Obtener los paquetes de la API
  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        const data = await getAllPackages();
        setPackages(data);
      } catch (error) {
        console.error('Error al obtener los paquetes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);
  
  // Filtrar paquetes según la categoría seleccionada
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredPackages(packages);
    } else {
      setFilteredPackages(packages.filter(pkg => pkg.type === activeCategory));
    }
  }, [activeCategory, packages]);
  
  // Obtener categorías únicas para los filtros
  const categories = ['all', ...Array.from(new Set(packages.map(pkg => pkg.type)))];
  
  // Manejador para editar un paquete
  const handleEditPackage = (id: string) => {
    console.log(`Editando paquete con ID: ${id}`);
    // Aquí puedes implementar la navegación a la página de edición o abrir un modal
  };
  
  // Manejador para crear un nuevo paquete
  const handleCreatePackage = () => {
    console.log('Creando nuevo paquete');
    // Aquí puedes implementar la navegación a la página de creación o abrir un modal
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Gestor de Contenido Multimedia</h1>
        
        <button
          onClick={handleCreatePackage}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Paquete
        </button>
      </div>
      
      {/* Filtros de categoría */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'Todos' : 
               category === 'avatar' ? 'Avatares' : 
               category === 'barrio' ? 'Barrios' : 
               category === 'publicidad' ? 'Publicidad' : 
               category}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {filteredPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map(pkg => (
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay paquetes disponibles</h3>
              <p className="text-gray-600 mb-4">
                {activeCategory === 'all' 
                  ? 'No se encontraron paquetes en el sistema.' 
                  : `No se encontraron paquetes de tipo ${activeCategory}.`}
              </p>
              <button
                onClick={handleCreatePackage}
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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