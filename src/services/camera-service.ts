import api from "./api";

const BASE_PATH = "/api/cameras";

export interface Camera {
  _id: string;
  name: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
  streamUrl: string;
  status: string;
  assignedUsers?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface CreateCameraPayload {
  description: string;
  streamUrl: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

const cameraService = {
  getCameras: async (): Promise<Camera[]> => {
    const response = await api.get(BASE_PATH);
    return response.data;
  },

  createCamera: async (data: CreateCameraPayload): Promise<Camera> => {
    const response = await api.post(BASE_PATH, data);
    return response.data;
  },
};

export default cameraService;