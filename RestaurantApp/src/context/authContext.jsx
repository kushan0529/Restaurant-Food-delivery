import { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPush } from '../utils/registerForPush';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        registerForPush(api); // already logged in -> make sure this phone is registered
      }
      setLoading(false);
    })();
  }, []);

  const login = async (userData, token) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    registerForPush(api);
  };

  const logout = async () => {
    // detach this phone from the account before the token is removed
    try {
      const pushToken = await AsyncStorage.getItem('pushToken');
      if (pushToken) {
        await api.delete('/auth/push-token', { data: { token: pushToken } });
        await AsyncStorage.removeItem('pushToken');
      }
    } catch (e) {}
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);