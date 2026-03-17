import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{emoji}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  icon: {
    fontSize: 22,
  },
  iconActive: {
    fontSize: 24,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#a0a0b0',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2a2a4e',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎾" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚔️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
