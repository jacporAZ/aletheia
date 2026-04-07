import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/colors'
import { useRouter } from 'expo-router'

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail) {
      Alert.alert('Missing email', 'Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.')
      return
    }
    if (trimmedPassword.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email: trimmedEmail, password: trimmedPassword })
    setLoading(false)
    if (error) {
      Alert.alert('Registration failed', error.message)
    } else {
      Alert.alert('Check your email', 'We sent you a confirmation link.')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.logo}>Aletheia</Text>
      <Text style={styles.tagline}>Date the real person.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={Colors.mist}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={Colors.mist}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating account...' : 'Create account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontFamily: 'serif',
    fontSize: 42,
    color: Colors.ocean,
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.mist,
    marginBottom: 48,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.navy,
    marginBottom: 12,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.ocean,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  link: {
    marginTop: 24,
    color: Colors.sky,
    fontSize: 14,
  },
})
