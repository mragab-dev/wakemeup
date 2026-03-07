import { useSettingsStore } from '@/store/settingsStore';
import { lightColors, darkColors } from '@/constants/colors';
import { useColorScheme } from 'react-native';

export const useTheme = () => {
  const { theme } = useSettingsStore();
  const systemColorScheme = useColorScheme();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  
  return {
    colors,
    isDark,
    theme: isDark ? 'dark' : 'light',
  };
};