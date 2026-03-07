import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import Card from '@/components/ui/Card';
import { Bell, Pill } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settingsStore';

interface UpcomingItemProps {
  type: 'alarm' | 'medication';
  name: string;
  time: string;
  details?: string;
}

export const UpcomingCard: React.FC<{ item: UpcomingItemProps }> = ({ item }) => {
  const { colors } = useTheme();
  const { t } = useSettingsStore();

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = t(hour >= 12 ? 'pm' : 'am');
    let displayHour = hour;

    if (period) {
      displayHour = hour % 12 || 12;
    }
    
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period || ''}`.trim();
  };
  
  const styles = createStyles(colors);

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: item.type === 'alarm' ? colors.primary + '20' : colors.secondary + '20' }]}>
          {item.type === 'alarm' ? (
            <Bell size={20} color={colors.primary} />
          ) : (
            <Pill size={20} color={colors.secondary} />
          )}
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatTime(item.time)}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        {item.details && (
          <Text style={styles.details}>{item.details}</Text>
        )}
      </View>
    </Card>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    backgroundColor: colors.primary + '20', // 20% opacity
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  time: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    marginTop: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  details: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
  },
});

export default UpcomingCard;
