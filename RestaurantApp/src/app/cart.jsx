import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, NativeModules, KeyboardAvoidingView } from 'react-native';
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
  const [captchaLoading, setCaptchaLoading] = useState(false);

  useEffect(() => {
    if (paymentMethod !== 'cod') return;
    setCaptcha(null);
    setCaptchaAnswer('');
    setCaptchaLoading(true);
    api.get('/payments/captcha')
      .then(({ data }) => setCaptcha(data))
      .catch(() => notify('Captcha unavailable', 'Please try again.'))
      .finally(() => setCaptchaLoading(false));
  }, [paymentMethod]);

  const placeOrder = async () => {
    if (!user) return router.push('/login');
    if (!name.trim() || !phone.trim() || !address.trim()) {
      return notify('Missing details', 'Please fill in name, phone and address.');
    }
    if (paymentMethod === 'cod' && (!captcha || !captchaAnswer.trim())) {
      return notify('Captcha required', 'Enter the captcha to place a cash-on-delivery order.');
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
        if (!NativeModules.RNRazorpayCheckout) {
          throw new Error('UPI checkout is unavailable in this app build. Install the Android/iOS development build, not Expo Go.');
        }
        const paymentOrder = await api.post('/payments/create-order', { items: orderDetails.items });
        const gatewayOrder = paymentOrder.data?.order;
        if (!paymentOrder.data?.key || !gatewayOrder?.id || !gatewayOrder?.amount || !gatewayOrder?.currency) {
          throw new Error(paymentOrder.data?.message || 'Payment order was not created. Please try again.');
        }
        const payment = await RazorpayCheckout.open({
          key: paymentOrder.data.key,
          amount: gatewayOrder.amount,
          currency: gatewayOrder.currency,
          name: 'The Grill and Barbeque',
          description: 'Food order payment',
          order_id: gatewayOrder.id,
          method: { upi: true },
          prefill: { name: name.trim(), contact: phone.trim() },
        });
        if (!payment?.razorpay_order_id || !payment?.razorpay_payment_id || !payment?.razorpay_signature) {
          throw new Error('UPI payment did not return valid confirmation details.');
        }
        await api.post('/payments/verify', payment);
        orderDetails.razorpayOrderId = payment.razorpay_order_id;
        orderDetails.paymentId = payment.razorpay_payment_id;
      } else {
        orderDetails.captchaToken = captcha.token;
        orderDetails.captchaAnswer = captchaAnswer.trim().toUpperCase();
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 42, paddingBottom: 28 }}
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
            <TextInput style={[s.input, s.addressInput]} placeholder="Delivery address" placeholderTextColor="#777" multiline textAlignVertical="top" value={address} onChangeText={setAddress} />
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
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TextInput
                  style={[s.input, s.captchaInput]}
                  placeholder="Type the captcha"
                  placeholderTextColor="#777"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!captchaLoading}
                  selectionColor="#e8590c"
                  value={captchaAnswer}
                  onChangeText={(value) => setCaptchaAnswer(value.toUpperCase())}
                />
                </KeyboardAvoidingView>
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
  back: { color: '#e8590c', fontSize: 20, lineHeight: 26, fontWeight: '500', marginBottom: 26 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1c', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 17, marginBottom: 20 },
  name: { color: '#fff', fontSize: 20, lineHeight: 26, fontWeight: '500' },
  sub: { color: '#777', fontSize: 17, lineHeight: 23, marginTop: 1 },
  qtyBtn: { color: '#e8590c', fontSize: 30, lineHeight: 32, fontWeight: '300', paddingHorizontal: 11 },
  qty: { color: '#aaa', fontSize: 21, minWidth: 24, textAlign: 'center' },
  total: { color: '#fff', fontSize: 28, lineHeight: 36, fontWeight: '700', marginTop: 48, marginBottom: 28 },
  input: { height: 64, backgroundColor: '#1c1c1c', color: '#fff', borderRadius: 17, paddingHorizontal: 16, fontSize: 18, marginBottom: 16 },
  addressInput: { height: 106, paddingTop: 17 },
  captchaInput: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 2, borderWidth: 2, borderColor: '#555', backgroundColor: 'transparent' },
  btn: { height: 64, backgroundColor: '#f45a00', borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '500', fontSize: 20 },
  sectionTitle: { color: '#fff', fontSize: 23, lineHeight: 30, fontWeight: '500', marginTop: 10, marginBottom: 16 },
  paymentRow: { flexDirection: 'row', marginBottom: 26 },
  paymentOption: { flex: 1, height: 64, borderWidth: 2, borderColor: '#444', borderRadius: 17, paddingHorizontal: 8, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  paymentOptionOn: { borderColor: '#e8590c', backgroundColor: 'rgba(232,89,12,0.16)' },
  paymentText: { color: '#fff', fontSize: 18, fontWeight: '400', textAlign: 'center' },
  captchaLabel: { color: '#777', fontSize: 18, lineHeight: 28, marginBottom: 12 },
  captcha: { color: '#fff', fontWeight: '700', letterSpacing: 4, fontSize: 22 },
});
