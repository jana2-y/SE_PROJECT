import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.text,
        headerTitleAlign: 'center',
        headerTitle: 'Campus Care',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard', headerShown: false }} />
      <Stack.Screen name="users" options={{ title: 'Manage Accounts', headerShown: false }} />
      <Stack.Screen name="requests" options={{ title: 'Verification Requests', headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ title: 'LEADERBOARD', headerShown: false }} />
      <Stack.Screen name="rewards" options={{ title: 'REWARDS', headerShown: false }} />
    </Stack>
  );
}

