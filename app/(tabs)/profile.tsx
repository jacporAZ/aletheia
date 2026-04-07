import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../lib/hooks/useProfile'
import { Colors } from '../../constants/colors'

export default function ProfileScreen() {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const { profile, loading, saveProfile, uploadPhoto, refetch } = useProfile(userId)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id))
  }, [])

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setAge(String(profile.age))
      setBio(profile.bio ?? '')
      setCity(profile.city ?? '')
      setPhotos(profile.photos ?? [])
    }
  }, [profile])

  async function pickPhoto() {
    if (photos.length >= 3) { Alert.alert('Limit reached', 'You can add up to 3 photos.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    })
    if (!result.canceled) {
      setPhotos(prev => [...prev, result.assets[0].uri])
    }
  }

  async function handleSave() {
    const ageNum = parseInt(age, 10)
    if (!name.trim()) { Alert.alert('Required', 'Name cannot be empty.'); return }
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) { Alert.alert('Invalid age', 'Enter a valid age (18–100).'); return }
    if (!city.trim()) { Alert.alert('Required', 'City cannot be empty.'); return }

    setSaving(true)
    try {
      const uploadedUrls = await Promise.all(
        photos.map(uri => uri.startsWith('http') ? Promise.resolve(uri) : uploadPhoto(uri))
      )
      await saveProfile({ name: name.trim(), age: ageNum, bio: bio.trim(), city: city.trim(), photos: uploadedUrls })
      setEditing(false)
      refetch()
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (profile) {
      setName(profile.name)
      setAge(String(profile.age))
      setBio(profile.bio ?? '')
      setCity(profile.city ?? '')
      setPhotos(profile.photos ?? [])
    }
    setEditing(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.ocean} /></View>
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Profile</Text>
        {!editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.editBtn}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Photos */}
      <View style={styles.photoRow}>
        {photos.map((uri, i) => (
          <View key={i}>
            <Image source={{ uri }} style={styles.photo} />
            {editing && (
              <TouchableOpacity
                style={styles.removeOverlay}
                onPress={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {editing && photos.length < 3 && (
          <TouchableOpacity style={styles.photoAdd} onPress={pickPhoto}>
            <Text style={styles.photoAddText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Fields */}
      {editing ? (
        <>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={Colors.mist} />
          <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Age" placeholderTextColor={Colors.mist} keyboardType="number-pad" maxLength={3} />
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={Colors.mist} />
          <TextInput style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} placeholder="Bio" placeholderTextColor={Colors.mist} multiline numberOfLines={4} />

          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.name}>{profile?.name}, {profile?.age}</Text>
          <Text style={styles.city}>{profile?.city}</Text>
          {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
        </>
      )}

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.frost },
  container: { padding: 24, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.frost },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.ocean },
  editBtn: { fontSize: 16, color: Colors.sky, fontWeight: '500' },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  photo: { width: 90, height: 112, borderRadius: 10 },
  removeOverlay: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  photoAdd: {
    width: 90, height: 112, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.mist, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  photoAddText: { fontSize: 32, color: Colors.mist },
  name: { fontSize: 24, fontWeight: '700', color: Colors.navy },
  city: { fontSize: 16, color: Colors.mist, marginTop: 4, marginBottom: 12 },
  bioText: { fontSize: 15, color: Colors.navy, lineHeight: 22 },
  input: {
    backgroundColor: Colors.white, borderWidth: 0.5, borderColor: Colors.haze,
    borderRadius: 12, padding: 16, fontSize: 16, color: Colors.navy, marginBottom: 12,
  },
  bio: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.mist, borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelText: { color: Colors.mist, fontSize: 15, fontWeight: '500' },
  saveBtn: { flex: 2, backgroundColor: Colors.ocean, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  saveText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  signOutBtn: { marginTop: 48, alignItems: 'center' },
  signOutText: { color: Colors.mist, fontSize: 14 },
})
