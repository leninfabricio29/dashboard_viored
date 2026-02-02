// src/services/api.ts
import axios from 'axios';

// Creamos una instancia de axios con la URL base
const api = axios.create({
  baseURL: "http://localhost:3000",
  //baseURL: 'https://apipanic.viryx.net',
  //baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token de autenticación si es necesario
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Asegura objeto headers en todas las variantes de Axios v1
      if (!config.headers) config.headers = {} as any;

      // Para AxiosHeaders (v1) y objetos simples
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        // Objeto plano
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;