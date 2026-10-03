import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/authContext';
import { colors } from '../../src/theme';

function Row({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <View style={s.rowIcon}><Ionicons name={icon} size={20} color={colors.accent} /></View>
      <Text style={s.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const header = (
    <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity style={s.back} onPress={() => router.replace('/')}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={s.topTitle}>Profile</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (!user) {
    return (
      <View style={s.container}>
        {header}
        <View style={s.guest}>
          <Text style={s.guestText}>You are not logged in</Text>
          <TouchableOpacity style={s.primary} onPress={() => router.push('/login')}>
            <Text style={s.primaryText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isAdmin = user.role === 'admin';
  const initial = (user.name || user.mobilenumber || '?').trim().charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={s.container}>
      {header}

      <View style={s.profileCard}>
        <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
        <Text style={s.name}>{user.name || 'Customer'}</Text>
        <Text style={s.mobile}>+91 {user.mobilenumber}</Text>
        {isAdmin && <View style={s.badge}><Text style={s.badgeText}>ADMIN</Text></View>}
      </View>

      <View style={s.group}>
        <Row icon="receipt-outline" label="My Orders" onPress={() => router.push('/orders')} />
        <Row icon="restaurant-outline" label="Browse Menu" onPress={() => router.replace('/')} />
      </View>

      {isAdmin && (
        <>
          <Text style={s.groupTitle}>ADMIN</Text>
          <View style={s.group}>
            <Row icon="create-outline" label="Manage Menu & Photos" onPress={() => router.push('/admin')} />
            <Row icon="list-outline" label="Manage Orders" onPress={() => router.push('/admin-orders')} />
          </View>
        </>
      )}

      <TouchableOpacity style={s.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },

  profileCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, marginTop: 12, paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  name: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 12 },
  mobile: { color: colors.muted, fontSize: 14, marginTop: 4 },
  badge: { backgroundColor: 'rgba(232,89,12,0.18)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 10 },
  badgeText: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  groupTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginHorizontal: 20, marginTop: 20, marginBottom: 8 },
  group: { backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, marginTop: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(232,89,12,0.12)', alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600', marginLeft: 12 },

  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 28, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.danger },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15, marginLeft: 8 },

  guest: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guestText: { color: colors.text, fontSize: 16, marginBottom: 14 },
  primary: { backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 30, paddingVertical: 12 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});