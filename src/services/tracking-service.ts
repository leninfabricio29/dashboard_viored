import api from "./api";

const BASE_PATH = "/api/tracking";

export interface GpsDevice { _id: string; imei: string; model?: string; lastConnection?: string; active?: boolean }
export interface Vehicle { _id: string; plate: string; alias?: string; brand?: string; model?: string; year?: number; color?: string; active: boolean; gpsDevice?: GpsDevice | null }
export interface CreateVehicleInput {
  userId: string;
  plate: string;
  alias?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
}
export interface Position { _id: string; vehicle: string; latitude: number; longitude: number; speed: number; heading?: number; altitude?: number; ignition: boolean; gpsTime: string }
export interface Trip { _id: string; vehicle: string; startTime: string; endTime?: string | null; startLocation?: Coordinates; endLocation?: Coordinates; distance: number; duration: number; averageSpeed: number; maxSpeed: number; stopTime: number; status: "running" | "finished" }
export interface Stop { _id: string; trip: string; vehicle: string; latitude: number; longitude: number; arrivalTime: string; departureTime?: string | null; duration: number }
export interface Coordinates { latitude: number; longitude: number }
export interface TrackingReport { vehicle: Pick<Vehicle, "_id" | "plate" | "alias">; period: { from: string; to: string }; summary: { trips: number; stops: number; distanceMeters: number; drivingSeconds: number; stopSeconds: number; averageSpeed: number }; trips: Trip[]; stops: Stop[] }

const trackingService = {
  async getVehicles(active?: boolean) {
    const response = await api.get<{ vehicles: Vehicle[] }>(`${BASE_PATH}/vehicles`, { params: active === undefined ? undefined : { active } });
    return response.data.vehicles;
  },
  async createVehicle(data: CreateVehicleInput) {
    const response = await api.post<{ vehicle: Vehicle }>(`${BASE_PATH}/vehicles`, data);
    return response.data.vehicle;
  },
  async getLatestPosition(vehicleId: string) {
    const response = await api.get<{ tracking: Position | null }>(`${BASE_PATH}/vehicles/${vehicleId}/latest-position`);
    return response.data.tracking;
  },
  async getPositions(vehicleId: string, from?: string, to?: string) {
    const response = await api.get<{ positions: Position[] }>(`${BASE_PATH}/vehicles/${vehicleId}/positions`, { params: { from, to, limit: 5000 } });
    return response.data.positions;
  },
  async getReport(vehicleId: string, from: string, to: string) {
    const response = await api.get<TrackingReport>(`${BASE_PATH}/vehicles/${vehicleId}/report`, { params: { from, to } });
    return response.data;
  },
};

export default trackingService;
