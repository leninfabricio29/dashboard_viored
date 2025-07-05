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
    ci: string;
    last_login: string;
    phone: string;
    fcmToken: string | null;
    isActive: boolean;
    role: string;
    neighborhood: string | null;
    lastLocation: Location;
    createdAt: string;
    updatedAt: string;
    type_suscription: string;
    avatar: string,
    __v: number;
  }

  export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    ci?: string;
  }

  export interface UserView {
  id: string;
  ci: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  last_login?: string;
  createdAt?: string;
}


  export interface UsersResponse {
    users: User[];
  }