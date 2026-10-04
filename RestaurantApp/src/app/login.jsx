import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/authContext';
import { notify } from '../../src/utils/alert';
import AuthBackground, { AuthInput, AuthButton, authStyles } from '../../src/components/AuthBackground';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!mobile || !password) return notify('Error', 'Fill in all fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { mobilenumber: mobile.trim(), password });
      await login(res.data.user, res.data.token);
    } catch (err) {
      notify('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground title="Welcome back" subtitle="Log in to order your favourites">
      <AuthInput
        icon="call-outline"
        placeholder="Mobile number"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <AuthInput
        icon="lock-closed-outline"
        secure
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <AuthButton label="Login" loading={loading} onPress={handleLogin} />

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={authStyles.link}>New here? <Text style={authStyles.linkBold}>Create an account</Text></Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/')}>
        <Text style={authStyles.link}>Continue as guest</Text>
      </TouchableOpacity>
    </AuthBackground>
  );
}