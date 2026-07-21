import api from "./api";

export interface DashboardAlert {
  _id: string;
  reporter?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  status?: string;
  lastLocation?: {
    coordinates?: [number, number];
    updatedAt?: string;
  };
  reportedAt?: string;
}

export interface DashboardLoggedUser {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  phone?: string;
  role?: { name?: string };
  last_login?: string;
}

export interface DashboardLog {
  _id: string;
  user?: { name?: string; email?: string };
  action?: string;
  target?: string;
  metadata?: { mensaje?: string };
  timestamp?: string;
}

export interface DashboardStats {
  totals: {
    alerts: number;
    users: number;
    devices: number;
    cameras: number;
  };
  latestAlerts: DashboardAlert[];
  latestLoggedUsers: DashboardLoggedUser[];
  latestLogs: DashboardLog[];
}

const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>("/api/dashboard/stats");
    return response.data;
  },
};

export default dashboardService;
