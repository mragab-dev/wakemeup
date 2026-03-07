
import { Medication } from '@/types';

export const calculateDaysToEmpty = (medication: Medication): number | null => {
  if (
    !medication.trackInventory ||
    medication.totalCount === undefined ||
    medication.pillsPerDose === undefined ||
    medication.pillsPerDose <= 0 ||
    medication.doses.length === 0
  ) {
    return null;
  }

  let dosesPerWeek = 0;
  medication.doses.forEach(dose => {
    dosesPerWeek += Object.values(dose.days).filter(Boolean).length;
  });

  if (dosesPerWeek === 0) {
    return null;
  }

  const pillsPerWeek = dosesPerWeek * medication.pillsPerDose;
  const pillsPerDay = pillsPerWeek / 7;

  if (pillsPerDay <= 0) {
    return null;
  }

  const daysLeft = Math.floor(medication.totalCount / pillsPerDay);
  return daysLeft;
};
