

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { useMedicationStore } from '@/store/medicationStore';
import { useEventLogStore } from '@/store/eventLogStore';
import { useTheme } from '@/hooks/useTheme';
import { EventLog, Medication, MedicationAdherenceDetail } from '@/types';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { REPORT_PERIOD_VALUES } from '@/constants/reportConstants';
import { calculateDaysToEmpty } from '@/utils/dateTimeHelpers';
import { exportDataToCSV } from '@/utils/exportHelpers';
import AdherenceBarChart from '@/components/reports/AdherenceBarChart';
import { useSettingsStore } from '@/store/settingsStore';
import { router } from 'expo-router';
import theme from '@/constants/theme';
import {
  Bell, BellRing, History, BellOff, CheckCircle2, XCircle, BellDot, Pill, Activity,
  SkipForward, Rewind, ListX, AlertTriangle, PackageCheck, ArchiveX, Archive,
  FileText, Trash2
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const cardMargin = 8;
const numColumns = 2;
const cardWidth = (screenWidth / numColumns) - (cardMargin * (numColumns + 1) / numColumns) - 16;

type EventLogFilterType = 'all' | 'alarms' | 'medications';

const getStatCardColors = (themeColors: any, colorName: string) => {
  const defaultColor = themeColors.info;
  const defaultBg = `${themeColors.info}20`;

  switch (colorName) {
    case 'sky': return { border: themeColors.info, text: themeColors.info, icon: themeColors.info, bg: `${themeColors.info}20` };
    case 'amber': return { border: themeColors.warning, text: themeColors.warning, icon: themeColors.warning, bg: `${themeColors.warning}20` };
    case 'green': return { border: themeColors.success, text: themeColors.success, icon: themeColors.success, bg: `${themeColors.success}20` };
    case 'teal': return { border: '#0D9488', text: '#2DD4BF', icon: '#2DD4BF', bg: 'rgba(45, 212, 191, 0.1)' };
    case 'red': return { border: themeColors.error, text: themeColors.error, icon: themeColors.error, bg: `${themeColors.error}20` };
    case 'purple': return { border: '#7C3AED', text: '#A78BFA', icon: '#A78BFA', bg: 'rgba(167, 139, 250, 0.1)' };
    default: return { border: defaultColor, text: defaultColor, icon: defaultColor, bg: defaultBg };
  }
};

const StatCard: React.FC<{ titleKey: string; value: string | number; icon: React.ReactNode; colorKey?: string; unit?: string; }> =
  ({ titleKey, value, icon, colorKey = "sky", unit = "" }) => {
    const theme = useTheme();
    const { t, language } = useSettingsStore();
    const cardColors = getStatCardColors(theme.colors, colorKey);
    const title = t(titleKey);

    const isRTL = language === 'ar';
    const styles = StyleSheet.create({
      statCard: {
        width: cardWidth,
        minHeight: 80,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginBottom: cardMargin,
        borderLeftWidth: isRTL ? 0 : 4,
        borderRightWidth: isRTL ? 4 : 0,
        borderColor: cardColors.border,
        backgroundColor: cardColors.bg,
      },
      statContent: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
      },
      statTextContainer: {
        flexShrink: 1,
        marginRight: isRTL ? 0 : 5,
        marginLeft: isRTL ? 5 : 0,
        alignItems: isRTL ? 'flex-end' : 'flex-start',
      },
      statTitle: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginBottom: 2,
        flexWrap: 'wrap',
      },
      statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: cardColors.text,
      },
      statUnit: {
        fontSize: 12,
        fontWeight: 'normal',
        marginLeft: isRTL ? 0 : 2,
        marginRight: isRTL ? 2 : 0,
        color: cardColors.text,
      },
      statIconWrapper: {
        padding: 5,
        borderRadius: 8,
      },
    });

    return (
      <View style={styles.statCard}>
        <View style={styles.statContent}>
          <View style={styles.statTextContainer}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>{value}{unit && <Text style={styles.statUnit}> {unit}</Text>}</Text>
          </View>
          <View style={styles.statIconWrapper}>
            {icon}
          </View>
        </View>
      </View>
    );
  };

