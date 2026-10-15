import { useEffect } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '../context/authContext';
import { CartProvider } from '../context/CartContext';

function openFromNotification(response, router) {
  const data = response?.notification?.request?.content?.data;
  if (data?.type === 'new_order') router.push('/admin-orders');
  else if (data?.type === 'status_update') router.push('/orders');
}

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

  // Notification taps (not available on the website)
  useEffect(() => {
    if (Platform.OS === 'web' || loading) return;

    // App was fully closed and opened by tapping a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openFromNotification(response, router);
    });

    // App is open or in the background and a notification is tapped
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response, router);
    });

    return () => sub.remove();
  }, [loading]);

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