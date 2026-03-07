
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { Medication } from '@/types';
import { Pill, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settingsStore';
import Button from '../ui/Button';

interface MedicationCardProps {
  medication: Medication;
  onEdit: () => void;
  onDelete: () => void;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();
  const { t } = useSettingsStore();

  const getNextDoseTime = () => {
    if (medication.doses.length === 0) return null;
    return medication.doses[0].time;
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return t('medicationListItem_noDoses');
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const period = t(hour >= 12 ? 'pm' : 'am');
    let displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const nextDoseTime = getNextDoseTime();
  const isLowStock = medication.trackInventory &&
    medication.totalCount !== undefined &&
    medication.lowStockThreshold !== undefined &&
    medication.totalCount <= medication.lowStockThreshold;

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={[styles.colorIndicator, { backgroundColor: medication.color }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            {medication.imageUri ? (
              <Image source={{ uri: medication.imageUri }} style={styles.image} />
            ) : (
              <View style={[styles.iconContainer, { backgroundColor: medication.color }]}>
                <Pill size={16} color="white" />
              </View>
            )}
            <Text style={styles.name}>{medication.name}</Text>
          </View>
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={styles.lowStockText}>{t('medicationListItem_lowStock')}</Text>
            </View>
          )}
        </View>

        <Text style={styles.dosage}>{medication.dosage}</Text>

        <View style={styles.nextDoseContainer}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.nextDoseText}>
            {t('medicationListItem_next')} {formatTime(nextDoseTime)}
          </Text>
        </View>

        {medication.trackInventory && medication.totalCount !== undefined && (
          <View style={styles.inventoryContainer}>
            <Text style={styles.inventoryText}>
              {medication.totalCount} {t(medication.totalCount === 1 ? 'medicationListItem_pill' : 'medicationListItem_pills')} {t('medicationListItem_remaining')}
            </Text>
          </View>
        )}
        
        <View style={styles.actionsContainer}>
          <Button
            title={t('edit')}
            onPress={onEdit}
            variant="outline"
            size="sm"
            style={styles.actionButton}
            textStyle={styles.actionButtonText}
          />
           <Button
            title={t('delete')}
            onPress={onDelete}
            variant="ghost"
            size="sm"
            style={styles.actionButton}
            textStyle={{...styles.actionButtonText, color: colors.error}}
          />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  colorIndicator: {
    width: 6,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  dosage: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  nextDoseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  nextDoseText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  inventoryContainer: {
    marginTop: theme.spacing.xs,
  },
  inventoryText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  lowStockText: {
    fontSize: theme.typography.fontSizes.xs,
    color: colors.error,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: theme.spacing.md,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSizes.sm,
  },
});

export default MedicationCard;
