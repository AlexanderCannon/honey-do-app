import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, activeHousehold, households, logout, setActiveHousehold } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleSwitchHousehold = () => {
    if (households.length <= 1) return;

    const householdOptions = households.map((h, index) => ({
      text: h.household?.name || `Household ${index + 1}`,
      onPress: () => setActiveHousehold(h),
    }));

    Alert.alert(
      'Switch Household',
      'Select a household:',
      [
        ...householdOptions,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>👤 Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <View style={[styles.profileItem, { borderColor: colors.text + '20' }]}>
            <Text style={[styles.profileLabel, { color: colors.text }]}>Name</Text>
            <Text style={[styles.profileValue, { color: colors.text }]}>
              {user?.name || 'Unknown'}
            </Text>
          </View>
          <View style={[styles.profileItem, { borderColor: colors.text + '20' }]}>
            <Text style={[styles.profileLabel, { color: colors.text }]}>Email</Text>
            <Text style={[styles.profileValue, { color: colors.text }]}>
              {user?.email || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Households</Text>
          <View style={[styles.profileItem, { borderColor: colors.text + '20' }]}>
            <Text style={[styles.profileLabel, { color: colors.text }]}>Active Household</Text>
            <Text style={[styles.profileValue, { color: colors.tint }]}>
              {activeHousehold?.household?.name || 'None'}
            </Text>
          </View>
          {households.length > 1 && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.tint }]}
              onPress={handleSwitchHousehold}
            >
              <Text style={[styles.actionButtonText, { color: colors.tint }]}>
                Switch Household ({households.length} available)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.profileSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.placeholder, { color: colors.text }]}>
            🚧 Profile settings coming soon!
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>
            Coming features:
            {'\n'}• Update profile photo
            {'\n'}• Change display name
            {'\n'}• Notification preferences
            {'\n'}• Account settings
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.tint + '20', borderColor: colors.tint }]}
        onPress={handleLogout}
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
    marginBottom: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileValue: {
    fontSize: 16,
  },
  actionButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
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
