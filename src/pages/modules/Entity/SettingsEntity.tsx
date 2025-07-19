import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import authService from "../../../services/auth-service";
import userService from "../../../services/user-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import { FiEye, FiEyeOff, FiSettings, FiUser, FiLock } from "react-icons/fi";
import { getAllPackages } from "../../../services/media-service";

const TABS = [
    { key: "profile", label: "Mi cuenta", icon: <FiUser /> },
    { key: "password", label: "Contraseña", icon: <FiLock /> },
];

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
    const [avatarSelection, setAvatarSelection] = useState({
        showModal: false,
        avatars: [] as string[],
        selectedAvatar: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserEmail = async () => {
            try {
                if (!id) {
                    setError("No se encontró el ID de usuario");
                    return;
                }
                const userData = await userService.getUserById(id);
                setUserEmail(userData.email);
            } catch {
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
            } catch {
                setError("Error al cargar datos del usuario");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    useEffect(() => {
        fetchPackages();
        // eslint-disable-next-line
    }, []);

    const fetchPackages = async () => {
        setIsLoading(true);
        try {
            const data = await getAllPackages();
            const activePackage = data.find(
                (pkg: any) => pkg.type === "avatar" && pkg.status
            );
            if (activePackage) {
                setAvatarSelection((prev) => ({
                    ...prev,
                    avatars: activePackage.images.map((img: any) => img.url),
                    selectedAvatar: userData.avatar || "",
                }));
            }
        } catch {
            setError("No se pudieron cargar los avatares disponibles");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleVisibility = (field: "current" | "new" | "confirm") => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handlePasswordChange = (e: any) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError("");
        setSuccess("");
    };

    const handlePasswordSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");
        setRedirectCountdown(null);

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
            await authService.updatePassword({
                email: userEmail,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setSuccess("Contraseña actualizada correctamente. Redirigiendo...");
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
        } catch (error: any) {
            if (error.response?.status === 400) {
                setError(error.response.data.message || "Error al actualizar la contraseña");
            } else {
                setError("Error del servidor. Inténtalo de nuevo más tarde");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");
        try {
            const updates = {
                ...(userData.email !== "" && { email: userData.email }),
                ...(userData.phone !== "" && { phone: userData.phone }),
                ...(userData.avatar !== "" && { avatar: userData.avatar }),
            };
            const response = await userService.updateUser(id!, updates);
            setSuccess(response.message);
        } catch {
            setError("Error al actualizar perfil");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setError("");
        setSuccess("");
        if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value !== "") {
            setError("Por favor ingresa un email válido");
        }
        if (name === "phone" && !/^[\d\s+-]*$/.test(value)) {
            return;
        }
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
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100 py-10">
            <div className="container mx-auto max-w-4xl px-4">
                <div className="flex justify-between items-center mb-8">
                    <ButtonIndicator />
                    <ButtonHome />
                </div>
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        {/* Sidebar */}
                        <aside className="md:w-1/3 bg-indigo-50 p-8 flex flex-col items-center justify-center border-r">
                            <div className="mb-6">
                                <div className="relative">
                                    <img
                                        src={userData.avatar || "https://via.placeholder.com/120"}
                                        alt="Avatar"
                                        className="h-28 w-28 rounded-full object-cover border-4 border-indigo-300 shadow"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAvatarSelection((prev) => ({
                                                ...prev,
                                                showModal: true,
                                            }))
                                        }
                                        className="absolute bottom-2 right-2 bg-indigo-600 text-white rounded-full p-2 shadow hover:bg-indigo-700 transition"
                                    >
                                        <FiSettings />
                                    </button>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 text-center">
                                    Cambia tu avatar
                                </p>
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-slate-800">{userData.email}</h2>
                                <p className="text-gray-500">{userData.phone || "Sin teléfono"}</p>
                            </div>
                            <nav className="mt-8 w-full">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg mb-2 font-medium transition ${
                                            activeTab === tab.key
                                                ? "bg-indigo-600 text-white shadow"
                                                : "bg-white text-indigo-600 hover:bg-indigo-100"
                                        }`}
                                        onClick={() => setActiveTab(tab.key)}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </aside>
                        {/* Main Content */}
                        <main className="md:w-2/3 p-8">
                            <div className="mb-6 flex items-center gap-2">
                                <FiSettings className="text-indigo-500 text-2xl" />
                                <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
                            </div>
                            {activeTab === "profile" && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
                                    )}
                                    {success && (
                                        <div className="p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>
                                    )}
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-2" htmlFor="email">
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
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-2" htmlFor="phone">
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
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Guardando..." : "Guardar Cambios"}
                                        </button>
                                    </div>
                                </form>
                            )}
                            {activeTab === "password" && (
                                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                    {error && (
                                        <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
                                    )}
                                    {success && (
                                        <div className="p-3 bg-green-100 text-green-700 rounded-lg">
                                            {success}
                                            {redirectCountdown && (
                                                <div className="mt-1 text-sm">
                                                    Redirigiendo en {redirectCountdown} segundo
                                                    {redirectCountdown !== 1 ? "s" : ""}...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-2" htmlFor="currentPassword">
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
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-2" htmlFor="newPassword">
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
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-2" htmlFor="confirmPassword">
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
                                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
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
                        </main>
                    </div>
                </div>
            </div>
            {/* Avatar Modal */}
            {avatarSelection.showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
            )}
        </div>
    );
};

export default UserProfile;
