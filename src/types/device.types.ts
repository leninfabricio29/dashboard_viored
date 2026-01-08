export type DeviceStatus = "active" | "inactive" | "maintenance" | string;

export interface DeviceUserSummary {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Device {
  _id: string;
  name: string;
  serial: string;
  description?: string;
  qrContent?: string;
  qrImage?: string;
  assignedUser?: DeviceUserSummary | null;
  assignedAt?: string | null;
  status?: DeviceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDevicePayload {
  name: string;
  serial?: string; // opcional: backend lo genera automáticamente
  description?: string;
  userId?: string | null;
}

export interface UpdateDevicePayload {
  name?: string;
  description?: string;
  status?: DeviceStatus;
}
