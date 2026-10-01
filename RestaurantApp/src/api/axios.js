import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://10.148.204.120:5001/api/'//'http://172.16.87.120:5001/api/', // your backend URL
});

api.interceptors.request.use(async(config) => {
  const token =await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;