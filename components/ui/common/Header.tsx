import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  centered?: boolean;
  spacing?: 'small' | 'medium' | 'large';
}

export function Header({
  title,
  subtitle,
  icon,
  style,
  titleStyle,
  subtitleStyle,
  centered = true,
  spacing = 'medium',
}: HeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[
      styles.container,
      styles[spacing],
      centered && styles.centered,
      style
    ]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      
      <Text style={[
        styles.title,
        { color: colors.text },
        titleStyle
      ]}>
        {title}
      </Text>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
  },
  centered: {
    alignItems: 'center',
    textAlign: 'center',
  },
  small: {
    marginBottom: 20,
  },
  medium: {
    marginBottom: 30,
  },
  large: {
    marginBottom: 40,
  },
  icon: {
    marginBottom: 12,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
