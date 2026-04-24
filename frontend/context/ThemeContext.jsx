import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LIGHT = {
    bg:               '#1a2a6c',
    surface:          '#ffffff',
    card:             '#ffffff',
    border:           '#E5E5E5',
    primary:          '#0078D4',
    btnBg:            '#0078D4',
    btnText:          '#ffffff',
    text:             '#181C22',
    textSub:          '#717783',
    textMid:          '#404752',
    error:            '#DC2626',
    success:          '#059669',
    inputBg:          '#F3F3F3',
    filtersBg:        '#ffffff',
    pickerItemBg:     '#ffffff',
    workerSelected:   '#D3E3FF',
    workerSelectedTx: '#004883',
    avatarBg:         '#0078D4',
    footerBg:         '#ffffff',
    headerBg:         '#ffffff',
};

export const DARK = {
    bg:               '#06111f',
    surface:          '#0d1f35',
    card:             '#101e30',
    border:           'rgba(58,123,213,0.18)',
    primary:          '#3a7bd5',
    btnBg:            '#0f2a4a',
    btnText:          '#a0b4cc',
    text:             '#e8edf2',
    textSub:          '#607080',
    textMid:          '#a0b4cc',
    error:            '#e53935',
    success:          '#2e7d52',
    inputBg:          '#0d1f35',
    filtersBg:        '#0d1f35',
    pickerItemBg:     '#0d1f35',
    workerSelected:   'rgba(58,123,213,0.22)',
    workerSelectedTx: '#3a7bd5',
    avatarBg:         '#3a7bd5',
    footerBg:         '#0d1f35',
    headerBg:         '#0d1f35',
};

const ThemeContext = createContext({
    theme: 'light',
    colors: LIGHT,
    setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState('light');

    useEffect(() => {
        AsyncStorage.getItem('appTheme').then(saved => {
            if (saved === 'dark' || saved === 'light') setThemeState(saved);
        });
    }, []);

    const setTheme = async (t) => {
        setThemeState(t);
        await AsyncStorage.setItem('appTheme', t);
    };

    const colors = useMemo(() => theme === 'dark' ? DARK : LIGHT, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, colors, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
