import { Tabs } from 'expo-router'
import { Compass, Heart, MessageCircle, User } from 'lucide-react-native'
import { Colors } from '../../constants/colors'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.ocean,
        tabBarInactiveTintColor: Colors.mist,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderTopColor: Colors.haze,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Compass size={size ?? 22} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <Heart size={size ?? 22} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size ?? 22} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size ?? 22} color={color} strokeWidth={1.75} />
          ),
        }}
      />
    </Tabs>
  )
}
