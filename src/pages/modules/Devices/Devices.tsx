import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiCpu,
  FiEdit2,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
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

const DEFAULT_FORM: (CreateDevicePayload & { status: DeviceStatus }) = {
  name: "",
  serial: "",
  description: "",
  userId: null,
  status: "active",
};

const Devices = () => {
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
    if (!term) return devices;

    return devices.filter((device) => {
      const assignedName = device.assignedUser?.name?.toLowerCase() || "";
      return (
        device.name.toLowerCase().includes(term) ||
        device.serial.toLowerCase().includes(term) ||
        (device.status || "").toLowerCase().includes(term) ||
        assignedName.includes(term)
      );
    });
  }, [devices, search]);

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
        // Solo enviamos el nombre; serial/QR se generan automáticamente en backend
        const created = await deviceService.createDevice({ name: formData.name });
        setDevices((prev) => [created, ...prev]);
      } else if (selectedDevice?._id) {
        const payload: UpdateDevicePayload = {
          name: formData.name,
          description: formData.description,
          status: formData.status,
        };
        const updated = await deviceService.updateDevice(selectedDevice._id, payload);
        setDevices((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item)),
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
      setDevices((prev) => prev.filter((item) => item._id !== selectedDevice._id));
      setDeleteOpen(false);
      setSelectedDevice(null);
    } catch (err) {
      console.error("Error al eliminar dispositivo", err);
      setError("No se pudo eliminar el dispositivo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Botones Físicos</h1>
          <p className="text-slate-500 text-sm">
            Administra los dispositivos físicos: crear, editar, consultar y eliminar.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDevices}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            disabled={loading}
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </button>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
          >
            <FiPlus className="h-4 w-4" />
            Nuevo dispositivo
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, serial o estado"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-sm rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Serial</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Asignado a</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Creado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">
                    No hay dispositivos para mostrar.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <FiCpu />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{device.name}</div>
                          <div className="text-xs text-slate-500">ID: {device._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{device.serial}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {device.assignedUser ? device.assignedUser.name : "Sin asignar"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          device.status === "inactive"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {device.status || "activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(device.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDetail(device._id)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="Ver detalle"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditForm(device._id)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="Editar"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDevice(device);
                            setDeleteOpen(true);
                          }}
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Eliminar"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Nuevo dispositivo" : "Editar dispositivo"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Nombre (siempre visible) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Aviso en modo creación */}
          {formMode === "create" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm px-3 py-2">
              Al crear el dispositivo, el número de serie y la imagen QR se generarán automáticamente.
            </div>
          )}

          {/* Campos solo en edición */}
          {formMode === "edit" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial</label>
                  <input
                    type="text"
                    value={formData.serial}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Información adicional del dispositivo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Usuario asignado (opcional)</label>
                  <input
                    type="text"
                    value={formData.userId ?? ""}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ID de usuario para asignación inicial"
                  />
                </div>
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
              {submitting && <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
              {formMode === "create" ? "Crear" : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle del dispositivo">
        {detailLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : selectedDevice ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Nombre</p>
                <p className="text-base font-semibold text-slate-800">{selectedDevice.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Serial</p>
                <p className="text-base font-semibold text-slate-800">{selectedDevice.serial}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Estado</p>
                <p className="text-base font-semibold text-slate-800">{selectedDevice.status || "activo"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Asignado a</p>
                <p className="text-base font-semibold text-slate-800">
                  {selectedDevice.assignedUser ? selectedDevice.assignedUser.name : "Sin asignar"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-slate-500">Descripción</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {selectedDevice.description || "Sin descripción"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-slate-500">QR payload</p>
                <code className="block bg-slate-100 text-slate-700 rounded-lg p-3 text-xs break-all">
                  {selectedDevice.qrContent}
                </code>
              </div>
              {selectedDevice.qrImage && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs uppercase text-slate-500">QR generado</p>
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
              <div>Actualizado: {formatDate(selectedDevice.updatedAt)}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No hay datos para mostrar.</p>
        )}
      </Modal>

      <DeleteConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        userName={selectedDevice?.name || ""}
        entityType="dispositivo"
      />
    </div>
  );
};

export default Devices;
