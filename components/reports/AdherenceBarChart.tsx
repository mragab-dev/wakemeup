
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { MedicationAdherenceDetail } from '@/types';
import theme from '@/constants/theme';

interface AdherenceBarChartProps {
  data: MedicationAdherenceDetail[];
}

export const AdherenceBarChart: React.FC<AdherenceBarChartProps> = ({ data }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const maxValue = 100;

  return (
    <View style={styles.container}>
      {data.length > 0 ? (
        data.map((item) => (
          <View key={item.medicationId} style={styles.barGroup}>
            <Text style={styles.label} numberOfLines={1}>
              {item.medicationName}
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max((item.adherenceRate / maxValue) * 100, 5)}%`,
                    backgroundColor: item.adherenceRate > 75 ? colors.success : item.adherenceRate > 50 ? colors.warning : colors.error,
                  },
                ]}
              />
              <Text style={styles.barLabel}>{item.adherenceRate}%</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No adherence data to display.</Text>
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      padding: theme.spacing.sm,
    },
    barGroup: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.fontSizes.sm,
      color: colors.textSecondary,
      marginBottom: theme.spacing.xs,
      width: '80%',
    },
    barContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 20,
      backgroundColor: colors.border,
      borderRadius: theme.borderRadius.sm,
    },
    bar: {
      height: '100%',
      borderRadius: theme.borderRadius.sm,
    },
    barLabel: {
        position: 'absolute',
        right: 5,
        fontSize: theme.typography.fontSizes.xs,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    noDataText: {
      textAlign: 'center',
      color: colors.textSecondary,
      padding: theme.spacing.md,
    },
  });

export default AdherenceBarChart;
