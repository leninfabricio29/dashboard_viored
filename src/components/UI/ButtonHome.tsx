import React from "react";
import { useNavigate } from "react-router-dom";

const ButtonHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-800 text-slate-700 hover:text-white rounded-xl transition-all duration-300 border border-slate-300 hover:border-slate-700 shadow-xs hover:shadow-md cursor-pointer group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors"
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
      <span className="font-medium">Regresar</span>
    </button>
  );
};

export default ButtonHome;
