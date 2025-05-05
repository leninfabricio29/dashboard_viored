import {
  FiUsers, FiRadio, FiSettings, FiPieChart, FiMapPin,
  FiBell, FiClock
} from 'react-icons/fi'
import ModuleCard from '../components/UI/ModuleCard'

const Dashboard = () => {
  // Definición de los módulos
  const modules = [
    {
      title: 'Mapas',
      path: '/maps',
      icon: <FiMapPin className="h-8 w-8" />,
      bgColor: 'bg-indigo-500',
      iconColor: 'text-white'
    },
    {
      title: 'Estadísticas',
      path: '/statistics',
      icon: <FiPieChart className="h-8 w-8" />,
      bgColor: 'bg-orange-500',
      iconColor: 'text-white'
    },
    {
      title: 'Usuarios',
      path: '/users',
      icon: <FiUsers className="h-8 w-8" />,
      bgColor: 'bg-blue-500',
      iconColor: 'text-white'
    },
    {
      title: 'Barrios',
      path: '/neighborhood',
      icon: <FiRadio className="h-8 w-8" />,
      bgColor: 'bg-green-500',
      iconColor: 'text-white'
    },
    {
      title: 'Notificaciones',
      path: '/notifications',
      icon: <FiBell className="h-8 w-8" />,
      bgColor: 'bg-yellow-500',
      iconColor: 'text-white'
    },
    {
      title: 'Historial',
      path: '/history',
      icon: <FiClock className="h-8 w-8" />,
      bgColor: 'bg-gray-600',
      iconColor: 'text-white'
    },
    {
      title: 'Configuración',
      path: '/settings',
      icon: <FiSettings className="h-8 w-8" />,
      bgColor: 'bg-purple-500',
      iconColor: 'text-white'
    }
  ];
  

  return (
    <div className="max-w-5xl mx-auto">
    <h1 className="text-2xl font-bold mb-8 text-center">Panel de Administración</h1>
    
    <div className="p-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-auto">
        {modules.map((module, index) => (
          <ModuleCard
            key={index}
            title={module.title}
            path={module.path}
            icon={module.icon}
            bgColor={module.bgColor}
            iconColor={module.iconColor}
          />
        ))}
      </div>
    </div>
  </div>
  )
}

export default Dashboard