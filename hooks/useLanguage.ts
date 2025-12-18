import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useLanguage() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    (i18n.language as Language) || 'en'
  );

  // Load saved language on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LANGUAGE);
        if (savedLanguage && ['en', 'es', 'pt', 'tl'].includes(savedLanguage)) {
          setCurrentLanguage(savedLanguage as Language);
          i18n.changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.warn('Failed to load saved language:', error);
      }
    };

    loadSavedLanguage();
  }, [i18n]);

  const changeLanguage = useCallback(
    async (language: Language) => {
      try {
        await i18n.changeLanguage(language);
        setCurrentLanguage(language);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_LANGUAGE, language);
      } catch (error) {
        console.warn('Failed to change language:', error);
      }
    },
    [i18n]
  );

  return {
    currentLanguage,
    changeLanguage,
  };
}

export default useLanguage;
