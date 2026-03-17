import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

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
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#ffffff',
          contentStyle: { backgroundColor: '#0f0f23' },
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
      </Stack>
    </QueryClientProvider>
  );
}
