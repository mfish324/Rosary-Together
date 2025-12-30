import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../../constants';

function TabBarEmoji({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundLight,
          borderTopColor: COLORS.surface,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: () => <TabBarEmoji emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Rooms',
          headerShown: false,
          tabBarIcon: () => <TabBarEmoji emoji="🏛️" />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          headerShown: false,
          tabBarIcon: () => <TabBarEmoji emoji="👥" />,
        }}
      />
      <Tabs.Screen
        name="pray"
        options={{
          title: 'Pray',
          headerShown: false,
          tabBarIcon: () => <TabBarEmoji emoji="📿" />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: () => <TabBarEmoji emoji="📅" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <TabBarEmoji emoji="⚙️" />,
        }}
      />
    </Tabs>
  );
}
