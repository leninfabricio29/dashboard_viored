import React from "react";
import { useNavigate } from "react-router-dom";

const ButtonHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-400 cursor-pointer"
    >
      Regresar 
    </button>
  );
};

export default ButtonHome;