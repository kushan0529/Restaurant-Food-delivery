import axios from 'axios';

const api = axios.create({
  baseURL: 'http://172.16.87.120:5001/api/', // your backend URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;