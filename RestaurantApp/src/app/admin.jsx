import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/authContext';

export default function Admin() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.get('/menu/all')
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <View style={s.center}>
        <Text style={s.text}>Admins only</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}><Text style={s.btnText}>Back to Menu</Text></TouchableOpacity>
      </View>
    );
  }
  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#111' }} color="#e8590c" />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/')}><Text style={s.link}>← Menu</Text></TouchableOpacity>
        <Text style={s.title}>Manage Menu</Text>
        <TouchableOpacity onPress={() => router.push('/admin-edit')}><Text style={s.link}>+ Add</Text></TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => router.push('/admin-orders')} style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
        <Text style={s.link}>View Orders →</Text>
      </TouchableOpacity>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={s.text}>No items yet. Tap + Add.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => router.push({ pathname: '/admin-edit', params: { id: item._id } })}>
            {item.image
              ? <Image source={{ uri: item.image }} style={s.thumb} />
              : <View style={[s.thumb, s.noPhoto]}><Text style={{ color: '#777', fontSize: 11 }}>No photo</Text></View>}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.sub}>{item.category}</Text>
              <Text style={s.sub}>{(item.variants || []).map((v) => `${v.label} ₹${v.price}`).join(' · ')}</Text>
            </View>
            {item.isAvailable === false && <Text style={s.hidden}>Hidden</Text>}
          </TouchableOpacity>
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
  link: { color: '#e8590c', fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1c', borderRadius: 12, padding: 10, marginBottom: 10 },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  noPhoto: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sub: { color: '#999', fontSize: 12, marginTop: 2 },
  hidden: { color: '#ff6b6b', fontWeight: '700', fontSize: 12 },
  text: { color: '#fff', textAlign: 'center', marginTop: 20 },
  btn: { backgroundColor: '#e8590c', borderRadius: 10, padding: 14, marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
});