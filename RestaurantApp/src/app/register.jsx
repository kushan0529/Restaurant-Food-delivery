import { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/axios';
import { useAuth } from '../context/authContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', mobile: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const handleRegister = async () => {
    if (!form.name || !form.mobile || !form.password) return Alert.alert('Error', 'Fill in all fields');
    if (form.mobile.length !== 10) return Alert.alert('Error', 'Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      await login(res.data.user, res.data.token);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Full Name" onChangeText={(v) => handleChange('name', v)} />
      <TextInput
        style={styles.input}
        placeholder="Mobile number"
        keyboardType="phone-pad"
        maxLength={10}
        onChangeText={(v) => handleChange('mobile', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={(v) => handleChange('password', v)}
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  button: { backgroundColor: '#e63946', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#e63946', marginTop: 16, textAlign: 'center' },
});