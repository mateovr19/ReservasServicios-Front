import axios from 'axios';

const api = axios.create({
  baseURL: 'https://reservas-backend-prod.happypond-328540f7.eastus.azurecontainerapps.io',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
