import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { soundOptions, getSoundAsset } from '@/constants/sounds';
import Button from '../ui/Button';
import { X, Check, Play, Pause } from 'lucide-react-native';
import { Audio } from 'expo-av';

interface SoundPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (sound: string) => void;
  currentSound: string;
}

const SoundPicker: React.FC<SoundPickerProps> = ({
  isVisible,
  onClose,
  onSelect,
  currentSound,
}) => {
  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const [selectedSound, setSelectedSound] = useState(currentSound);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const styles = createStyles(colors);

  const stopCurrentSound = async () => {
    if (soundObject) {
      await soundObject.unloadAsync();
      setSoundObject(null);
      setPlayingSound(null);
    }
  };
  
  // This effect hook ensures that the sound is stopped and resources are freed when the modal is closed.
  useEffect(() => {
    if (!isVisible) {
      stopCurrentSound();
    }
  }, [isVisible]);


  const playSound = async (soundValue: string) => {
    if (playingSound === soundValue) {
      // If the currently playing sound is tapped again, stop it.
      await stopCurrentSound();
      return;
    }
  
    // Stop any currently playing sound before starting a new one.
    await stopCurrentSound();
  
    if (soundValue === 'default') {
      // Cannot preview default system sound
      return;
    }
  
    try {
      const asset = getSoundAsset(soundValue);
      if (!asset) {
        console.log('Sound asset not found for', soundValue);
        return;
      }
      
      const { sound } = await Audio.Sound.createAsync(
        asset,
        { shouldPlay: true, isLooping: false }
      );
      setSoundObject(sound);
      setPlayingSound(soundValue);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          // When the sound finishes playing, reset the playing state.
          setPlayingSound(null);
          setSoundObject(null);
        }
      });
    } catch (error) {
      console.error('Error playing sound', error);
      setPlayingSound(null);
    }
  };

  const renderItem = ({ item }: { item: typeof soundOptions[0] }) => {
    const isSelected = selectedSound === item.value;
    const isPlaying = playingSound === item.value;

    return (
      <TouchableOpacity
        style={[styles.itemContainer, isSelected && styles.itemSelected]}
        onPress={() => setSelectedSound(item.value)}
      >
        <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
          {t(item.name as any)}
        </Text>
        {item.value !== 'default' && (
          <TouchableOpacity style={styles.playButton} onPress={() => playSound(item.value)}>
            {isPlaying ? (
              <Pause size={20} color={isSelected ? 'white' : colors.primary} />
            ) : (
              <Play size={20} color={isSelected ? 'white' : colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const handleConfirm = () => {
    onSelect(selectedSound);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('selectSound')}</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
              <Check size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={soundOptions}
            renderItem={renderItem}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={styles.modalActions}>
            <Button
              title={t('confirm')}
              onPress={handleConfirm}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalButton: {
    padding: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.text,
  },
  itemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  playButton: {
    padding: theme.spacing.xs,
  },
  modalActions: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default SoundPicker;
