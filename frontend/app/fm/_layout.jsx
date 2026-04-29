import { Stack } from 'expo-router';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';

const FMLayout = () => {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <Stack>
                    <Stack.Screen name="dashboard" options={{ headerShown: false }} />
                    <Stack.Screen name="assign" options={{ headerShown: false }} />
                    <Stack.Screen name="settings" options={{ headerShown: false }} />
                    <Stack.Screen name="analytics" options={{ headerShown: false }} />
                </Stack>
            </ThemeProvider>
        </LanguageProvider>
    );
};

export default FMLayout;
