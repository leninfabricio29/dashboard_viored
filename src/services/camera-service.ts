import api from "./api";

const BASE_PATH = "/api/cameras";

export interface CameraChannel {
  channelSeq: number;
  channelName: string;
}

export interface DiscoverDevice {
  sn: string;
  name: string;
  model: string;
  type: "camera" | "recorder";
  channels: CameraChannel[];
}

export interface DiscoverDeviceResponse {
  success: boolean;
  device: DiscoverDevice;
}

export interface OpenCameraResponse {
  success: boolean;
  cameraId: string;
  path: string;
  webrtc: string;
  hls: string;
}

export interface CloseCameraResponse {
  success: boolean;
}

export interface AssignedUserDetail {
  _id: string;
  name: string;
  email?: string;
}

export interface CameraUserAssignment {
  user: AssignedUserDetail | string;
  channels?: number[];
}

export interface Camera {
  _id: string;
  name: string;
  cameraId?: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
  streamUrl?: string;
  status: string;
  assignedUser?: AssignedUserDetail | string | null;
  channels?: number[];
  assignedUsers?: (CameraUserAssignment | AssignedUserDetail | string)[];
  createdAt?: string;
  updatedAt?: string;
}

interface CreateCameraPayload {
  description: string;
  cameraId?: string;
  streamUrl?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
}

const cameraService = {
  getCameras: async (): Promise<Camera[]> => {
    const response = await api.get(BASE_PATH);
    return response.data;
  },

  getCamerasByUser: async (userId: string): Promise<Camera[]> => {
    const response = await api.get(`${BASE_PATH}/user/${userId}`);
    return response.data;
  },

  createCamera: async (data: CreateCameraPayload): Promise<Camera> => {
    const response = await api.post(BASE_PATH, data);
    return response.data;
  },

  discoverDevice: async (cameraId: string): Promise<DiscoverDeviceResponse> => {
    const response = await api.post(`${BASE_PATH}/discover`, { cameraId });
    return response.data;
  },

  openCamera: async (cameraId: string, channelSeq: number = 0): Promise<OpenCameraResponse> => {
    const response = await api.post(`${BASE_PATH}/open`, { cameraId, channelSeq });
    return response.data;
  },

  closeCamera: async (cameraId: string, channelSeq: number = 0): Promise<CloseCameraResponse> => {
    const response = await api.post(`${BASE_PATH}/close`, { cameraId, channelSeq });
    return response.data;
  },

  assignCameraToUser: async (cameraId: string, userId: string, channels?: number[]): Promise<{ message: string; camera: Camera }> => {
    const response = await api.post(`${BASE_PATH}/assign`, { cameraId, userId, channels });
    return response.data;
  },

  unassignCameraFromUser: async (cameraId: string, userId?: string): Promise<{ message: string; camera: Camera }> => {
    const response = await api.post(`${BASE_PATH}/unassign`, { cameraId, userId });
    return response.data;
  },
};

export default cameraService;