import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setHasProfile(null); return }
    supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setHasProfile(!!data))
  }, [session])

  useEffect(() => {
    if (!initialized) return
    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login')
      return
    }

    // Wait until profile check resolves
    if (hasProfile === null) return

    if (!hasProfile && !inOnboarding) {
      router.replace('/(onboarding)/setup')
    } else if (hasProfile && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/discover')
    }
  }, [session, initialized, hasProfile, segments])

  return <Stack screenOptions={{ headerShown: false }} />
}
