import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HouseholdScreen() {
  const { activeHousehold, isParent } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>👨‍👩‍👧‍👦 Family</Text>
        {activeHousehold && (
          <Text style={[styles.householdName, { color: colors.tint }]}>
            {activeHousehold.household?.name || 'Your Household'}
          </Text>
        )}
        <Text style={[styles.role, { color: colors.text }]}>
          Role: {isParent ? '👑 Parent' : '👤 Member'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.placeholder, { color: colors.text }]}>
          🚧 Household management coming soon!
        </Text>
        <Text style={[styles.description, { color: colors.text }]}>
          Here you&apos;ll be able to:
          {'\n'}• View family members
          {'\n'}• Manage roles and permissions
          {'\n'}• Create invite codes
          {'\n'}• See household stats
          {isParent ? '\n• Admin household settings' : ''}
        </Text>
      </View>
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
  householdName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  role: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.8,
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
});
