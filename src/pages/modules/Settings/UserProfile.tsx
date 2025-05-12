import { useState, useRef } from "react";
import ButtonHome from "../../../components/UI/ButtonHome";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import { FiSettings } from "react-icons/fi";

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("password");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    // Aquí iría la lógica para cambiar la contraseña
    console.log("Contraseña cambiada:", passwordData);
    alert("Contraseña cambiada con éxito");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleAvatarSubmit = (e) => {
    e.preventDefault();
    if (!avatar) {
      alert("Por favor selecciona un archivo");
      return;
    }
    // Aquí iría la lógica para subir el avatar
    console.log("Avatar subido:", avatar);
    alert("Avatar actualizado con éxito");
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

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
              activeTab === "password"
                ? "text-white border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("password")}
          >
            Contraseña
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === "avatar"
                ? "text-white border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("avatar")}
          >
            Avatar
          </button>
        </div>

        <div className="p-8">
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="currentPassword"
                >
                  Contraseña actual
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="currentPassword"
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="newPassword"
                >
                  Nueva contraseña
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-slate-700 text-sm font-bold mb-2"
                  htmlFor="confirmPassword"
                >
                  Confirmar nueva contraseña
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
                >
                  Cambiar contraseña
                </button>
              </div>
            </form>
          )}

          {activeTab === "avatar" && (
            <form onSubmit={handleAvatarSubmit}>
              <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 overflow-hidden">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200 mb-4"
                >
                  Seleccionar imagen
                </button>
                <p className="text-sm text-gray-500">
                  Formatos soportados: JPG, PNG, GIF
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
                  disabled={!avatar}
                >
                  Actualizar avatar
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
