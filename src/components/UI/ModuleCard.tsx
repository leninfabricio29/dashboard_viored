import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface ModuleCardProps {
  title: string;
  path: string;
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
}

const ModuleCard = ({ title, path, icon, bgColor, iconColor }: ModuleCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(path);
  };

  return (
    <div className='bg-gray-50 text-gray-700 p-4 rounded-lg cursor-pointer 
             flex flex-col items-center justify-center shadow-md 
             hover:shadow-lg hover:scale-105 transition-all duration-300 
             h-40'
      onClick={handleClick}
    >
      <div
        className={`${bgColor} ${iconColor} w-16 h-16 rounded-xl shadow-inner flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-center">{title}</h3>
    </div>
  );
};

export default ModuleCard;
