import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { theme } from '../../lib/theme';
import {
  MatchesIcon,
  PlayersIcon,
  TournamentsIcon,
  H2HIcon,
  FollowingIcon,
} from '../../lib/tab-icons';

function TabIcon({
  label,
  focused,
  icon: Icon,
}: {
  label: string;
  focused: boolean;
  icon: React.ComponentType<{ color: string; size?: number }>;
}) {
  const color = focused ? theme.accent : theme.textSecondary;
  return (
    <View style={tabStyles.iconWrap}>
      <Icon color={color} size={22} />
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
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
  label: {
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 3,
  },
  labelActive: {
    color: theme.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  indicator: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.accent,
    marginTop: 3,
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
          height: 68,
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
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Matches" focused={focused} icon={MatchesIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Players" focused={focused} icon={PlayersIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Events" focused={focused} icon={TournamentsIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="h2h"
        options={{
          title: 'H2H',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="H2H" focused={focused} icon={H2HIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="following"
        options={{
          title: 'Following',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Following" focused={focused} icon={FollowingIcon} />
          ),
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
