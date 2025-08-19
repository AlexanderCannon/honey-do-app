import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, households } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // User is not authenticated, go to login
        router.replace('/(auth)/login');
      } else if (households.length === 0) {
        // User is authenticated but has no households, go to family setup
        router.replace('/(auth)/family-setup');
      } else {
        // User is authenticated and has households, go to main app
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, households.length, isLoading]);

  // Show loading screen while checking auth state
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>🍯 Honey Do</Text>
      <ActivityIndicator size="large" color={colors.tint} style={styles.spinner} />
      <Text style={[styles.text, { color: colors.text }]}>Loading your household...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    opacity: 0.8,
  },
});
