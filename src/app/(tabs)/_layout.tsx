import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { type IconName } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { api } from '@/lib/api';

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };

export default function TabsLayout() {
  const unread = useQuery(api.matches.unreadCount);
  const me = useQuery(api.profiles.me);
  // Keeps the stored position fresh, but only while location sharing is on.
  useLocation({ refreshOnMount: me?.hasLocation === true });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: icon('flame') }} />
      <Tabs.Screen name="nearby" options={{ title: 'Nearby', tabBarIcon: icon('location') }} />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: icon('chatbubbles'),
          tabBarBadge: unread ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.primary },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
