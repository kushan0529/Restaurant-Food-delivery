import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/axios';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/authContext';

export default function Menu() {
  const router = useRouter();
  const { addItem, count } = useCart();
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState({}); // { [itemId]: variantLabel }

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/menu'); // public: no login needed
      setItems(res.data);
    } catch (e) {
      setError('Could not load the menu. Check your connection.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => ['All', ...new Set(items.map((i) => i.category))], [items]);
  const visible = category === 'All' ? items : items.filter((i) => i.category === category);

  const handleAdd = (item) => {
    if (!user) {
      // guests can browse, but need to log in to add to cart
      return router.push('/login');
    }
    const label = selected[item._id] || item.variants[0].label;
    const variant = item.variants.find((v) => v.label === label);
    addItem(item, variant);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#111' }} color="#e8590c" />;
  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.text}>{error}</Text>
        <TouchableOpacity style={s.btn} onPress={load}><Text style={s.btnText}>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>The Grill and Barbeque</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={() => router.push('/cart')}>
            <Text style={s.cart}>Cart ({count})</Text>
          </TouchableOpacity>
          {user ? (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Text style={s.auth}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={logout}>
                <Text style={[s.auth, { marginLeft: 14 }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={s.auth}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs}>
        {categories.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.chip, category === c && s.chipActive]}>
            <Text style={[s.chipText, category === c && { color: '#fff' }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={visible}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const label = selected[item._id] || item.variants[0].label;
          const price = item.variants.find((v) => v.label === label)?.price;
          return (
            <View style={s.card}>
              <Text style={s.name}>{item.name}</Text>
              {!!item.description && <Text style={s.desc}>{item.description}</Text>}
              {item.variants.length > 1 && (
                <View style={s.row}>
                  {item.variants.map((v) => (
                    <TouchableOpacity
                      key={v.label}
                      onPress={() => setSelected((p) => ({ ...p, [item._id]: v.label }))}
                      style={[s.chip, label === v.label && s.chipActive]}
                    >
                      <Text style={[s.chipText, label === v.label && { color: '#fff' }]}>{v.label} ₹{v.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={[s.row, { justifyContent: 'space-between', marginTop: 10 }]}>
                <Text style={s.price}>₹{price}</Text>
                <TouchableOpacity style={s.btn} onPress={() => handleAdd(item)}>
                  <Text style={s.btnText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  cart: { color: '#e8590c', fontSize: 16, fontWeight: '700' },
  auth: { color: '#999', marginTop: 4 },
  tabs: { flexGrow: 0, paddingHorizontal: 12 },
  chip: { borderWidth: 1, borderColor: '#444', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginTop: 6 },
  chipActive: { backgroundColor: '#e8590c', borderColor: '#e8590c' },
  chipText: { color: '#ccc', fontSize: 13 },
  card: { backgroundColor: '#1c1c1c', borderRadius: 12, padding: 14, marginBottom: 12 },
  name: { color: '#fff', fontSize: 17, fontWeight: '700' },
  desc: { color: '#999', marginTop: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  price: { color: '#fff', fontSize: 18, fontWeight: '700' },
  btn: { backgroundColor: '#e8590c', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
  text: { color: '#fff', marginBottom: 12 },
});