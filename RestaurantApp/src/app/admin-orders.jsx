import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, RefreshControl, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/authContext';
import { notify, confirmAction } from '../../src/utils/alert';

const STATUSES = ['received', 'preparing', 'ready', 'out for delivery', 'completed', 'cancelled'];
const FILTERS = ['Active', 'All', ...STATUSES];
const isActive = (o) => o.status !== 'completed' && o.status !== 'cancelled';

export default function AdminOrders() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Active');
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/orders'); // admin only
      setOrders(res.data);
    } catch (e) {
      /* keep showing the last data */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // new orders show up on their own: refresh every 15 seconds
  useEffect(() => {
    if (user?.role !== 'admin') return;
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [user, load]);

  if (user?.role !== 'admin') {
    return (
      <View style={s.center}>
        <Text style={s.text}>Admins only</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}><Text style={s.btnText}>Back to Menu</Text></TouchableOpacity>
      </View>
    );
  }
  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#111' }} color="#e8590c" />;

  const changeStatus = (order, status) => {
    if (order.status === status) return;
    const apply = async () => {
      setUpdating(order._id);
      try {
        const res = await api.put(`/orders/${order._id}`, { status });
        setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data : o)));
      } catch (e) {
        notify('Could not update', e.response?.data?.message || 'Please try again.');
      } finally {
        setUpdating(null);
      }
    };
    if (status === 'cancelled') confirmAction('Cancel order', 'Cancel this order?', 'Yes, cancel', apply);
    else apply();
  };

  const visible = orders.filter((o) => (filter === 'All' ? true : filter === 'Active' ? isActive(o) : o.status === filter));
  const newCount = orders.filter((o) => o.status === 'received').length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/admin')}><Text style={s.link}>← Admin</Text></TouchableOpacity>
        <Text style={s.title}>Orders{newCount > 0 ? ` · ${newCount} new` : ''}</Text>
        <View style={{ width: 70 }} />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, flexGrow: 0 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[s.chip, filter === f && s.chipActive]}>
              <Text style={[s.chipText, filter === f && { color: '#fff' }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor="#e8590c" onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={s.text}>No orders here.</Text>}
        renderItem={({ item: o }) => (
          <View style={s.card}>
            <View style={s.rowBetween}>
              <Text style={s.orderId}>#{o._id.slice(-6).toUpperCase()}</Text>
              <Text style={s.sub}>{new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <Text style={s.customer}>{o.customerName}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${o.customerPhone}`)}>
              <Text style={s.phone}>📞 {o.customerPhone}</Text>
            </TouchableOpacity>
            {!!o.deliveryAddress && <Text style={s.sub}>📍 {o.deliveryAddress}</Text>}

            <View style={{ marginTop: 8 }}>
              {o.items.map((it, idx) => (
                <View key={idx} style={s.rowBetween}>
                  <Text style={s.item}>{it.quantity} × {it.name} ({it.variant})</Text>
                  <Text style={s.item}>₹{it.price * it.quantity}</Text>
                </View>
              ))}
            </View>
            <View style={[s.rowBetween, { marginTop: 8 }]}>
              <Text style={s.total}>Total</Text>
              <Text style={s.total}>₹{o.totalAmount}</Text>
            </View>

            <Text style={s.label}>Status {updating === o._id ? '(updating...)' : ''}</Text>
            <View style={s.wrap}>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st}
                  disabled={updating === o._id}
                  onPress={() => changeStatus(o, st)}
                  style={[s.chip, o.status === st && (st === 'cancelled' ? s.chipRed : s.chipActive)]}
                >
                  <Text style={[s.chipText, o.status === st && { color: '#fff' }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  link: { color: '#e8590c', fontSize: 16, fontWeight: '700', width: 70 },
  text: { color: '#fff', textAlign: 'center', marginTop: 20 },
  btn: { backgroundColor: '#e8590c', borderRadius: 10, padding: 14, marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#1c1c1c', borderRadius: 12, padding: 14, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  orderId: { color: '#fff', fontWeight: '800', fontSize: 16 },
  customer: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 6 },
  phone: { color: '#e8590c', marginVertical: 3, fontSize: 14 },
  sub: { color: '#999', fontSize: 12 },
  item: { color: '#ddd', fontSize: 14 },
  total: { color: '#fff', fontWeight: '800', fontSize: 16 },
  label: { color: '#ccc', fontWeight: '600', marginTop: 12, marginBottom: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: '#444', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#e8590c', borderColor: '#e8590c' },
  chipRed: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  chipText: { color: '#ccc', fontSize: 13 },
});