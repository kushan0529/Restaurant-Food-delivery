import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/authContext';

const STEPS = ['received', 'preparing', 'ready', 'out for delivery', 'completed'];
const SHORT = { received: 'Received', preparing: 'Preparing', ready: 'Ready', 'out for delivery': 'On the way', completed: 'Delivered' };

function Tracker({ status }) {
  if (status === 'cancelled') {
    return <View style={s.cancelled}><Text style={s.cancelledText}>This order was cancelled</Text></View>;
  }
  const current = STEPS.indexOf(status);
  return (
    <View style={{ flexDirection: 'row', marginTop: 14 }}>
      {STEPS.map((step, i) => (
        <View key={step} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <View style={[s.line, i === 0 && { opacity: 0 }, i <= current && s.lineOn]} />
            <View style={[s.dot, i <= current && s.dotOn]} />
            <View style={[s.line, i === STEPS.length - 1 && { opacity: 0 }, i < current && s.lineOn]} />
          </View>
          <Text style={[s.stepText, i <= current && { color: '#fff' }]}>{SHORT[step]}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Orders() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (silent) => {
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data);
      setError('');
    } catch (e) {
      if (!silent) setError('Could not load your orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // load once, then refresh every 15 seconds so the status stays up to date
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    const timer = setInterval(() => load(true), 15000);
    return () => clearInterval(timer);
  }, [user, load]);

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.text}>Log in to see your orders</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.push('/login')}><Text style={s.btnText}>Login</Text></TouchableOpacity>
      </View>
    );
  }
  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#111' }} color="#e8590c" />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/')}><Text style={s.link}>← Menu</Text></TouchableOpacity>
        <Text style={s.title}>My Orders</Text>
        <View style={{ width: 60 }} />
      </View>
      {!!error && <Text style={[s.text, { color: '#ff6b6b' }]}>{error}</Text>}
      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor="#e8590c" onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={s.text}>You have not placed any orders yet.</Text>}
        renderItem={({ item: o }) => (
          <View style={s.card}>
            <View style={s.rowBetween}>
              <Text style={s.orderId}>#{o._id.slice(-6).toUpperCase()}</Text>
              <Text style={s.sub}>{new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {o.items.map((it, idx) => (
              <View key={idx} style={s.rowBetween}>
                <Text style={s.item}>{it.quantity} × {it.name} ({it.variant})</Text>
                <Text style={s.item}>₹{it.price * it.quantity}</Text>
              </View>
            ))}
            <View style={[s.rowBetween, { marginTop: 8 }]}>
              <Text style={s.total}>Total</Text>
              <Text style={s.total}>₹{o.totalAmount}</Text>
            </View>
            {!!o.deliveryAddress && <Text style={[s.sub, { marginTop: 6 }]}>Deliver to: {o.deliveryAddress}</Text>}
            <Tracker status={o.status} />
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  link: { color: '#e8590c', fontSize: 16, fontWeight: '700', width: 60 },
  text: { color: '#fff', textAlign: 'center', marginTop: 20 },
  btn: { backgroundColor: '#e8590c', borderRadius: 10, padding: 14, marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#1c1c1c', borderRadius: 12, padding: 14, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  orderId: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sub: { color: '#999', fontSize: 12 },
  item: { color: '#ddd', fontSize: 14 },
  total: { color: '#fff', fontWeight: '800', fontSize: 16 },
  line: { flex: 1, height: 3, backgroundColor: '#333' },
  lineOn: { backgroundColor: '#e8590c' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#333' },
  dotOn: { backgroundColor: '#e8590c' },
  stepText: { color: '#777', fontSize: 10, marginTop: 6, textAlign: 'center' },
  cancelled: { backgroundColor: '#3a1c1c', borderRadius: 8, padding: 10, marginTop: 12 },
  cancelledText: { color: '#ff6b6b', textAlign: 'center', fontWeight: '700' },
});