import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiKey, FiEyeOff, FiEye, FiAlertCircle } from "react-icons/fi";
import authService from "../../src/services/auth-service";
import Logo from "../assets/icon.png";
import accessService from "../services/access-service";

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
      const roleName = response.user.role.name;

      // Guardar el rol, el id y el token del usuario en el localStorage
      localStorage.setItem("role", roleName);
      localStorage.setItem("userId", response.user._id);
      if (response.entidadId) {
        localStorage.setItem("entity_sonId", response.entidadId);
      } else {
        localStorage.removeItem("entity_sonId");
      }

      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      await accessService.refreshCurrentUserAccess();

      if (roleName === "admin") {
        navigate("/", { replace: true });
      } else if (roleName !== "user") {
        navigate("/live", { replace: true });
      } else {
        setError("No tienes permisos para acceder a este panel de administración.");
      }

      // Los módulos se obtienen de /api/access/me; no viajan en la respuesta de login.
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
    <div className="min-h-screen flex items-stretch bg-slate-100">
      {/* Panel izquierdo: identidad + estado del sistema */}
      <div className="hidden lg:flex lg:w-[42%] bg-[#000000] text-white flex-col justify-between p-12 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Logo de la empresa" className="w-12 h-12 object-contain" />
            <span className="text-xs font-mono tracking-[0.3em] text-indigo-200 uppercase">
              Panel de control
            </span>
          </div>

          <h1 className="mt-16 text-5xl font-extrabold tracking-tight leading-tight">
            V-SOS
            <br />
            Gestión
          </h1>
          <p className="mt-4 text-slate-300 text-base font-medium max-w-xs">
            Accede a tu panel de emergencias para coordinar y dar seguimiento en tiempo real.
          </p>

          <div className="flex items-center justify-center mt-4">
            <img
              src="https://i.pinimg.com/originals/2c/32/1f/2c321f2bf0f6e8e9d21676cc30a9715f.gif?nii=t"
              alt="Loading"
            />
          </div>
        </div>

        {/* Firma visual: mini consola de estado, en línea con un sistema de emergencias */}
        <div className="font-mono text-xs">
          <div className="border-t border-white/15 pt-6 space-y-3">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-300"></span>
                </span>
                RED DE EMERGENCIA
              </span>
              <span className="text-white">ACTIVA</span>
            </div>

          </div>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center text-center mb-10">
            <img src={Logo} alt="Logo de la empresa" className="w-20 h-20 object-contain mb-3" />
            <h1 className="text-3xl font-extrabold text-slate-700 tracking-tight">V-SOS Gestión</h1>
            <p className="text-slate-400 mt-1 text-sm font-medium">Accede a tu panel de emergencias</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <div className="flex items-center gap-3">
            <span className="text-xs font-mono tracking-[0.3em] text-indigo-400 uppercase">
              Panel de control
            </span>
          </div>
    
            <h2 className="text-2xl font-bold text-slate-700">Iniciar sesión</h2>
            <p className="text-slate-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl flex items-start text-sm shadow-sm mb-6">
              <FiAlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
              >
                Email
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-slate-700 placeholder-slate-300 font-medium shadow-sm transition duration-200"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/reset-password")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-slate-700 placeholder-slate-300 font-medium shadow-sm transition duration-200"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-700 text-white py-3 px-4 rounded-xl font-bold text-base shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition duration-200 flex justify-center items-center gap-2 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1 h-5 w-5 text-white"
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
        </div>
      </div>
    </div>
  );
};

export default Login;