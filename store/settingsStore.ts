
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '@/types';
import { Language } from '@/constants/locales';

interface SettingsState extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'en',
  notificationSound: 'default',
  vibrationEnabled: true,
  exportDataFormat: 'csv',
};

// Import translations dynamically to avoid circular dependency
let translations: any = null;
const getTranslations = async () => {
  if (!translations) {
    const module = await import('@/constants/locales');
    translations = module.translations;
  }
  return translations;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      updateSettings: (newSettings) => set((state) => ({
        ...state,
        ...newSettings,
      })),
      
      resetSettings: () => set(defaultSettings),
      
      t: (key: string, replacements?: { [key: string]: string | number }): string => {
        const state = get();
        if (!translations) {
          // Return key if translations not loaded yet
          return key;
        }
        
        const lang = state.language || 'en';
        const langTranslations = translations[lang] || translations.en;

        const keys = key.split('.');
        let value: any = langTranslations;
        
        for (const k of keys) {
          if (value === undefined) {
            value = undefined;
            break;
          }
          value = value[k];
        }
        
        let str = value || key;

        if (replacements) {
          for (const placeholder in replacements) {
            str = str.replace(`{${placeholder}}`, String(replacements[placeholder]));
          }
        }
        
        return str;
      },
    }),
    {
      name: 'wake-me-up-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => async (state) => {
        // Load translations when store is rehydrated
        await getTranslations();
      },
    }
  )
);

// Initialize translations
getTranslations();
