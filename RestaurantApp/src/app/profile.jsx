import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/authContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.name}</Text>
      <Text style={styles.subtitle}>Mobile: {user?.mobilenumber}</Text>
      <Text style={styles.subtitle}>Role: {user?.role}</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>Back to Menu</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#444', marginTop: 12 }]} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
  button: { backgroundColor: '#e63946', padding: 14, borderRadius: 8, paddingHorizontal: 32, marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});