export default function ReportsScreen() {
  const { events, clearAlarmEventLogs, clearMedicationEventLogs } = useEventLogStore();
  const { medications, setMedicationToEditId } = useMedicationStore();
  const theme = useTheme();
  const { t, language } = useSettingsStore();

  const isRTL = language === 'ar';

  const [filteredEventsByPeriod, setFilteredEventsByPeriod] = useState<EventLog[]>(events);
  const [displayedEvents, setDisplayedEvents] = useState<EventLog[]>([]);
  const [reportPeriod, setReportPeriod] = useState<string>('week');
  const [eventLogFilter, setEventLogFilter] = useState<EventLogFilterType>('all');
  const [medicationAdherenceDetails, setMedicationAdherenceDetails] = useState<MedicationAdherenceDetail[]>([]);

  const reportPeriodOptions = REPORT_PERIOD_VALUES.map(value => ({
    value,
    label: t(`reportPeriods.${value}`)
  }));

  const filterEventsByPeriodCb = useCallback(() => {
    const now = new Date();
    let startTime: number;

    switch (reportPeriod) {
      case 'today':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        break;
      case 'week':
        const currentDayOfWeek = now.getDay();
        const dateCopyForWeek = new Date(now.getTime());
        dateCopyForWeek.setDate(now.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
        dateCopyForWeek.setHours(0, 0, 0, 0);
        startTime = dateCopyForWeek.getTime();
        break;
      case 'month':
        startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        break;
      case 'last7days':
        const sevenDaysAgo = new Date(now.getTime());
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        startTime = sevenDaysAgo.getTime();
        break;
      case 'last30days':
        const thirtyDaysAgo = new Date(now.getTime());
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        startTime = thirtyDaysAgo.getTime();
        break;
      case 'all':
      default:
        startTime = 0;
    }
    setFilteredEventsByPeriod(events.filter(event => event.timestamp >= startTime));
  }, [events, reportPeriod]);

  useEffect(() => {
    filterEventsByPeriodCb();
  }, [events, reportPeriod, filterEventsByPeriodCb]);

  useEffect(() => {
    let eventsToDisplay = filteredEventsByPeriod;
    if (eventLogFilter === 'alarms') {
      eventsToDisplay = filteredEventsByPeriod.filter(e => e.type.startsWith("alarm_"));
    } else if (eventLogFilter === 'medications') {
      eventsToDisplay = filteredEventsByPeriod.filter(e => e.type.startsWith("medication_") || e.type.startsWith("low_stock_"));
    }
    setDisplayedEvents(eventsToDisplay.sort((a, b) => b.timestamp - a.timestamp));
  }, [filteredEventsByPeriod, eventLogFilter]);

  useEffect(() => {
    const calculateAdherence = () => {
      const details: MedicationAdherenceDetail[] = [];
      medications.forEach(med => {
        const takenCount = filteredEventsByPeriod.filter(
          e => e.type === 'medication_taken' && e.itemId === med.id
        ).length;
        const skippedCount = filteredEventsByPeriod.filter(
          e => e.type === 'medication_skipped' && e.itemId === med.id
        ).length;

        const scheduledCount = takenCount + skippedCount;
        const adherenceRate = scheduledCount > 0 ? Math.round((takenCount / scheduledCount) * 100) : 0;

        if (scheduledCount > 0) {
          details.push({
            medicationId: med.id,
            medicationName: med.name,
            adherenceRate,
            takenCount,
            scheduledCount,
            skippedCount
          });
        }
      });
      setMedicationAdherenceDetails(details);
    };
    if (filteredEventsByPeriod.length > 0 || medications.length > 0) {
      calculateAdherence();
    } else {
      setMedicationAdherenceDetails([]);
    }
  }, [filteredEventsByPeriod, medications]);

  const alarmStats = {
    triggered: filteredEventsByPeriod.filter(e => e.type === 'alarm_triggered').length,
    snoozed: filteredEventsByPeriod.filter(e => e.type === 'alarm_snoozed').length,
    dismissed: filteredEventsByPeriod.filter(e => e.type === 'alarm_dismissed').length,
  };

  const medStats = {
    taken: filteredEventsByPeriod.filter(e => e.type === 'medication_taken').length,
    skipped: filteredEventsByPeriod.filter(e => e.type === 'medication_skipped').length,
    snoozed: filteredEventsByPeriod.filter(e => e.type === 'medication_snoozed').length,
  };

  const totalScheduled = medStats.taken + medStats.skipped;
  const adherenceRate = totalScheduled > 0 ? ((medStats.taken / totalScheduled) * 100).toFixed(0) : 0;

  const lowStockMeds = medications.filter(
    med => med.trackInventory &&
      med.totalCount !== undefined &&
      med.lowStockThreshold !== undefined &&
      med.totalCount <= med.lowStockThreshold
  );

  const handleResetAlarmActivity = () => {
    Alert.alert(
      t('resetAlarmActivityConfirmTitle'),
      t('resetAlarmActivityConfirmMessage'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete'), onPress: () => {
            clearAlarmEventLogs();
            Alert.alert(t('settingsSavedTitle'), t('resetSuccessMessage'));
          }, style: "destructive"
        }
      ]
    );
  };

  const handleResetMedAdherence = () => {
    Alert.alert(
      t('resetMedDataConfirmTitle'),
      t('resetMedDataConfirmMessage'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete'), onPress: () => {
            clearMedicationEventLogs();
            Alert.alert(t('settingsSavedTitle'), t('medDataResetSuccessMessage'));
          }, style: "destructive"
        }
      ]
    );
  };

  const handleExportEventLogs = async () => {
    if (displayedEvents.length === 0) {
      Alert.alert(t('noDataToExport'), t('noEventLogs'));
      return;
    }
    const preparedEvents = displayedEvents.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp).toISOString(),
      details: event.details ? JSON.stringify(event.details) : '',
    }));
    await exportDataToCSV(preparedEvents, `event_logs_${reportPeriod}_${eventLogFilter}.csv`);
  };

  const handleExportMedications = async () => {
    if (medications.length === 0) {
      Alert.alert(t('noDataToExport'), t('noMedicationsAdded'));
      return;
    }
    const preparedMedications = medications.map(med => ({
      ...med,
      doses: JSON.stringify(med.doses),
    }));
    await exportDataToCSV(preparedMedications, 'medications_list.csv');
  };

  const handleLowStockMedPress = (medicationId: string) => {
    setMedicationToEditId(medicationId);
    router.push('/medications');
  };

  const styles = createStyles(theme, isRTL, language);

  const renderLogEntry = ({ item }: { item: EventLog }) => {
    const logColors = getStatCardColors(theme.colors,
      item.type.includes("skipped") ? "red" :
        item.type.includes("taken") || item.type.includes("dismissed") ? "green" :
          "sky"
    );
    const icon = item.type.startsWith("alarm") ?
      <Bell size={18} color={logColors.icon} /> :
      item.type.startsWith("med") ?
        <Pill size={18} color={logColors.icon} /> : <AlertTriangle size={18} color={logColors.icon} />;

    return (
      <View style={styles.logEntry}>
        <View style={[styles.logIconContainer, { backgroundColor: logColors.bg }]}>
          {icon}
        </View>
        <View style={styles.logTextContainer}>
          <Text style={styles.logMessage}>{item.itemName}: {t('event_' + item.type)}</Text>
          <Text style={styles.logTimestamp}>{new Date(item.timestamp).toLocaleString(language)}</Text>
        </View>
      </View>
    );
  };

  const renderMedicationAdherenceItem = ({ item }: { item: MedicationAdherenceDetail }) => {
    const adherenceColor = item.adherenceRate >= 75 ? theme.colors.success : item.adherenceRate >= 50 ? theme.colors.warning : theme.colors.error;
    return (
      <View style={styles.adherenceCard}>
        <Text style={styles.adherenceMedName}>{item.medicationName}</Text>
        <Text style={[styles.adherenceRateText, { color: adherenceColor }]}>
          {t('medAdherenceOverall')}: {item.adherenceRate}%
        </Text>
        <Text style={styles.adherenceDetailText}>
          {t('reportsScreen.medStats.taken')}: {item.takenCount} / {t('total')}: {item.scheduledCount} / {t('reportsScreen.medStats.skipped')}: {item.skippedCount}
        </Text>
      </View>
    );
  };

  const EventLogFilterButtons = () => (
    <View style={styles.filterButtonContainer}>
      {(['all', 'alarms', 'medications'] as EventLogFilterType[]).map(filterType => (
        <TouchableOpacity
          key={filterType}
          style={[
            styles.filterButton,
            eventLogFilter === filterType ? styles.filterButtonActive : styles.filterButtonInactive,
          ]}
          onPress={() => setEventLogFilter(filterType)}
        >
          <Text style={eventLogFilter === filterType ? styles.filterButtonTextActive : styles.filterButtonTextInactive}>
            {t(`eventLogFilters.${filterType}Events`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('reports')}</Text>
        <View style={styles.periodSelectorContainer}>
          <Select
            options={reportPeriodOptions}
            value={reportPeriod}
            onValueChange={(value) => setReportPeriod(value as string)}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('alarmActivity')}</Text>
      <View style={styles.statsGrid}>
        <StatCard titleKey="reportsScreen.alarmStats.triggered" value={alarmStats.triggered} icon={<BellRing size={24} color={getStatCardColors(theme.colors, 'sky').icon} />} colorKey="sky" />
        <StatCard titleKey="reportsScreen.alarmStats.snoozed" value={alarmStats.snoozed} icon={<History size={24} color={getStatCardColors(theme.colors, 'amber').icon} />} colorKey="amber" />
        <StatCard titleKey="reportsScreen.alarmStats.dismissed" value={alarmStats.dismissed} icon={<BellOff size={24} color={getStatCardColors(theme.colors, 'teal').icon} />} colorKey="teal" />
      </View>

      <Text style={styles.sectionTitle}>{t('medAdherenceOverall')}</Text>
      <View style={styles.statsGrid}>
        <StatCard titleKey="total" value={totalScheduled} icon={<BellDot size={24} color={getStatCardColors(theme.colors, 'sky').icon} />} colorKey="sky" />
        <StatCard titleKey="reportsScreen.medStats.taken" value={medStats.taken} icon={<Pill size={24} color={getStatCardColors(theme.colors, 'green').icon} />} colorKey="green" />
        <StatCard titleKey="medAdherenceOverall" value={adherenceRate} unit="%" icon={<Activity size={24} color={getStatCardColors(theme.colors, 'purple').icon} />} colorKey="purple" />
        <StatCard titleKey="reportsScreen.medStats.skipped" value={medStats.skipped} icon={<SkipForward size={24} color={getStatCardColors(theme.colors, 'red').icon} />} colorKey="red" />
        <StatCard titleKey="reportsScreen.medStats.snoozed" value={medStats.snoozed} icon={<Rewind size={24} color={getStatCardColors(theme.colors, 'amber').icon} />} colorKey="amber" />
      </View>

      <Text style={styles.sectionTitle}>{t('detailedMedAdherence')}</Text>
      {medicationAdherenceDetails.length > 0 ? (
        <>
          <View style={styles.chartContainer}>
            <AdherenceBarChart data={medicationAdherenceDetails} />
          </View>
          <FlatList
            data={medicationAdherenceDetails}
            renderItem={renderMedicationAdherenceItem}
            keyExtractor={item => item.medicationId}
            scrollEnabled={false}
          />
        </>
      ) : (
        <View style={styles.emptyStateCardMini}>
          <ListX size={32} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateTextMini}>{t('noEventLogs')}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('medInventoryInsights')}</Text>
      {medications.some(med => med.trackInventory) ? (
        <>
          {lowStockMeds.length > 0 && (
            <View style={styles.insightSection}>
              <AlertTriangle size={20} color={theme.colors.warning} style={styles.insightIcon} />
              <Text style={styles.insightTitle}>{t('lowStockNotifications')}:</Text>
              {lowStockMeds.map(med => (
                <TouchableOpacity key={med.id} onPress={() => handleLowStockMedPress(med.id)}>
                  <Text style={[styles.insightText, styles.tappableInsightText]}>
                    - {med.name}: {med.totalCount} {t('reportsScreen.unit_remaining')} ({t('lowStockThreshold')}: {med.lowStockThreshold})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.insightSection}>
            <PackageCheck size={20} color={getStatCardColors(theme.colors, "teal").icon} style={styles.insightIcon} />
            <Text style={styles.insightTitle}>{t('medicationForm.estimatedDaysToEmptyText').replace(': {days}', '')}:</Text>
            {medications.map(med => {
              const daysLeft = calculateDaysToEmpty(med);
              if (daysLeft !== null) {
                return (
                  <Text key={med.id} style={styles.insightText}>
                    - {med.name}: {t('medicationForm.estimatedDaysToEmptyText', { days: daysLeft })}
                  </Text>
                );
              }
              return null;
            })}
            {medications.every(med => calculateDaysToEmpty(med) === null) && (
              <Text style={styles.insightText}>{t('reportsScreen.noInventoryForEstimate')}</Text>
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyStateCardMini}>
          <ArchiveX size={32} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateTextMini}>{t('reportsScreen.noInventoryTrackingEnabled')}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('recentEventLog')}</Text>
      <EventLogFilterButtons />
      {displayedEvents.length > 0 ? (
        <FlatList
          data={displayedEvents.slice(0, 50)}
          renderItem={renderLogEntry}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          persistentScrollbar={true}
        />
      ) : (
        <View style={styles.emptyStateCard}>
          <Archive size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateText}>{t('noEventLogs')}</Text>
        </View>
      )}

      <View style={styles.actionButtonsContainer}>
        <Text style={styles.sectionTitle}>{t('dataManagement')}</Text>
        <Button
          variant="outline"
          title={t('exportEventLogs')}
          onPress={handleExportEventLogs}
          style={styles.actionButton}
          fullWidth
          leftIcon={<FileText size={16} color={theme.colors.primary} />}
        />
        <Button
          variant="outline"
          title={t('exportMedList')}
          onPress={handleExportMedications}
          style={styles.actionButton}
          fullWidth
          leftIcon={<FileText size={16} color={theme.colors.primary} />}
        />
        <Button
          variant="outline"
          title={t('resetAlarmActivity')}
          onPress={handleResetAlarmActivity}
          style={styles.actionButtonDanger}
          textStyle={{ color: theme.colors.error }}
          fullWidth
          leftIcon={<Trash2 size={16} color={theme.colors.error} />}
        />
        <Button
          variant="outline"
          title={t('resetMedData')}
          onPress={handleResetMedAdherence}
          style={styles.actionButtonDanger}
          textStyle={{ color: theme.colors.error }}
          fullWidth
          leftIcon={<Trash2 size={16} color={theme.colors.error} />}
        />
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any, isRTL: boolean, language: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 160,
  },
  header: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
    flexShrink: 1,
  },
  periodSelectorContainer: {
    minWidth: 130,
    maxWidth: '45%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 0,
    textAlign: isRTL ? 'right' : 'left',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -cardMargin / 2,
  },
  logEntry: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    backgroundColor: theme.colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  logIconContainer: {
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  logTextContainer: {
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  logMessage: {
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: 2,
    textAlign: isRTL ? 'right' : 'left',
  },
  logTimestamp: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: isRTL ? 'right' : 'left',
  },
  emptyStateCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 15,
    textAlign: 'center',
  },
  insightSection: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: isRTL ? 'right' : 'left',
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginLeft: isRTL ? 0 : 5,
    marginRight: isRTL ? 5 : 0,
    marginBottom: 3,
    textAlign: isRTL ? 'right' : 'left',
  },
  tappableInsightText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  insightIcon: {
    marginBottom: 8,
    alignSelf: isRTL ? 'flex-end' : 'flex-start',
  },
  emptyStateCardMini: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyStateTextMini: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    marginTop: 20,
    marginBottom: 10,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingTop: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  actionButtonDanger: {
    marginBottom: 12,
    borderColor: theme.colors.error,
  },
  adherenceCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  adherenceMedName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  adherenceRateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: isRTL ? 'right' : 'left',
  },
  adherenceDetailText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: isRTL ? 'right' : 'left',
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  filterButtonContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonInactive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterButtonTextInactive: {
    color: theme.colors.textSecondary,
  }
});
