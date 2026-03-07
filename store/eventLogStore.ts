
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventLog, EventType } from '@/types';

interface EventLogState {
  events: EventLog[];
  addEvent: (event: Omit<EventLog, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  clearAlarmEventLogs: () => void;
  clearMedicationEventLogs: () => void;
  getEventsByType: (type: EventType) => EventLog[];
  getEventsByItem: (itemId: string) => EventLog[];
  getEventsByDateRange: (startDate: number, endDate: number) => EventLog[];
}

export const useEventLogStore = create<EventLogState>()(
  persist(
    (set, get) => ({
      events: [],
      
      addEvent: (event) => set((state) => ({
        events: [
          ...state.events, 
          { 
            ...event, 
            id: Date.now().toString(),
            timestamp: Date.now(),
          }
        ]
      })),
      
      clearEvents: () => set({ events: [] }),
      
      clearAlarmEventLogs: () => set((state) => ({
        events: state.events.filter(e => !e.type.startsWith('alarm_'))
      })),
      
      clearMedicationEventLogs: () => set((state) => ({
        events: state.events.filter(e => !e.type.startsWith('medication_') && !e.type.startsWith('low_stock_'))
      })),

      getEventsByType: (type) => {
        return get().events.filter(event => event.type === type);
      },
      
      getEventsByItem: (itemId) => {
        return get().events.filter(event => event.itemId === itemId);
      },
      
      getEventsByDateRange: (startDate, endDate) => {
        return get().events.filter(
          event => event.timestamp >= startDate && event.timestamp <= endDate
        );
      },
    }),
    {
      name: 'wake-me-up-event-logs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
