import { Stack } from 'expo-router';

const FMLayout = () => {
    return (
        <Stack>
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="assign" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="analytics" options={{ headerShown: false }} />
        </Stack>
    );
};

export default FMLayout;
