import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  Keyboard, Platform, StyleSheet, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const bg = require('../../assets/images/login-bg.jpg'); // put the artwork at assets/images/login-bg.jpg

// Wrap any login / register screen in this to get the "The Grill & Barbeque" artwork background.
// The heading is part of the picture, so the form card sits below it.
export default function AuthBackground({ title, subtitle, children }) {
  const { width, height } = useWindowDimensions();
  // Keep the image dimensions stable while the keyboard changes the window height.
  const [backgroundSize] = useState(() => ({ width, height }));
  const wide = backgroundSize.width > backgroundSize.height * 0.75; // desktop browser: show the whole picture instead of cropping it

  // Track the keyboard height ourselves, so the form can lift above it on every phone
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKb(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKb(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      {/* explicit width/height + resizeMode inside style, so the picture is always fitted to the screen */}
      <Image
        source={bg}
        style={{ position: 'absolute', top: 0, left: 0, width: backgroundSize.width, height: backgroundSize.height, resizeMode: wide ? 'contain' : 'cover' }}
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          // keyboard closed: card sits under the heading; keyboard open: card moves up and the keyboard's height is added below it
          contentContainerStyle={[s.scroll, { paddingTop: kb ? 24 : height * 0.37, paddingBottom: kb + 24 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <Text style={s.title}>{title}</Text>
            {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
            {children}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// Text field with an icon (and a show/hide eye for passwords)
export function AuthInput({ icon, secure, ...props }) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={s.inputWrap}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <TextInput
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
        {...props}
        secureTextEntry={hidden}
        style={s.input}
      />
      {secure && (
        <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function AuthButton({ label, loading, onPress }) {
  return (
    <TouchableOpacity style={[s.button, loading && { opacity: 0.7 }]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{label}</Text>}
    </TouchableOpacity>
  );
}

export const authStyles = StyleSheet.create({
  link: { color: '#ccc', textAlign: 'center', marginTop: 18, fontSize: 14 },
  linkBold: { color: colors.accent, fontWeight: '700' },
});

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 24 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: 'rgba(17,17,17,0.84)', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 16 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card2, borderRadius: 12, paddingHorizontal: 14, height: 50, marginTop: 12 },
  input: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 10 },

  button: { backgroundColor: colors.accent, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
