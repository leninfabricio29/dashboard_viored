import React from "react";
import { useNavigate } from "react-router-dom";

const ButtonHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-blue-950 hover:text-white text-gray-800 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md cursor-pointer mt-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Regresar
    </button>
  );
};

export default ButtonHome;
