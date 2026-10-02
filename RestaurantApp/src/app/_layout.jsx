import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/authContext';
import { CartProvider } from '../context/CartContext';

function Guard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthScreens = segments[0] === 'login' || segments[0] === 'register';
    // Guests can browse the menu freely (no redirect to /login).
    // Login is only required when adding to cart / placing an order,
    // and those screens check it themselves.
    // Once logged in, leave the login/register screens and go to the menu (home).
    if (user && inAuthScreens) router.replace('/');
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Guard />
      </CartProvider>
    </AuthProvider>
  );
}