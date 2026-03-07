
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { ChevronDown, Check } from 'lucide-react-native';
import Card from './Card';
import Button from './Button';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option...',
  style,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const styles = createStyles(colors);

  const selectedOption = options.find((option) => option.value === value);

  const renderItem = ({ item }: { item: SelectOption }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
      }}
    >
      <Text style={styles.optionText}>{item.label}</Text>
      {item.value === value && <Check size={20} color={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.selectButton, style]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectButtonText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <Card style={styles.modalContent} variant="elevated">
            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={(item) => item.value}
            />
          </Card>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 44,
    },
    selectButtonText: {
      fontSize: theme.typography.fontSizes.md,
      color: colors.text,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '80%',
      maxHeight: '60%',
      borderRadius: theme.borderRadius.lg,
    },
    optionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionText: {
      fontSize: theme.typography.fontSizes.md,
      color: colors.text,
    },
  });

export default Select;
