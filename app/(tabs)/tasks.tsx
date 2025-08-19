import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TasksScreen() {
  const { user, activeHousehold, logout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>✅ Tasks & Chores</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Welcome, {user?.name}!
        </Text>
        {activeHousehold && (
          <Text style={[styles.householdName, { color: colors.tint }]}>
            {activeHousehold.household?.name || 'Your Household'}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.placeholder, { color: colors.text }]}>
          🚧 Task management coming soon!
        </Text>
        <Text style={[styles.description, { color: colors.text }]}>
          Here you&apos;ll be able to:
          {'\n'}• View assigned tasks
          {'\n'}• Complete task occurrences
          {'\n'}• Earn Nectar points
          {'\n'}• See your progress
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.tint }]}
        onPress={logout}
      >
        <Text style={[styles.logoutButtonText, { color: colors.tint }]}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  logoutButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
