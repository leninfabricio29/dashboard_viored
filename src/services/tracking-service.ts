import api from "./api";

const BASE_PATH = "/api/tracking";

export interface GpsDevice {
  _id: string;
  imei: string;
  serialNumber?: string;
  provider?: string;
  model?: string;
  lastCommunication?: string;
  active?: boolean;
}

export interface UserRef {
  _id: string;
  name?: string;
  email?: string;
}

export interface Vehicle {
  _id: string;
  user?: string | UserRef | null;
  plate: string;
  alias?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  active: boolean;
  gpsDevice?: GpsDevice | null;
}

export interface CreateVehicleInput {
  userId: string;
  plate: string;
  alias?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
}

export interface TrackingPosition {
  _id: string;
  vehicle: string;
  device?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  altitude?: number;
  ignition: boolean;
  calculatedSpeed?: number;
  distanceFromPrevious?: number;
  timestamp: string;
  receivedAt?: string;
  valid?: boolean;
}

export type TrackingStatus = "MOVING" | "STOPPED" | "OFFLINE";

export interface TrackingState {
  vehicle: Vehicle | string;
  device?: GpsDevice | string | null;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  altitude?: number;
  ignition: boolean;
  status: TrackingStatus;
  lastPositionAt?: string | null;
  lastCommunicationAt?: string | null;
  address?: string;
}

export interface VehicleStateItem {
  vehicle: Vehicle;
  device?: GpsDevice | null;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  altitude?: number;
  ignition: boolean;
  status: TrackingStatus;
  lastPositionAt?: string | null;
  lastCommunicationAt?: string | null;
}

export type EventType =
  | "STOP_STARTED"
  | "STOP_ENDED"
  | "SPEEDING"
  | "IGNITION_ON"
  | "IGNITION_OFF"
  | "GPS_LOST"
  | "GPS_RESTORED"
  | "GEOFENCE_ENTER"
  | "GEOFENCE_EXIT"
  | "HARSH_ACCELERATION"
  | "HARSH_BRAKING";

export interface TrackingEvent {
  _id: string;
  vehicle: string;
  device?: string;
  type: EventType;
  startedAt: string;
  endedAt?: string | null;
  latitude?: number;
  longitude?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface RouteResponse {
  points: TrackingPosition[];
  distance: number;
  distanceKm: number;
  duration: number;
  averageSpeed: number;
  maxSpeed: number;
  stops: TrackingEvent[];
  events: TrackingEvent[];
}

export interface PeriodSummary {
  distanceTotal: number;
  distanceKm: number;
  durationTotal: number;
  averageSpeed: number;
  maxSpeed: number;
  stops: number;
  prolongedStops: number;
  speedingEvents: number;
  ignitionOn: number;
  ignitionOff: number;
}

export interface TrackingReport {
  vehicle: {
    _id: string;
    plate: string;
    alias?: string;
    brand?: string;
    model?: string;
    color?: string;
  };
  period: { from: string; to: string };
  summary: {
    distanceTotal: number;
    distanceKm: number;
    durationTotal: number;
    averageSpeed: number;
    maxSpeed: number;
    stopsCount: number;
    eventsCount: number;
  };
  positions: TrackingPosition[];
  events: TrackingEvent[];
  stops: TrackingEvent[];
}

const trackingService = {
  async getVehicles(active?: boolean) {
    const response = await api.get<{ success: boolean; data: Vehicle[] }>(`${BASE_PATH}/vehicles`, {
      params: active === undefined ? undefined : { active },
    });
    return response.data.data;
  },

  async createVehicle(data: CreateVehicleInput) {
    const response = await api.post<{ success: boolean; data: Vehicle }>(`${BASE_PATH}/vehicles`, data);
    return response.data.data;
  },

  async getAllVehiclesState(status?: string) {
    const response = await api.get<{ success: boolean; data: VehicleStateItem[] }>(`${BASE_PATH}/vehicles/state`, {
      params: { status },
    });
    return response.data.data;
  },

  async getVehicleState(vehicleId: string) {
    const response = await api.get<{ success: boolean; data: TrackingState }>(
      `${BASE_PATH}/vehicles/${vehicleId}/state`
    );
    return response.data.data;
  },

  async getLatestPosition(vehicleId: string) {
    const state = await this.getVehicleState(vehicleId);
    if (!state) return null;
    return {
      _id: vehicleId,
      vehicle: vehicleId,
      latitude: state.latitude,
      longitude: state.longitude,
      speed: state.speed,
      heading: state.heading || 0,
      altitude: state.altitude || 0,
      ignition: state.ignition,
      timestamp: state.lastPositionAt || new Date().toISOString(),
    } as TrackingPosition;
  },

  async getHistory(vehicleId: string, from?: string, to?: string) {
    const response = await api.get<{ success: boolean; data: TrackingPosition[] }>(
      `${BASE_PATH}/vehicles/${vehicleId}/history`,
      { params: { from, to, limit: 5000 } }
    );
    return response.data.data;
  },

  async getPositions(vehicleId: string, from?: string, to?: string) {
    return this.getHistory(vehicleId, from, to);
  },

  async getRoute(vehicleId: string, from: string, to: string) {
    const response = await api.get<{ success: boolean; data: RouteResponse }>(
      `${BASE_PATH}/vehicles/${vehicleId}/route`,
      { params: { from, to } }
    );
    return response.data.data;
  },

  async getEvents(vehicleId: string, from?: string, to?: string, type?: string) {
    const response = await api.get<{ success: boolean; data: TrackingEvent[] }>(
      `${BASE_PATH}/vehicles/${vehicleId}/events`,
      { params: { from, to, type } }
    );
    return response.data.data;
  },

  async getStops(vehicleId: string, from?: string, to?: string, minDuration?: number) {
    const response = await api.get<{ success: boolean; data: TrackingEvent[] }>(
      `${BASE_PATH}/vehicles/${vehicleId}/stops`,
      { params: { from, to, minDuration } }
    );
    return response.data.data;
  },

  async getSummary(vehicleId: string, from?: string, to?: string) {
    const response = await api.get<{ success: boolean; data: PeriodSummary }>(
      `${BASE_PATH}/vehicles/${vehicleId}/summary`,
      { params: { from, to } }
    );
    return response.data.data;
  },

  async getReport(vehicleId: string, from: string, to: string) {
    const response = await api.get<TrackingReport>(`${BASE_PATH}/vehicles/${vehicleId}/report`, {
      params: { from, to },
    });
    return response.data;
  },

  async sendCoordinates(data: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    ignition?: boolean;
    gpsTime?: string;
  }) {
    const response = await api.post(`${BASE_PATH}/send-coordinates`, data);
    return response.data;
  },
};

export default trackingService;
