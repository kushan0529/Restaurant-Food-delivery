import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, Switch, TouchableOpacity, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/authContext';
import { notify, confirmAction } from '../../src/utils/alert';

const CATEGORIES = ['Tandoori / Grill Items', 'Non-Veg Platters', 'Shawarma Items'];

export default function AdminEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // present = editing, missing = adding
  const { user } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [variants, setVariants] = useState([{ label: '', price: '' }]);
  const [existingImage, setExistingImage] = useState('');
  const [newImage, setNewImage] = useState(null); // photo picked from the gallery

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/menu/${id}`)
      .then(({ data }) => {
        setName(data.name);
        setDescription(data.description || '');
        setCategory(data.category);
        setIsAvailable(data.isAvailable !== false);
        setVariants((data.variants || []).map((v) => ({ label: v.label, price: String(v.price) })));
        setExistingImage(data.image || '');
      })
      .catch(() => notify('Error', 'Could not load this item'))
      .finally(() => setLoading(false));
  }, [id]);

  if (user?.role !== 'admin') {
    return <View style={s.center}><Text style={{ color: '#fff' }}>Admins only</Text></View>;
  }
  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#111' }} color="#e8590c" />;

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (!res.canceled) setNewImage(res.assets[0]);
  };

  const updateVariant = (index, key, value) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)));

  const save = async () => {
    const clean = variants
      .filter((v) => v.label.trim() || v.price)
      .map((v) => ({ label: v.label.trim(), price: Number(v.price) }));
    if (!name.trim() || !category.trim()) return notify('Missing details', 'Name and category are required.');
    if (clean.length === 0 || clean.some((v) => !v.label || !Number.isFinite(v.price) || v.price <= 0)) {
      return notify('Check prices', 'Each size needs a label (e.g. Full) and a price above 0.');
    }

    const form = new FormData();
    form.append('name', name.trim());
    form.append('description', description.trim());
    form.append('category', category.trim());
    form.append('isAvailable', String(isAvailable));
    form.append('variants', JSON.stringify(clean));
    if (newImage) {
      const fileName = newImage.fileName || 'photo.jpg';
      if (Platform.OS === 'web') {
        // the browser needs a real file, not the phone-style object
        const blob = await (await fetch(newImage.uri)).blob();
        form.append('image', blob, fileName);
      } else {
        form.append('image', { uri: newImage.uri, name: fileName, type: newImage.mimeType || 'image/jpeg' });
      }
    }

    setSaving(true);
    try {
      const cfg = { timeout: 60000 };
      if (Platform.OS !== 'web') cfg.headers = { 'Content-Type': 'multipart/form-data' };
      if (isEdit) await api.put(`/menu/${id}`, form, cfg);
      else await api.post('/menu', form, cfg);
      router.replace('/admin');
    } catch (e) {
      notify('Could not save', e.response?.data?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    confirmAction('Delete item', `Delete "${name}" permanently?`, 'Delete', async () => {
      try { await api.delete(`/menu/${id}`); router.replace('/admin'); }
      catch (e) { notify('Could not delete', e.response?.data?.message || 'Please try again.'); }
    });

  const preview = newImage?.uri || existingImage;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
      <TouchableOpacity onPress={() => router.replace('/admin')}><Text style={s.link}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>{isEdit ? 'Edit Item' : 'Add Item'}</Text>

      <TouchableOpacity onPress={pickImage} style={s.photoBox}>
        {preview ? <Image source={{ uri: preview }} style={s.photo} /> : <Text style={{ color: '#999' }}>Tap to choose a photo</Text>}
      </TouchableOpacity>
      {!!preview && <TouchableOpacity onPress={pickImage}><Text style={[s.link, { textAlign: 'center', marginBottom: 12 }]}>Change photo</Text></TouchableOpacity>}

      <Text style={s.label}>Name</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Tandoori Chicken" placeholderTextColor="#777" />

      <Text style={s.label}>Description (optional)</Text>
      <TextInput style={[s.input, { height: 70 }]} value={description} onChangeText={setDescription} multiline placeholderTextColor="#777" />

      <Text style={s.label}>Category</Text>
      <View style={s.wrap}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.chip, category === c && s.chipActive]}>
            <Text style={[s.chipText, category === c && { color: '#fff' }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} value={category} onChangeText={setCategory} placeholder="or type a new category" placeholderTextColor="#777" />

      <Text style={s.label}>Sizes and prices</Text>
      {variants.map((v, i) => (
        <View key={i} style={s.variantRow}>
          <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={v.label} onChangeText={(t) => updateVariant(i, 'label', t)} placeholder="Full / Half / Regular" placeholderTextColor="#777" />
          <TextInput style={[s.input, { width: 90, marginBottom: 0, marginLeft: 8 }]} value={v.price} onChangeText={(t) => updateVariant(i, 'price', t)} keyboardType="numeric" placeholder="₹" placeholderTextColor="#777" />
          {variants.length > 1 && (
            <TouchableOpacity onPress={() => setVariants((p) => p.filter((_, x) => x !== i))}><Text style={s.x}>✕</Text></TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity onPress={() => setVariants((p) => [...p, { label: '', price: '' }])}><Text style={s.link}>+ Add size</Text></TouchableOpacity>

      <View style={[s.variantRow, { justifyContent: 'space-between', marginTop: 18 }]}>
        <Text style={s.label}>Available to order</Text>
        <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ true: '#e8590c' }} />
      </View>

      <TouchableOpacity style={s.btn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{isEdit ? 'Save changes' : 'Add item'}</Text>}
      </TouchableOpacity>
      {isEdit && (
        <TouchableOpacity style={[s.btn, { backgroundColor: '#3a1c1c', marginTop: 12 }]} onPress={remove}>
          <Text style={[s.btnText, { color: '#ff6b6b' }]}>Delete item</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginVertical: 12 },
  link: { color: '#e8590c', fontSize: 15, fontWeight: '700' },
  photoBox: { height: 190, borderRadius: 12, backgroundColor: '#1c1c1c', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  photo: { width: '100%', height: '100%' },
  label: { color: '#ccc', marginBottom: 6, marginTop: 8, fontWeight: '600' },
  input: { backgroundColor: '#1c1c1c', color: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: '#444', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#e8590c', borderColor: '#e8590c' },
  chipText: { color: '#ccc', fontSize: 13 },
  variantRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  x: { color: '#ff6b6b', fontSize: 18, paddingHorizontal: 10 },
  btn: { backgroundColor: '#e8590c', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});