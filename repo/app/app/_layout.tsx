import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../lib/i18n';
import { theme } from '../lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen
          name="player/[id]"
          options={{
            title: 'Player',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="tournament/[id]"
          options={{
            title: 'Tournament',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            title: 'Match',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="brand/[name]"
          options={{
            title: 'Brand',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="fantasy/create"
          options={{
            title: 'Create Team',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="fantasy/team"
          options={{
            title: 'My Team',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="fantasy/leaderboard"
          options={{
            title: 'Leaderboard',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="fantasy/rules"
          options={{
            title: 'Scoring Rules',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="fantasy/predictions"
          options={{
            title: 'Bracket Predictions',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="fantasy/predict/[tournamentId]"
          options={{
            title: 'Predict Bracket',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="fantasy/predict-result/[tournamentId]"
          options={{
            title: 'Prediction Results',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
