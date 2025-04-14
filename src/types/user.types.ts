// src/types/user.types.ts
export interface Location {
    type: string;
    coordinates: number[];
    lastUpdated: string;
  }
  
  export interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    fcmToken: string | null;
    isActive: boolean;
    role: string;
    neighborhood: string | null;
    lastLocation: Location;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }
  
  export interface UsersResponse {
    users: User[];
  }