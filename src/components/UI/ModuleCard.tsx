import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ModuleCardProps {
  title: string;
  description: string;
  path: string;
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
  hoverEffect?: string;
}

const ModuleCard = ({
  title,
  description,
  path,
  icon,
  bgColor,
  iconColor,
  hoverEffect = "hover:shadow-gray-200",
}: ModuleCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(path);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer 
      transition-all duration-300 hover:shadow-lg hover:-translate-y-1 
      border border-gray-100 ${hoverEffect} h-full`}
      onClick={handleClick}
    >
      <div className="p-6 flex flex-col items-center">
        {/* Icono con gradiente */}
        <div
          className={`${bgColor} ${iconColor} w-14 h-14 rounded-xl 
          flex items-center justify-center mb-4 shadow-inner`}
        >
          {icon}
        </div>
        
        {/* Contenido textual */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      
      {/* Efecto de hover sutil */}
      <div className="bg-gradient-to-r from-transparent to-transparent via-white/50 h-1 w-full opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );

};

export default ModuleCard;
