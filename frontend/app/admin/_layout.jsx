import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#004e92' },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        headerTitle: 'Campus Care',
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="users" options={{ title: 'Manage Accounts' }} />
      <Stack.Screen name="requests" options={{ title: 'Verification Requests' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="leaderboard" options={{ title: 'LEADERBOARD' }} />
      <Stack.Screen name="rewards" options={{ title: 'REWARDS' }} />
    </Stack>
  );
}

