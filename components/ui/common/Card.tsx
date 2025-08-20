import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  children,
  onPress,
  variant = 'outlined',
  style,
  titleStyle,
  subtitleStyle,
  padding = 'medium',
  icon,
  headerActions,
}: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...styles[padding],
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.text + '20',
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: colors.background,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.tint + '10',
          borderWidth: 1,
          borderColor: colors.tint + '30',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.background,
        };
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {(title || subtitle || icon || headerActions) && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <View style={styles.headerText}>
              {title && (
                <Text style={[
                  styles.title,
                  { color: colors.text },
                  titleStyle
                ]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={[
                  styles.subtitle,
                  { color: colors.text + '80' },
                  subtitleStyle
                ]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {headerActions && (
            <View style={styles.headerActions}>
              {headerActions}
            </View>
          )}
        </View>
      )}
      
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    marginBottom: 16,
  },
  none: {
    padding: 0,
  },
  small: {
    padding: 12,
  },
  medium: {
    padding: 16,
  },
  large: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    marginLeft: 12,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    // Content styling is handled by children
  },
});
