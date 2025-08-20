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

interface DividerProps {
  text?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
  thickness?: number;
  margin?: number;
}

export function Divider({
  text,
  style,
  textStyle,
  color,
  thickness = 1,
  margin = 24,
}: DividerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const lineColor = color || colors.text + '30';
  const lineStyle = {
    height: thickness,
    backgroundColor: lineColor,
  };

  if (text) {
    return (
      <View style={[styles.container, { marginVertical: margin }, style]}>
        <View style={[styles.line, lineStyle]} />
        <Text style={[
          styles.text,
          { color: colors.text },
          textStyle
        ]}>
          {text}
        </Text>
        <View style={[styles.line, lineStyle]} />
      </View>
    );
  }

  return (
    <View style={[
      styles.simpleDivider,
      lineStyle,
      { marginVertical: margin },
      style
    ]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
  },
  text: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  simpleDivider: {
    width: '100%',
  },
});
