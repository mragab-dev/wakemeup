

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useMedicationStore } from '@/store/medicationStore';
import { useTheme } from '@/hooks/useTheme';
import { Medication } from '@/types';
import Button from '@/components/ui/Button';
import { Plus, Pill } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import MedicationCard from '@/components/medications/MedicationCard';
import PromotionalBanner from '@/components/PromotionalBanner';
import { useSettingsStore } from '@/store/settingsStore';
import { useEventLogStore } from '@/store/eventLogStore';
import EmptyState from '@/components/ui/EmptyState';
import theme from '@/constants/theme';

const BANNER_HEIGHT = 50;

export default function MedicationsScreen() {
  const {
    medications,
    addMedication,
    updateMedication,
    deleteMedication,
    medicationToEditId,
    setMedicationToEditId,
    isCreatingNewMedication,
    setIsCreatingNewMedication
  } = useMedicationStore();
  const { addEvent } = useEventLogStore();
  const { colors } = useTheme();
  const { t, language } = useSettingsStore();
  const isFocused = useIsFocused();
  const params = useLocalSearchParams();

  const handleOpenForm = (medId?: string) => {
    router.push({
      pathname: '/medication-form' as any,
      params: { id: medId }
    });
  };

  useEffect(() => {
    if (medicationToEditId && isFocused) {
      handleOpenForm(medicationToEditId);
      setMedicationToEditId(null);
    }
  }, [medicationToEditId, isFocused]);

  useEffect(() => {
    if (isCreatingNewMedication && isFocused) {
      handleOpenForm();
      setIsCreatingNewMedication(false);
    }
  }, [isCreatingNewMedication, isFocused]);

  const handleDeleteMedication = (medicationId: string) => {
    Alert.alert(
      t('deleteMedication'),
      t('deleteMedicationConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete'),
          onPress: () => {
            const medication = medications.find(m => m.id === medicationId);
            if (medication) {
              addEvent({
                type: 'medication_deleted',
                itemId: medicationId,
                itemName: medication.name,
              });
            }
            deleteMedication(medicationId);
          },
          style: "destructive"
        }
      ]
    );
  };

  const styles = createStyles(colors, language);
  const sortedMedications = [...medications].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{t('medications')}</Text>
          <Button
            onPress={() => handleOpenForm()}
            variant="primary"
            size="md"
            title={t('addMedication')}
            style={{ minWidth: 100 }}
          />
        </View>

        {sortedMedications.length === 0 ? (
          <EmptyState
            icon={<Pill size={80} color={colors.textSecondary} />}
            title={t('noMedicationsAdded')}
            description={t('addFirstMedication')}
          />
        ) : (
          <FlatList
            data={sortedMedications}
            renderItem={({ item }) => (
              <MedicationCard
                medication={item}
                onEdit={() => handleOpenForm(item.id)}
                onDelete={() => handleDeleteMedication(item.id)}
              />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: any, language: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 5,
    gap: theme.spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContent: {
    paddingBottom: 160,
  },
  bannerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  }
});