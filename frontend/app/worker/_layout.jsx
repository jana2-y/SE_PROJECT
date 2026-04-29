import { Stack } from 'expo-router';
import { ThemeProvider } from '../../context/ThemeContext';

const WorkerLayout = () => {
    return (
        <ThemeProvider>
            <Stack>
                <Stack.Screen name="home" options={{ headerShown: false }} />
                <Stack.Screen name="proof" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
            </Stack>
        </ThemeProvider>
    );
};

export default WorkerLayout;
