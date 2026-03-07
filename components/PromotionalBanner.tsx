
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { Megaphone } from 'lucide-react-native';

interface PromotionalBannerProps {
  onPress: () => void;
}

const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Megaphone size={20} color={colors.primary} />
      <Text style={styles.text}>
        Special Offer! Tap here to learn more about our premium features.
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    height: 50,
    borderTopWidth: 1,
    borderTopColor: colors.primary + '40',
  },
  text: {
    marginLeft: theme.spacing.sm,
    color: colors.primary,
    fontWeight: '500',
    fontSize: theme.typography.fontSizes.sm,
    flex: 1,
  },
});

export default PromotionalBanner;
