import React from "react";
import { useLocation } from "react-router-dom";

const ButtonIndicator: React.FC = () => {
  const location = useLocation();

  // Función para convertir la ruta en un formato legible
  const getPathName = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(segment => segment !== '');
    
    if (segments.length === 0) return 'Inicio';
    
    return segments.map(segment => {
      // Convertir IDs a formato más amigable
      if (segment.match(/^[0-9a-fA-F]{24}$/)) {
        return 'Detalle';
      }
      
      // Capitalizar y formatear palabras
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    }).join(' / ');
  };

  return (
    <div className="flex flex-col items-start">
      <div className="text-xl text-gray-500 bg-green-200 p-2 rounded ">
        Te encuentras en la página: <span className="font-medium">{getPathName()}</span>
      </div>

    </div>

  );
};

export default ButtonIndicator;