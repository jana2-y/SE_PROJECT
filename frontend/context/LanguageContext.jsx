import React, { createContext, useState, useContext, useEffect } from 'react';
import { I18nManager, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../i18n';
import i18n from 'i18next';

const LanguageContext = createContext({});
export const useLanguage = () => useContext(LanguageContext);

const langCodeMap = { English: 'en', German: 'de', Arabic: 'ar' };

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState('English');

    useEffect(() => {
        AsyncStorage.getItem('appLanguage').then(saved => {
            if (saved) applyLanguage(saved, false);
        });
    }, []);

    const applyLanguage = async (lang, save = true) => {
        const code = langCodeMap[lang] || 'en';
        const isRTL = lang === 'Arabic';

        await i18n.changeLanguage(code);
        setLanguageState(lang);
        if (save) await AsyncStorage.setItem('appLanguage', lang);

        if (I18nManager.isRTL !== isRTL) {
            I18nManager.forceRTL(isRTL);
            if (Platform.OS !== 'web') {
                Alert.alert(
                    i18n.t('restartTitle'),
                    i18n.t('restartMsg')
                );
            }
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: applyLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
