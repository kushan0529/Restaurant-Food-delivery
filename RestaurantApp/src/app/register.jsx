import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/authContext';
import { notify } from '../../src/utils/alert';
import AuthBackground, { AuthInput, AuthButton, authStyles } from '../../src/components/AuthBackground';

export default function Register() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !mobile || !password) return notify('Error', 'Fill in all fields');
    if (mobile.trim().length !== 10) return notify('Error', 'Enter a valid 10-digit mobile number');
    if (password !== confirm) return notify('Error', 'Passwords do not match');

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        mobilenumber: mobile.trim(),
        password,
        role: 'customer', // same as your original; see the note about making the backend ignore this
      });
      await login(res.data.user, res.data.token); // logs the new user straight in, as before
    } catch (err) {
      console.log('Register error:', err.response?.data || err.message);
      notify('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground title="Create account" subtitle="Sign up to order your favourites">
      <AuthInput icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
      <AuthInput icon="call-outline" placeholder="Mobile number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
      <AuthInput icon="lock-closed-outline" secure placeholder="Password" value={password} onChangeText={setPassword} />
      <AuthInput icon="lock-closed-outline" secure placeholder="Confirm password" value={confirm} onChangeText={setConfirm} />
      <AuthButton label="Register" loading={loading} onPress={handleRegister} />

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={authStyles.link}>Already have an account? <Text style={authStyles.linkBold}>Login</Text></Text>
      </TouchableOpacity>
    </AuthBackground>
  );
}