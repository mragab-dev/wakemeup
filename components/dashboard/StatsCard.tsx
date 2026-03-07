
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '@/constants/theme';
import Card from '@/components/ui/Card';
import { useTheme } from '@/hooks/useTheme';

interface StatItemProps {
  label: string;
  value: string | number;
  color: string;
  progress?: number; // Optional progress value between 0 and 1
}

export const StatsCard: React.FC<{ title: string; stats: StatItemProps[] }> = ({ 
  title, 
  stats 
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  return (
    <Card variant="elevated" style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={[styles.statIndicator, { backgroundColor: stat.color }]} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.progress !== undefined && (
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { backgroundColor: stat.color, width: `${stat.progress * 100}%` }]} />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  statIndicator: {
    width: 8,
    height: '100%',
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
});

export default StatsCard;