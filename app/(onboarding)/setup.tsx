import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useProfile } from '../../lib/hooks/useProfile'
import {
  MAX_BIO_LENGTH,
  MAX_CITY_LENGTH,
  MAX_NAME_LENGTH,
  validateProfileInput,
  validateSelectedPhoto,
  sanitizeMultilineInput,
  sanitizeSingleLineInput,
} from '../../lib/security'
import { Colors } from '../../constants/colors'

export default function Setup() {
  const router = useRouter()
  const { saveProfile, uploadPhoto } = useProfile()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function pickPhoto() {
    if (photos.length >= 3) {
      Alert.alert('Limit reached', 'You can add up to 3 photos.')
      return
    }
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
      const asset = result.assets[0]
      const validationError = validateSelectedPhoto(asset)
      if (validationError) {
        Alert.alert('Invalid photo', validationError)
        return
      }
      setPhotos(prev => [...prev, asset.uri])
    }
  }

  function removePhoto(uri: string) {
    setPhotos(prev => prev.filter(p => p !== uri))
  }

  async function handleSave() {
    const sanitizedName = sanitizeSingleLineInput(name)
    const sanitizedCity = sanitizeSingleLineInput(city)
    const sanitizedBio = sanitizeMultilineInput(bio)
    const ageNum = parseInt(age, 10)
    const validationError = validateProfileInput({
      name: sanitizedName,
      age: ageNum,
      city: sanitizedCity,
      bio: sanitizedBio,
      gender,
      photoCount: photos.length,
    })

    if (validationError) {
      Alert.alert('Invalid profile', validationError)
      return
    }

    setSaving(true)
    try {
      const uploadedUrls = await Promise.all(photos.map(uri => uploadPhoto(uri)))
      await saveProfile({
        name: sanitizedName,
        age: ageNum,
        bio: sanitizedBio,
        city: sanitizedCity,
        photos: uploadedUrls,
        gender: gender as 'male' | 'female' | 'other',
      })
      router.replace('/(tabs)/discover')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Set up your profile</Text>
        <Text style={styles.sub}>This is what others will see.</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={Colors.mist}
          value={name}
          onChangeText={setName}
          maxLength={MAX_NAME_LENGTH}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor={Colors.mist}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          maxLength={3}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          placeholderTextColor={Colors.mist}
          value={city}
          onChangeText={setCity}
          maxLength={MAX_CITY_LENGTH}
        />

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

        <TextInput
          style={[styles.input, styles.bio]}
          placeholder="Bio (optional)"
          placeholderTextColor={Colors.mist}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          maxLength={MAX_BIO_LENGTH}
        />

        <Text style={styles.label}>Photos (up to 3)</Text>
        <View style={styles.photoRow}>
          {photos.map(uri => (
            <TouchableOpacity key={uri} onPress={() => removePhoto(uri)}>
              <Image source={{ uri }} style={styles.photo} />
              <View style={styles.removeOverlay}>
                <Text style={styles.removeText}>✕</Text>
              </View>
            </TouchableOpacity>
          ))}
          {photos.length < 3 && (
            <TouchableOpacity style={styles.photoAdd} onPress={pickPhoto}>
              <Text style={styles.photoAddText}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.buttonText}>Save profile</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.frost },
  container: { padding: 24, paddingTop: 60 },
  heading: { fontSize: 32, fontWeight: '600', color: Colors.navy, marginBottom: 4 },
  sub: { fontSize: 14, color: Colors.mist, marginBottom: 32 },
  label: { fontSize: 14, color: Colors.navy, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.navy,
    marginBottom: 12,
  },
  bio: { height: 100, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  genderBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.haze,
    backgroundColor: Colors.white, alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: Colors.ocean, borderColor: Colors.ocean,
  },
  genderBtnText: { fontSize: 15, color: Colors.navy, fontWeight: '500' },
  genderBtnTextActive: { color: Colors.white },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
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
  button: {
    backgroundColor: Colors.ocean, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})
