import React from "react";
import { useLocation } from "react-router-dom";
import { FiHome, FiChevronRight } from "react-icons/fi";

const ButtonIndicator: React.FC = () => {
  const location = useLocation();

  // Diccionario de traducción EN → ES
  const translations: Record<string, string> = {
    users: "Usuarios",
    notifications: "Notificaciones",
    statistics: "Estadísticas",
    neighborhood: "Barrios",
    entities: "Entidades",
    detalle: "Detalle",
    history: "Bitácora",
    settings: "Configuración",
    maps: "Mapas",
  };

  const getPathSegments = () => {
    const path = location.pathname;
    const segments = path.split("/").filter((segment) => segment !== "");

    if (segments.length === 0) return [{ name: "Inicio", path: "/" }];

    return segments.map((segment, index) => {
      // Si el segmento es un ID (Mongo ObjectID)
      if (segment.match(/^[0-9a-fA-F]{24}$/)) {
        return {
          name: translations["detalle"],
          path: `/${segments.slice(0, index + 1).join("/")}`,
        };
      }

      const lowerSegment = segment.toLowerCase();
      const translatedName = translations[lowerSegment] || segment;

      return {
        name: translatedName.charAt(0).toUpperCase() + translatedName.slice(1),
        path: `/${segments.slice(0, index + 1).join("/")}`,
      };
    });
  };

  const segments = getPathSegments();

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
        <li className="inline-flex items-center">
          <div className="inline-flex items-center text-base font-medium text-gray-800 hover:text-blue-600 transition-colors">
            <FiHome className="w-5 h-5 mr-2" />
            Inicio
          </div>
        </li>

        {segments.map((segment, index) => (
          <li key={index} className="inline-flex items-center">
            <FiChevronRight className="w-5 h-5 mx-1.5 text-gray-400" />
            {index === segments.length - 1 ? (
              <span className="ms-1 text-base font-semibold text-gray-600 md:ms-2">
                {segment.name}
              </span>
            ) : (
              <div className="ms-1 text-base font-medium text-gray-700 hover:text-blue-600 md:ms-2 transition-colors">
                {segment.name}
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default ButtonIndicator;
