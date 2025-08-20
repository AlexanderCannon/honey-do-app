import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  centered?: boolean;
}

export function Screen({
  children,
  scrollable = false,
  keyboardAvoiding = true,
  padding = 'medium',
  style,
  contentContainerStyle,
  centered = false,
}: ScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    ...styles[padding],
    ...(centered && styles.centered),
    ...style,
  };

  const content = (
    <View style={containerStyle}>
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            centered && styles.scrollContentCentered,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  none: {
    padding: 0,
  },
  small: {
    padding: 12,
  },
  medium: {
    padding: 20,
  },
  large: {
    padding: 32,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentCentered: {
    justifyContent: 'center',
    minHeight: '100%',
  },
});
