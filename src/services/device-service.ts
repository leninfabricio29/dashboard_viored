import api from "./api";
import {
  CreateDevicePayload,
  Device,
  UpdateDevicePayload,
} from "../types/device.types";

const BASE_PATH = "/api/devices";

const deviceService = {
  getDevices: async (): Promise<Device[]> => {
    const response = await api.get<Device[]>(BASE_PATH);
    return response.data;
  },
  getDeviceById: async (id: string): Promise<Device> => {
    const response = await api.get<Device>(`${BASE_PATH}/${id}`);
    return response.data;
  },
  createDevice: async (data: CreateDevicePayload): Promise<Device> => {
    // En creación, si el backend genera serial/qr, basta enviar name
    const payload: Partial<CreateDevicePayload> = { name: data.name, type: data.type };
    const response = await api.post<Device>(BASE_PATH, payload);
    return response.data;
  },
  updateDevice: async (
    id: string,
    data: UpdateDevicePayload,
  ): Promise<Device> => {
    const response = await api.patch<Device>(`${BASE_PATH}/${id}`, data);
    return response.data;
  },
  deleteDevice: async (id: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};

export default deviceService;
