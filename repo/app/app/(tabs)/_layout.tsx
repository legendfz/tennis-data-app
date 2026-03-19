import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { theme } from '../../lib/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{label}</Text>
      {focused && <View style={tabStyles.indicator} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    minHeight: 44,
    minWidth: 44,
  },
  icon: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconActive: {
    color: theme.accent,
    fontWeight: theme.fontWeight.bold,
  },
  indicator: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.accent,
    marginTop: 4,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.cardAlt,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        headerStyle: {
          backgroundColor: theme.bg,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: theme.fontWeight.semibold,
          fontSize: 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Matches',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="Matches" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="Players" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ focused }) => <TabIcon label="Tournaments" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="h2h"
        options={{
          title: 'H2H',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="H2H" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="following"
        options={{
          title: 'Following',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="Following" focused={focused} />,
        }}
      />
      {/* Hide matches tab from tab bar - content merged into index */}
      <Tabs.Screen
        name="matches"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
