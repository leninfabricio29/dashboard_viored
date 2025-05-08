import {
  FiUsers, FiRadio, FiPieChart, FiMapPin,
  FiBell, FiClock, FiImage
} from 'react-icons/fi'
import ModuleCard from '../components/UI/ModuleCard'

const Dashboard = () => {
  // Definición de los módulos
  // Definición de los módulos
  const modules = [
      {
        title: 'Mapas',
        description: 'Visualización de mapas interactivos',
        path: '/maps',
        icon: <FiMapPin className="h-6 w-6" />,
        bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        iconColor: 'text-white',
        hoverEffect: 'hover:shadow-indigo-200'
      },
      {
        title: 'Estadísticas',
        description: 'Reportes y análisis de datos',
        path: '/statistics',
        icon: <FiPieChart className="h-6 w-6" />,
        bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
        iconColor: 'text-white',
        hoverEffect: 'hover:shadow-orange-200'
      },
      {
        title: 'Usuarios',
        description: 'Gestión de usuarios del sistema',
        path: '/users',
        icon: <FiUsers className="h-6 w-6" />,
        bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
        iconColor: 'text-white',
        hoverEffect: 'hover:shadow-blue-200'
      },
      {
        title: 'Barrios',
        description: 'Administración de barrios',
        path: '/neighborhood',
        icon: <FiRadio className="h-6 w-6" />,
        bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
        iconColor: 'text-white',
        hoverEffect: 'hover:shadow-green-200'
      },
      {
        title: 'Notificaciones',
        description: 'Gestión de alertas y avisos',
        path: '/notifications',
        icon: <FiBell className="h-6 w-6" />,
        bgColor: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
        iconColor: 'text-white',
        hoverEffect: 'hover:shadow-yellow-200'
      },
      {
        title: 'Gest. Multimedia',
        description: 'Gestión de contenido multimedia',
        path: '/multimedia',
        icon: <FiImage className="h-6 w-6" />,
        bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
        iconColor: 'text-white',
        hoverEffect: 'hover:shadow-purple-200'
      },
      {
        title: 'Historial',
        description: 'Registro de actividades',
        path: '/history',
        icon: <FiClock className="h-6 w-6" />,
        bgColor: 'bg-gradient-to-br from-gray-600 to-gray-700',
        iconColor: 'text-white',
        hoverEffect: 'hover:shadow-gray-200'
      },
  ];
  

  return (
    <div className="  py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado mejorado */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gestión integral de todas las funcionalidades del sistema
          </p>
        </div>
        
        {/* Grid de módulos mejorado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <ModuleCard
              key={index}
              title={module.title}
              description={module.description}
              path={module.path}
              icon={module.icon}
              bgColor={module.bgColor}
              iconColor={module.iconColor}
              hoverEffect={module.hoverEffect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard