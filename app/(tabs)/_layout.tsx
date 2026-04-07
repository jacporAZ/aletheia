import { Tabs } from 'expo-router'
import { Colors } from '../../constants/colors'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.ocean,
        tabBarInactiveTintColor: Colors.mist,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.haze,
        },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
