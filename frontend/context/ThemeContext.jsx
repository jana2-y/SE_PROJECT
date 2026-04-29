import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Velvet & Gold Glass palette ───────────────────────────────────────────────
export const LIGHT = {
    // Core
    primary:        '#800020',
    primaryBtn:     '#800020',
    primaryBtnText: '#ffffff',
    text:           '#31120c',
    textSub:        '#57423e',
    textFaint:      '#8b716d',
    error:          '#ba1a1a',
    success:        '#2d7a3a',
    divider:        'rgba(49,18,12,0.08)',

    // Gradient
    gradStart:      '#a6867dff',
    gradEnd:        '#ede0da',

    // Glass / surfaces
    card:           'rgba(255,248,246,0.97)',
    glass:          'rgba(255,255,255,0.62)',
    glassBorder:    'rgba(66,0,0,0.12)',
    pillBg:         'rgba(128,0,32,0.07)',

    // Inputs
    inputBg:        'rgba(255,240,238,0.9)',
    inputBorder:    'rgba(128,0,32,0.18)',

    // Segment / chips
    segActiveBg:    '#800020',
    segActiveTx:    '#ffffff',
    segInactiveTx:  '#800020',

    // ── backward-compat keys for other pages ─────────────────────────────────
    bg:             '#ede0da',
    surface:        'rgba(255,248,246,0.97)',
    border:         'rgba(66,0,0,0.12)',
    btnBg:          '#800020',
    btnText:        '#ffffff',
    textMid:        '#57423e',
    filtersBg:      'rgba(255,240,238,0.9)',
    pickerItemBg:   'rgba(255,248,246,0.97)',
    workerSelected: 'rgba(128,0,32,0.07)',
    workerSelectedTx: '#800020',
    avatarBg:       '#800020',
    footerBg:       'rgba(255,240,238,0.9)',
    headerBg:       'rgba(255,240,238,0.9)',
};

export const DARK = {
    // Core
    primary:        '#ffb4a8',
    primaryBtn:     '#660b05',
    primaryBtnText: '#ffdad4',
    text:           '#fff8f6',
    textSub:        'rgba(255,248,246,0.62)',
    textFaint:      'rgba(255,248,246,0.38)',
    error:          '#cf6679',
    success:        '#4caf7d',
    divider:        'rgba(255,248,246,0.08)',

    // Gradient
    gradStart:      '#382928ff',
    gradEnd:        '#421313ff',

    // Glass / surfaces
    card:           'rgba(42,15,9,0.97)',
    glass:          'rgba(74,39,31,0.65)',
    glassBorder:    'rgba(255,218,211,0.14)',
    pillBg:         'rgba(255,180,168,0.12)',

    // Inputs
    inputBg:        'rgba(74,39,31,0.7)',
    inputBorder:    'rgba(255,218,211,0.22)',

    // Segment / chips
    segActiveBg:    '#660b05',
    segActiveTx:    '#ffdad4',
    segInactiveTx:  'rgba(255,248,246,0.65)',

    // ── backward-compat keys for other pages ─────────────────────────────────
    bg:             '#2a0f09',
    surface:        'rgba(42,15,9,0.97)',
    border:         'rgba(255,218,211,0.14)',
    btnBg:          '#660b05',
    btnText:        '#ffdad4',
    textMid:        'rgba(255,248,246,0.62)',
    filtersBg:      'rgba(74,39,31,0.7)',
    pickerItemBg:   'rgba(42,15,9,0.97)',
    workerSelected: 'rgba(255,180,168,0.12)',
    workerSelectedTx: '#ffb4a8',
    avatarBg:       '#660b05',
    footerBg:       'rgba(74,39,31,0.7)',
    headerBg:       'rgba(74,39,31,0.7)',
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
