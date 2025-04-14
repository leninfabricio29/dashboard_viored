// src/types/neighborhood.types.ts
export interface Neighborhood {
    _id: string;
    name: string;
    description?: string;
    area?: {
      type: string;
      coordinates: number[][][]; // Array de arrays de arrays de números (coordenadas)
    };
    createdAt: string;
    updatedAt: string;
  }
  
  export interface NeighborhoodStats {
    _id: string;
    name: string;
    userCount: number;
  }