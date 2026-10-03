import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, SectionList, ScrollView, Image, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../src/api/axios';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/authContext';
import { colors } from '../../src/theme';

export default function Menu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: cartItems, addItem, changeQty, count, total } = useCart();
  const { user } = useAuth();

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState({}); // { [itemId]: chosen size label }

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const res = await api.get('/menu'); // public: no login needed
      setMenu(res.data.filter((i) => i.variants && i.variants.length > 0));
    } catch (e) {
      setError('Could not load the menu. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => ['All', ...new Set(menu.map((i) => i.category))], [menu]);

  // group the visible items by category for the section headers
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = {};
    menu
      .filter((i) => (category === 'All' || i.category === category) && (!q || i.name.toLowerCase().includes(q)))
      .forEach((i) => { (groups[i.category] = groups[i.category] || []).push(i); });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [menu, category, query]);

  const handleAdd = (item, variant) => {
    // guests can browse, but need to log in to add to cart
    if (!user) return router.push('/login');
    addItem(item, variant);
  };

  const renderItem = ({ item }) => {
    const variants = item.variants;
    const label = selected[item._id] || variants[0].label;
    const variant = variants.find((v) => v.label === label) || variants[0];
    const inCart = cartItems.find((x) => x.menuItemId === item._id && x.variant === variant.label);

    return (
      <View style={s.card}>
        <View style={s.info}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.price}>₹{variant.price}</Text>
          {!!item.description && <Text style={s.desc} numberOfLines={2}>{item.description}</Text>}
          {variants.length > 1 && (
            <View style={s.sizes}>
              {variants.map((v) => (
                <TouchableOpacity
                  key={v.label}
                  onPress={() => setSelected((p) => ({ ...p, [item._id]: v.label }))}
                  style={[s.size, v.label === variant.label && s.sizeOn]}
                >
                  <Text style={[s.sizeText, v.label === variant.label && s.sizeTextOn]}>{v.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={s.photoWrap}>
          {item.image
            ? <Image source={{ uri: item.image }} style={s.photo} />
            : <View style={[s.photo, s.noPhoto]}><Ionicons name="restaurant-outline" size={30} color={colors.muted} /></View>}
          <View style={s.actionWrap}>
            {inCart ? (
              <View style={s.stepper}>
                <TouchableOpacity hitSlop={10} onPress={() => changeQty(item._id, variant.label, -1)}>
                  <Ionicons name="remove" size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={s.qty}>{inCart.quantity}</Text>
                <TouchableOpacity hitSlop={10} onPress={() => changeQty(item._id, variant.label, 1)}>
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.addBtn} onPress={() => handleAdd(item, variant)}>
                <Text style={s.addText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.bg }} color={colors.accent} />;
  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retry} onPress={() => load()}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.brand} numberOfLines={1}>The Grill and Barbeque</Text>
          <Text style={s.tagline}>Tandoori · Grill · Shawarma</Text>
        </View>
        {user ? (
          <View style={s.icons}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/orders')}>
              <Ionicons name="receipt-outline" size={21} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/profile')}>
              <Ionicons name="person-outline" size={21} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/login')}>
            <Text style={s.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={s.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search dishes"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips: fixed height so a long list can never squash them */}
      <View style={s.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsContent}>
          {categories.map((c) => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.chip, category === c && s.chipOn]}>
              <Text style={[s.chipText, category === c && s.chipTextOn]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => <Text style={s.section}>{section.title}</Text>}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: count > 0 ? 110 : 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.accent} onRefresh={() => { setRefreshing(true); load(true); }} />}
        ListEmptyComponent={<Text style={s.empty}>No dishes found.</Text>}
      />

      {/* Cart bar */}
      {count > 0 && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[s.cartBar, { bottom: insets.bottom + 12 }]}
          onPress={() => router.push('/cart')}
        >
          <View>
            <Text style={s.cartCount}>{count} {count === 1 ? 'item' : 'items'}</Text>
            <Text style={s.cartTotal}>₹{total}</Text>
          </View>
          <View style={s.cartGo}>
            <Text style={s.cartGoText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: colors.text, marginBottom: 14, textAlign: 'center' },
  retry: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  brand: { color: colors.text, fontSize: 21, fontWeight: '800' },
  tagline: { color: colors.muted, fontSize: 12, marginTop: 2 },
  icons: { flexDirection: 'row' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  loginBtn: { backgroundColor: colors.accent, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8 },
  loginText: { color: '#fff', fontWeight: '700' },

  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, color: colors.text, marginLeft: 8, fontSize: 15 },

  chipsWrap: { height: 56, flexShrink: 0 },
  chipsContent: { paddingHorizontal: 16, alignItems: 'center' },
  chip: { height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff' },

  section: { color: colors.text, fontSize: 17, fontWeight: '800', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },

  card: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: colors.border },
  info: { flex: 1, paddingRight: 14 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  price: { color: colors.text, fontSize: 15, marginTop: 4, fontWeight: '600' },
  desc: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  sizes: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  size: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginRight: 8, marginBottom: 6 },
  sizeOn: { borderColor: colors.accent, backgroundColor: 'rgba(232,89,12,0.15)' },
  sizeText: { color: '#bbb', fontSize: 12, fontWeight: '600' },
  sizeTextOn: { color: colors.accent },

  photoWrap: { width: 120, height: 120 },
  photo: { width: 120, height: 120, borderRadius: 14, backgroundColor: colors.card2 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  actionWrap: { position: 'absolute', bottom: -16, left: 0, right: 0, alignItems: 'center' },
  addBtn: { width: 96, height: 34, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  stepper: { width: 96, height: 34, borderRadius: 8, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  qty: { color: '#fff', fontWeight: '800', fontSize: 15 },

  cartBar: { position: 'absolute', left: 16, right: 16, backgroundColor: colors.accent, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartCount: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  cartTotal: { color: '#fff', fontSize: 17, fontWeight: '800' },
  cartGo: { flexDirection: 'row', alignItems: 'center' },
  cartGoText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});