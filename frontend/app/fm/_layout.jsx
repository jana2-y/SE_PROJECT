import { Stack } from 'expo-router';
import { ThemeProvider } from '../../context/ThemeContext';

const FMLayout = () => {
    return (
        <ThemeProvider>
            <Stack>
                <Stack.Screen name="dashboard" options={{ headerShown: false }} />
                <Stack.Screen name="assign" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
            </Stack>
        </ThemeProvider>
    );
};

export default FMLayout;
