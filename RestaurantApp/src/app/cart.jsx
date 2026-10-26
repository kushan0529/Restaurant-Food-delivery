import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
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
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    if (paymentMethod !== 'cod') return;
    api.get('/payments/captcha').then(({ data }) => setCaptcha(data)).catch(() => notify('Captcha unavailable', 'Please try again.'));
    setCaptchaAnswer('');
  }, [paymentMethod]);

  const placeOrder = async () => {
    if (!user) return router.push('/login');
    if (!name.trim() || !phone.trim() || !address.trim()) {
      return notify('Missing details', 'Please fill in name, phone and address.');
    }
    setPlacing(true);
    try {
      const orderDetails = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        deliveryAddress: address.trim(),
        items: items.map((i) => ({ menuItemId: i.menuItemId, variant: i.variant, quantity: i.quantity })),
        paymentMethod,
      };

      if (paymentMethod === 'online') {
        if (Platform.OS === 'web') throw new Error('Online payment is available in the Android/iOS app only.');
        const paymentOrder = await api.post('/payments/create-order', { items: orderDetails.items });
        const payment = await RazorpayCheckout.open({
          key: paymentOrder.data.key,
          amount: paymentOrder.data.order.amount,
          currency: paymentOrder.data.order.currency,
          name: 'The Grill and Barbeque',
          description: 'Food order payment',
          order_id: paymentOrder.data.order.id,
          prefill: { name: name.trim(), contact: phone.trim() },
        });
        await api.post('/payments/verify', payment);
        orderDetails.razorpayOrderId = payment.razorpay_order_id;
        orderDetails.paymentId = payment.razorpay_payment_id;
      } else {
        if (!captcha || !captchaAnswer.trim()) return notify('Captcha required', 'Enter the captcha to place a cash-on-delivery order.');
        orderDetails.captchaToken = captcha.token;
        orderDetails.captchaAnswer = captchaAnswer;
      }

      await api.post('/orders', orderDetails);
      clearCart();
      notify('Order placed', 'Thank you! You can track it here.');
      router.replace('/orders');
    } catch (e) {
      notify('Could not place order', e.response?.data?.message || e.message || 'Please try again.');
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
            <Text style={s.sectionTitle}>Payment method</Text>
            <View style={s.paymentRow}>
              <TouchableOpacity style={[s.paymentOption, paymentMethod === 'online' && s.paymentOptionOn]} onPress={() => setPaymentMethod('online')}>
                <Text style={s.paymentText}>UPI / Online</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.paymentOption, paymentMethod === 'cod' && s.paymentOptionOn]} onPress={() => setPaymentMethod('cod')}>
                <Text style={s.paymentText}>Cash on delivery</Text>
              </TouchableOpacity>
            </View>
            {paymentMethod === 'cod' && captcha && (
              <View>
                <Text style={s.captchaLabel}>Enter captcha: <Text style={s.captcha}>{captcha.text}</Text></Text>
                <TextInput style={s.input} placeholder="Captcha" placeholderTextColor="#777" autoCapitalize="characters" value={captchaAnswer} onChangeText={setCaptchaAnswer} />
              </View>
            )}
            <TouchableOpacity style={s.btn} onPress={placeOrder} disabled={placing}>
              {placing ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{paymentMethod === 'online' ? 'Pay and place order' : 'Place COD order'}</Text>}
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
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  paymentRow: { flexDirection: 'row', marginBottom: 12 },
  paymentOption: { flex: 1, borderWidth: 1, borderColor: '#444', borderRadius: 10, padding: 12, marginRight: 8, alignItems: 'center' },
  paymentOptionOn: { borderColor: '#e8590c', backgroundColor: 'rgba(232,89,12,0.15)' },
  paymentText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  captchaLabel: { color: '#bbb', marginBottom: 8 },
  captcha: { color: '#fff', fontWeight: '800', letterSpacing: 3, fontSize: 18 },
});
