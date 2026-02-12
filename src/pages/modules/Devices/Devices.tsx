import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiCpu,
  FiEdit2,
  FiEye,
  FiSearch,
  FiTrash2,
  FiRadio,
} from "react-icons/fi";
import ButtonHome from "../../../components/UI/ButtonHome";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import Modal from "../../../components/layout/Modal";
import DeleteConfirmationModal from "../../../components/layout/DeleteConfirmationModal";
import deviceService from "../../../services/device-service";
import {
  CreateDevicePayload,
  Device,
  DeviceStatus,
  UpdateDevicePayload,
} from "../../../types/device.types";

const DEFAULT_FORM: CreateDevicePayload & { status: DeviceStatus } = {
  name: "",
  serial: "",
  description: "",
  userId: null,
  status: "active",
  type: "",
};

type DeviceType = "siren" | "button";

const Devices = () => {
  const [activeSegment, setActiveSegment] = useState<DeviceType>("siren");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [testingConnectivity, setTestingConnectivity] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deviceService.getDevices();
      setDevices(data);
    } catch (err) {
      console.error("Error al cargar dispositivos", err);
      setError("No se pudieron cargar los dispositivos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = useMemo(() => {
    const term = search.toLowerCase().trim();
    // Filtrar por tipo de dispositivo según el segmento activo
    const devicesByType = devices.filter((device) =>
      activeSegment === "button" ? device.type === "button" : device.type === "siren"
    );

    if (!term) return devicesByType;

    return devicesByType.filter((device) => {
      const assignedName = device.assignedUser?.name?.toLowerCase() || "";
      const neighborhood = device.neighborhood?.name?.toLowerCase() || "";
      return (
        device.name.toLowerCase().includes(term) ||
        device.serial.toLowerCase().includes(term) ||
        (device.status || "").toLowerCase().includes(term) ||
        assignedName.includes(term) ||
        neighborhood.includes(term)
      );
    });
  }, [devices, search, activeSegment]);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const openCreateForm = () => {
    setFormData(DEFAULT_FORM);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditForm = async (id: string) => {
    try {
      setSubmitting(true);
      const device = await deviceService.getDeviceById(id);
      setSelectedDevice(device);
      setFormData({
        name: device.name,
        serial: device.serial,
        description: device.description || "",
        userId: device.assignedUser?._id || null,
        status: device.status || "active",
        type: device.type,
      });
      setFormMode("edit");
      setFormOpen(true);
    } catch (err) {
      console.error("Error al cargar dispositivo", err);
      setError("No se pudo cargar el dispositivo seleccionado");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const device = await deviceService.getDeviceById(id);
      setSelectedDevice(device);
      setDetailOpen(true);
    } catch (err) {
      console.error("Error al obtener detalle", err);
      setError("No se pudo obtener el detalle del dispositivo");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (formMode === "create") {
        const created = await deviceService.createDevice({
          name: formData.name,
          type: activeSegment,
        });
        console.log("Se creara un dispositivo de typo:", activeSegment);
        console.log("Dispositivo creado:", created);
        setDevices((prev) => [created, ...prev]);
      } else if (selectedDevice?._id) {
        const payload: UpdateDevicePayload = {
          name: formData.name,
          description: formData.description,
          status: formData.status,
        };
        const updated = await deviceService.updateDevice(
          selectedDevice._id,
          payload
        );
        setDevices((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        setSelectedDevice(updated);
      }
      setFormOpen(false);
      setFormData(DEFAULT_FORM);
    } catch (err) {
      console.error("Error al guardar dispositivo", err);
      setError("No se pudo guardar el dispositivo. Verifica los datos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice?._id) return;
    try {
      setSubmitting(true);
      await deviceService.deleteDevice(selectedDevice._id);
      setDevices((prev) =>
        prev.filter((item) => item._id !== selectedDevice._id)
      );
      setDeleteOpen(false);
      setSelectedDevice(null);
    } catch (err) {
      console.error("Error al eliminar dispositivo", err);
      setError("No se pudo eliminar el dispositivo");
    } finally {
      setSubmitting(false);
    }
  };

  const testConnectivity = async (deviceId: string) => {
    try {
      setTestingConnectivity(deviceId);
      // Aquí implementarías la lógica real de prueba de conectividad
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Simulación: podrías hacer una petición al backend
      // await deviceService.testConnectivity(deviceId);
      alert("Conectividad exitosa");
    } catch (err) {
      console.error("Error al probar conectividad", err);
      alert("Error al probar conectividad");
    } finally {
      setTestingConnectivity(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <ButtonIndicator />
            <div className="mt-12">
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FiCpu className="text-blue-600" />
              Dispositivos
            </h1>
            <p className="text-slate-600 mt-1">
              Administra sirenas y botones físicos del sistema
            </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ButtonHome
            />
            
          </div>
        </div>

        {/* Segmented Control */}
        <div className="bg-white mt-4 rounded-xl shadow-sm p-1 inline-flex gap-1">
          <button
            onClick={() => setActiveSegment("siren")}
            className={`px-6 py-2.5 rounded-lg cursor-pointerfont-medium transition-all ${
              activeSegment === "siren"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FiRadio className="inline mr-2" />
            Sirenas
          </button>
          <button
            onClick={() => setActiveSegment("button")}
            className={`px-6 py-2.5 rounded-lg cursor-pointer font-medium transition-all ${
              activeSegment === "button"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FiCpu className="inline mr-2" />
            Botones Físicos
          </button>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${activeSegment === "siren" ? "sirenas" : "botones"} por nombre, serial o barrio`}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={openCreateForm}
            className=" cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            <span className="text-lg font-bold">+</span>
            {activeSegment === "siren" ? "Crear sirena" : "Crear botón físico"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          
          </div>
          
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredDevices.length === 0 ? (
              <div className="text-center py-16">
                <FiCpu className="mx-auto text-6xl text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">
                  No hay {activeSegment === "siren" ? "sirenas" : "botones físicos"} para mostrar.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Serial
                    </th>
                    {activeSegment === "siren" ? (
                      <>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Barrio
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Activaciones
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Última activación
                        </th>
                      </>
                    ) : (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Asignado a
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDevices.map((device) => (
                    <tr
                      key={device._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {device.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {device._id}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-mono text-sm">
                        {device.serial}
                      </td>
                      {activeSegment === "siren" ? (
                        <>
                          <td className="px-6 py-4 text-slate-700">
                            {device.neighborhood?.name || "Sin asignar"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {device.activationCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {formatDate(device.lastActivation)}
                          </td>
                        </>
                      ) : (
                        <td className="px-6 py-4 text-slate-700">
                          {device.assignedUser
                            ? device.assignedUser.name
                            : "Sin asignar"}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            device.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {device.status || "activo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {formatDate(device.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {activeSegment === "siren" && (
                            <button
                              onClick={() => testConnectivity(device._id)}
                              disabled={testingConnectivity === device._id}
                              className="p-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Probar conectividad"
                            >
                              {testingConnectivity === device._id ? (
                                <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiRadio />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openDetail(device._id)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Ver detalle"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => openEditForm(device._id)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Editar"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDevice(device);
                              setDeleteOpen(true);
                            }}
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Eliminar"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <Modal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          title={
            formMode === "create"
              ? `Nueva ${activeSegment === "siren" ? "sirena" : "botón físico"}`
              : `Editar ${activeSegment === "siren" ? "sirena" : "botón físico"}`
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {formMode === "create" && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                Al crear el dispositivo, el número de serie y la imagen QR se
                generarán automáticamente.
              </div>
            )}

            {formMode === "edit" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Serial
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedDevice?.serial || ""}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Información adicional del dispositivo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as DeviceStatus,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>

                  {activeSegment === "button" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Usuario asignado (opcional)
                      </label>
                      <input
                        type="text"
                        value={formData.userId ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userId: e.target.value || null,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ID de usuario para asignación inicial"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2"
              >
                {submitting && (
                  <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                )}
                {formMode === "create" ? "Crear" : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title="Detalle del dispositivo"
        >
          {detailLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
            </div>
          ) : selectedDevice ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500">Nombre</p>
                  <p className="text-base font-semibold text-slate-800">
                    {selectedDevice.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Serial</p>
                  <p className="text-base font-semibold text-slate-800">
                    {selectedDevice.serial}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Estado</p>
                  <p className="text-base font-semibold text-slate-800">
                    {selectedDevice.status || "activo"}
                  </p>
                </div>
                {activeSegment === "siren" ? (
                  <>
                    <div>
                      <p className="text-xs uppercase text-slate-500">Barrio</p>
                      <p className="text-base font-semibold text-slate-800">
                        {selectedDevice.neighborhood?.name || "Sin asignar"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-500">
                        Total de activaciones
                      </p>
                      <p className="text-base font-semibold text-slate-800">
                        {selectedDevice.activationCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-500">
                        Última activación
                      </p>
                      <p className="text-base font-semibold text-slate-800">
                        {formatDate(selectedDevice.lastActivation)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-xs uppercase text-slate-500">
                      Asignado a
                    </p>
                    <p className="text-base font-semibold text-slate-800">
                      {selectedDevice.assignedUser
                        ? selectedDevice.assignedUser.name
                        : "Sin asignar"}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs uppercase text-slate-500">Descripción</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {selectedDevice.description || "Sin descripción"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500">
                    QR payload
                  </p>
                  <code className="block bg-slate-100 text-slate-700 rounded-lg p-3 text-xs break-all">
                    {selectedDevice.qrContent}
                  </code>
                </div>
                {selectedDevice.qrImage && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs uppercase text-slate-500">
                      QR generado
                    </p>
                    <img
                      src={selectedDevice.qrImage}
                      alt="QR del dispositivo"
                      className="w-44 h-44 rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                <div>Creado: {formatDate(selectedDevice.createdAt)}</div>
                <div>
                  Actualizado: {formatDate(selectedDevice.updatedAt)}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No hay datos para mostrar.
            </p>
          )}
        </Modal>

        <DeleteConfirmationModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          userName={selectedDevice?.name || ""}
          entityType={activeSegment === "siren" ? "sirena" : "botón físico"}
        />
      </div>
    </div>
  );
};

export default Devices;