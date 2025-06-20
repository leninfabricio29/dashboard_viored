// src/services/api.ts
import axios from 'axios';

// Creamos una instancia de axios con la URL base
const api = axios.create({
  baseURL: 'https://backend-panic.softkilla.es',
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
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;