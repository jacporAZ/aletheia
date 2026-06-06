import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { ShieldCheck, Users, Bell, Settings, ChevronRight } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../lib/hooks/useProfile'
import { Colors } from '../../constants/colors'

const __DEV__ = process.env.NODE_ENV !== 'production'

export default function ProfileScreen() {
  const router = useRouter()
  const { profile, loading, saveProfile, uploadPhoto, refetch } = useProfile()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setAge(String(profile.age))
      setBio(profile.bio ?? '')
      setCity(profile.city ?? '')
      setGender(profile.gender ?? null)
      setPhotos(profile.photos ?? [])
    }
  }, [profile])

  async function pickPhoto() {
    if (photos.length >= 3) { Alert.alert('Limit reached', 'You can add up to 3 photos.'); return }
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Camera required', 'Aletheia needs camera access to take your profile photos.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
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
    if (!gender) { Alert.alert('Required', 'Please select your gender.'); return }

    setSaving(true)
    try {
      const uploadedUrls = await Promise.all(
        photos.map(uri => uri.startsWith('http') ? Promise.resolve(uri) : uploadPhoto(uri))
      )
      await saveProfile({ name: name.trim(), age: ageNum, bio: bio.trim(), city: city.trim(), photos: uploadedUrls, gender: gender ?? undefined })
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
      setGender(profile.gender ?? null)
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
          <Text style={styles.label}>I am a</Text>
          <View style={styles.genderRow}>
            {(['male', 'female', 'other'] as const).map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.genderBtn, gender === option && styles.genderBtnActive]}
                onPress={() => setGender(option)}
              >
                <Text style={[styles.genderBtnText, gender === option && styles.genderBtnTextActive]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
          <Text style={styles.city}>{profile?.city}{profile?.gender ? ` · ${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}` : ''}</Text>
          {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}

          {/* Settings rows */}
          <View style={styles.settingsCard}>
            {[
              { Icon: ShieldCheck, label: 'Trust & verification',  detail: profile?.is_verified ? 'Verified' : undefined },
              { Icon: Users,       label: 'Friends & vouches',     detail: undefined },
              { Icon: Bell,        label: 'Notifications',         detail: undefined },
              { Icon: Settings,    label: 'Settings',              detail: undefined },
            ].map(({ Icon, label, detail }, i, arr) => (
              <View
                key={label}
                style={[styles.settingsRow, i < arr.length - 1 && styles.settingsRowBorder]}
              >
                <Icon size={20} color={Colors.ocean} strokeWidth={1.75} />
                <Text style={styles.settingsLabel}>{label}</Text>
                {detail ? <Text style={styles.settingsDetail}>{detail}</Text> : null}
                <ChevronRight size={16} color={Colors.mist} strokeWidth={1.75} />
              </View>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      {__DEV__ && (
        <TouchableOpacity style={styles.devBtn} onPress={() => router.push('/(dev)' as any)}>
          <Text style={styles.devBtnText}>Dev Tools</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.frost },
  container: { padding: 24, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.frost },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heading: { fontSize: 32, fontWeight: '600', color: Colors.navy },
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
  bioText: { fontSize: 15, color: Colors.navy, lineHeight: 22, marginBottom: 24 },
  input: {
    backgroundColor: Colors.white, borderWidth: 0.5, borderColor: Colors.haze,
    borderRadius: 12, padding: 16, fontSize: 16, color: Colors.navy, marginBottom: 12,
  },
  bio: { height: 100, textAlignVertical: 'top' },
  label: { fontSize: 14, color: Colors.navy, fontWeight: '600', marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.haze,
    backgroundColor: Colors.white, alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: Colors.ocean, borderColor: Colors.ocean },
  genderBtnText: { fontSize: 15, color: Colors.navy, fontWeight: '500' },
  genderBtnTextActive: { color: Colors.white },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.mist, borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelText: { color: Colors.mist, fontSize: 15, fontWeight: '500' },
  saveBtn: { flex: 2, backgroundColor: Colors.ocean, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  saveText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  signOutBtn: { marginTop: 32, alignItems: 'center' },
  signOutText: { color: Colors.mist, fontSize: 14 },
  devBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  devBtnText: { color: Colors.mist, fontSize: 12, fontFamily: 'monospace' },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    overflow: 'hidden',
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.haze,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.navy,
  },
  settingsDetail: {
    fontSize: 13,
    color: Colors.mist,
  },
})
