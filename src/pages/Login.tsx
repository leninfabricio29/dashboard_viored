import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiKey, FiEyeOff, FiEye } from "react-icons/fi";
import authService from "../../src/services/auth-service";
import Logo from "../assets/icon.png";

const Login = () => {
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
    if (response.user.isActive === false) {
      setError("Tu cuenta está inactiva. Por favor, contacta al administrador.");
      setIsLoading(false);
      return;
    }
    // Guardar el rol y el id del usuario en el localStorage
    localStorage.setItem("role", response.user.role);
    localStorage.setItem("userId", response.user._id);
    if (response.user.role === "entity" || response.user.role === "son") {
      localStorage.setItem("entity_sonId", response.entidadId || '');
    }
    if (response.user.role === "admin") {
      navigate("/");
    } else if (response.user.role === "entity" || response.user.role === "son") {
      navigate("/monitoring");
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
    <div className="min-h-screen flex items-center justify-center ">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden p-10 space-y-8 border border-indigo-100">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full px-5 mb-5">
           <img
              src={Logo}
              alt="Logo de la empresa"
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-700 tracking-tight drop-shadow">V-SOS Gestión</h1>
          <p className="text-slate-400 mt-2 text-base font-medium">Accede a tu panel de emergencias</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl flex items-center text-sm shadow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-base font-semibold text-slate-700">
              <div className="flex items-center">
                <FiUser className="h-5 w-5 mr-2 text-slate-400" />
                Email
              </div>
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-5 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white/80 text-slate-700 placeholder-slate-300 font-medium shadow-sm transition duration-300"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2 ">
            <label htmlFor="password" className="block text-base font-semibold text-slate-700">
              <div className="flex items-center">
                <FiKey className="h-5 w-5 mr-2 text-slate-500" />
                Contraseña
              </div>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full px-5 py-3 pr-12 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white/80 text-slate-700 placeholder-slate-300 font-medium shadow-sm transition duration-300"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-700 text-white py-3 px-4 rounded-xl font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition duration-300 flex justify-center items-center gap-2"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              <>Iniciar sesión</>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-indigo-400 mt-6">
          <button
            onClick={() => navigate("/reset-password")}
            className="text-indigo-600 cursor-pointer hover:text-pink-500 font-semibold underline underline-offset-2 transition"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
