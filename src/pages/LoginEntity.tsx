import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiKey, FiEyeOff, FiEye } from "react-icons/fi";
import authService from "../../src/services/auth-service";

const LoginEntity = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!email || !password) {
    setError("Por favor, ingrese su email y contraseña");
    return;
  }

  setIsLoading(true);
  setError("");

  try {
    const response = await authService.login({ email, password });

    if (response.user.role === "admin") {
      navigate("/monitoring"); // solo redirige si es admin
    } else {
      setError("No tienes permisos para acceder a esta página");
    }

  } catch (err: any) {
    console.error("Error de inicio de sesión:", err);

    if (err.response?.data?.message) {
      setError(err.response.data.message);
    } else {
      setError("Error al iniciar sesión. Por favor, intente de nuevo.");
    }
  } finally {
    setIsLoading(false);
  }
};


  return (
   <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
  <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6 border border-slate-200">
    <div className="flex flex-col items-center text-center">
      <div className="bg-blue-800 rounded-full p-4 mb-4 shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-blue-900 tracking-tight">V-SOS Monitoreo</h1>
      <p className="text-slate-600 mt-2 text-sm">
        Acceso exclusivo para entidades oficiales
      </p>
    </div>

    

    {error && (
      <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-4 rounded text-sm flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Correo institucional
        </label>
        <input
          type="email"
          id="email"
          className="mt-1 w-full px-4 py-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          placeholder="usuario@entidad.gob"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            className="mt-1 w-full px-4 py-3 pr-12 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-800 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 transition flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            Iniciando sesión...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>
    </form>

    <div className="text-center text-sm mt-6 text-slate-500">
      <button
        onClick={() => navigate("/reset-password")}
        className="text-blue-700 hover:text-blue-900 font-medium"
      >
        ¿Olvidaste tu contraseña?
      </button>
    </div>
     <div className="text-center text-sm mt-6 text-slate-500">
      <button
        onClick={() => navigate("/login")}
        className="text-gray-50  font-medium cursor-pointer bg-gray-400 px-4 py-2 rounded-md"
      >
        Regresar
      </button>
    </div>
  </div>
</div>

  );
};

export default LoginEntity;
