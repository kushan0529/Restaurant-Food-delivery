import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/axios';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/authContext';
import { notify, confirmAction } from '../../src/utils/alert';

export default function Cart() {
  const router = useRouter();
  const { items, changeQty, clearCart, total } = useCart();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(user?.mobilenumber || '');
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    if (!user) return router.push('/login');
    if (!name.trim() || !phone.trim() || !address.trim()) {
      return notify('Missing details', 'Please fill in name, phone and address.');
    }
    setPlacing(true);
    try {
      await api.post('/orders', {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        deliveryAddress: address.trim(),
        // only ids, size and quantity are sent; the server sets the prices
        items: items.map((i) => ({ menuItemId: i.menuItemId, variant: i.variant, quantity: i.quantity })),
      });
      clearCart();
      notify('Order placed', 'Thank you! You can track it here.');
      router.replace('/orders');
    } catch (e) {
      notify('Could not place order', e.response?.data?.message || 'Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.text}>Your cart is empty</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}>
          <Text style={s.btnText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.menuItemId + i.variant}
        contentContainerStyle={{ padding: 16, paddingTop: 56 }}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.sub}>{item.variant} · ₹{item.price}</Text>
            </View>
            <TouchableOpacity onPress={() => changeQty(item.menuItemId, item.variant, -1)}><Text style={s.qtyBtn}>−</Text></TouchableOpacity>
            <Text style={s.qty}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => changeQty(item.menuItemId, item.variant, 1)}><Text style={s.qtyBtn}>+</Text></TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={s.back}>← Menu</Text>
          </TouchableOpacity>
        }
        ListFooterComponent={
          <View>
            <Text style={s.total}>Total: ₹{total}</Text>
            <TextInput style={s.input} placeholder="Your name" placeholderTextColor="#777" value={name} onChangeText={setName} />
            <TextInput style={s.input} placeholder="Phone number" placeholderTextColor="#777" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={[s.input, { height: 80 }]} placeholder="Delivery address" placeholderTextColor="#777" multiline value={address} onChangeText={setAddress} />
            <TouchableOpacity style={s.btn} onPress={placeOrder} disabled={placing}>
              {placing ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Place Order</Text>}
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', marginBottom: 12, fontSize: 16 },
  back: { color: '#e8590c', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1c', borderRadius: 12, padding: 12, marginBottom: 10 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sub: { color: '#999' },
  qtyBtn: { color: '#e8590c', fontSize: 26, paddingHorizontal: 12 },
  qty: { color: '#fff', fontSize: 16, minWidth: 20, textAlign: 'center' },
  total: { color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 14 },
  input: { backgroundColor: '#1c1c1c', color: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  btn: { backgroundColor: '#e8590c', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});