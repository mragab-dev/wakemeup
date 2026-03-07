
import React from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { X } from 'lucide-react-native';
import Card from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.cardContainer}>
          <Card style={styles.card} variant="elevated">
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.content}>{children}</ScrollView>
          </Card>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardContainer: {
        width: '95%',
        maxHeight: '85%',
        borderRadius: theme.borderRadius.lg,
    },
    card: {
      padding: 0,
      width: '100%',
      maxHeight: '100%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    content: {
      padding: theme.spacing.md,
    },
  });

export default Modal;
