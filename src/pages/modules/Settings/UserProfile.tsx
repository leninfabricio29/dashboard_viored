import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import authService from "../../../services/auth-service";
import userService from "../../../services/user-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import { FiEye, FiEyeOff, FiSettings } from "react-icons/fi";
import { getAllPackages } from "../../../services/media-service";

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { id } = useParams();
  const [userEmail, setUserEmail] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [userData, setUserData] = useState({
    email: "",
    phone: "",
    avatar: "",
  });
  const [packages, setPackages] = useState<Package[]>([]);
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [avatarSelection, setAvatarSelection] = useState({
    showModal: false,
    avatars: [] as string[], // Array de URLs de avatares
    selectedAvatar: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null
  );

  const navigate = useNavigate();

  const toggleVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Obtener el email del usuario
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        if (!id) {
          setError("No se encontró el ID de usuario");
          return;
        }

        const userData = await userService.getUserById(id);
        setUserEmail(userData.email);
      } catch (error) {
        console.error("Error al obtener el email:", error);
        setError("No se pudo obtener la información del usuario");
      } finally {
        setLoadingEmail(false);
      }
    };

    fetchUserEmail();
  }, [id]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await userService.getUserById(id!);
        setUserData({
          email: data.email,
          phone: data.phone || "",
          avatar: data.avatar || "",
        });
      } catch (error) {
        setError("Error al cargar datos del usuario");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPackages();
      const avatarPackages = data.filter(
        (pkg) => pkg.type === "avatar" && pkg.status
      );

      setPackages(avatarPackages);

      const activePkg = avatarPackages[0]; // o el primero activo si hay varios
      if (activePkg) {
        setActivePackageId(activePkg._id);

        // Solo URLs de imágenes del paquete activo
        setAvatarSelection((prev) => ({
          ...prev,
          avatars: activePkg.images.map((img) => img.url),
        }));
      }
    } catch (error) {
      console.error("Error al obtener los paquetes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const AvatarSelectionModal = () => {
    if (!avatarSelection.showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Selecciona tu avatar
              </h3>
              <button
                onClick={() =>
                  setAvatarSelection((prev) => ({ ...prev, showModal: false }))
                }
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            {avatarSelection.avatars.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                No hay avatares disponibles en tu paquete
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {avatarSelection.avatars.map((avatarUrl, index) => (
                  <div
                    key={`avatar-${index}`}
                    className={`relative cursor-pointer transition-all duration-200 ${
                      userData.avatar === avatarUrl
                        ? "ring-4 ring-indigo-500 transform scale-105"
                        : "hover:ring-2 hover:ring-gray-300"
                    } rounded-full overflow-hidden`}
                    onClick={() => {
                      setUserData({ ...userData, avatar: avatarUrl });
                      setAvatarSelection((prev) => ({
                        ...prev,
                        showModal: false,
                      }));
                    }}
                  >
                    <img
                      src={avatarUrl}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        // Manejo de error si la imagen no carga
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/150";
                      }}
                    />
                    {userData.avatar === avatarUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <span className="text-white font-bold bg-indigo-500 rounded-full p-1">
                          ✓
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() =>
                  setAvatarSelection((prev) => ({ ...prev, showModal: false }))
                }
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setRedirectCountdown(null);

    // Validaciones
    if (!userEmail) {
      setError("No se pudo obtener el email del usuario");
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.updatePassword({
        email: userEmail,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess(
        "Contraseña actualizada correctamente. Serás redirigido en 3 segundos..."
      );
      setRedirectCountdown(3);

      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            navigate("/login");
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);

      // Manejo específico de errores
      if (error.response?.status === 400) {
        if (
          error.response.data.message === "La contraseña actual es incorrecta"
        ) {
          setError("La contraseña actual es incorrecta");
        } else if (
          error.response.data.message === "El email no está registrado"
        ) {
          setError(
            "Error de autenticación. Por favor, vuelve a iniciar sesión"
          );
        } else {
          setError(
            error.response.data.message || "Error al actualizar la contraseña"
          );
        }
      } else {
        setError("Error del servidor. Inténtalo de nuevo más tarde");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Filtrar solo los campos que han cambiado
      const updates = {
        ...(userData.email !== "" && { email: userData.email }),
        ...(userData.phone !== "" && { phone: userData.phone }),
        ...(userData.avatar !== "" && { avatar: userData.avatar }),
      };

      const response = await userService.updateUser(id!, updates);
      setSuccess(response.message);
    } catch (error) {
      setError(error.response?.data?.error || "Error al actualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Limpiar mensajes de error al cambiar los campos
    setError("");
    setSuccess("");

    // Validaciones específicas por campo
    switch (name) {
      case "email":
        // Validación básica de email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value !== "") {
          setError("Por favor ingresa un email válido");
        }
        break;

      case "phone":
        // Validación de teléfono (solo números, espacios, guiones y signo +)
        if (!/^[\d\s+-]*$/.test(value)) {
          return; // No actualiza el estado si el valor no es válido
        }
        break;
    }

    // Actualizar el estado solo si pasa las validaciones
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loadingEmail) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Configuración
          </h1>
          <div className="flex items-center text-slate-500">
            <FiSettings className="mr-2 text-sky-500" />
            <span className="text-slate-500">
              Aquí puedes cambiar la contraseña y el avatar de tu perfil
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b bg-slate-800">
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === "profile"
                ? "text-white border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Perfl
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === "password"
                ? "text-white border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("password")}
          >
            Contraseña
          </button>
        </div>

        {/* PASSWORD */}
        <div className="p-8">
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit}>
              {/* Mensajes de error y éxito */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                  {success}
                  {redirectCountdown && (
                    <div className="mt-1 text-sm">
                      Redirigiendo en {redirectCountdown} segundo
                      {redirectCountdown !== 1 ? "s" : ""}...
                    </div>
                  )}
                </div>
              )}

              {/* Contraseña actual */}
              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="currentPassword"
                >
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("current")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="newPassword"
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Confirmar nueva contraseña */}
              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="confirmPassword"
                >
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Procesando...
                    </>
                  ) : (
                    "Cambiar contraseña"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* DATA AVATAR */}
        <div className="p-8">
          {activeTab === "profile" && (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                  {success}
                </div>
              )}

              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="email"
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="phone"
                >
                  Teléfono
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="phone"
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="avatar"
                >
                  Avatar
                </label>

                <div className="flex items-center gap-4">
                  {userData.avatar && (
                    <img
                      src={userData.avatar}
                      alt="Avatar actual"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setAvatarSelection((prev) => ({
                          ...prev,
                          showModal: true,
                        }))
                      }
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Seleccionar Avatar
                    </button>
                    <p className="mt-1 text-xs text-gray-500">
                      Elige un avatar de tu paquete actual
                    </p>
                  </div>
                </div>
              </div>

              <AvatarSelectionModal />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
