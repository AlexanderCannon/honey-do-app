import { Button, Card, Header, Screen } from '@/components/ui/common';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { showConfirmationAlert } from '@/lib/alertHelpers';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

export default function ProfileScreen() {
  const { user, activeHousehold, households, logout, getActiveHouseholdName } = useAuth();
  const { showSuccess } = useToast();

  const handleLogout = () => {
    showConfirmationAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      logout,
      { confirmText: 'Sign Out', destructive: true }
    );
  };

  const handleSwitchHousehold = () => {
    if (households.length <= 1) return;
    
    // Redirect to household management where switching is now handled with better UX
    showSuccess('Switch Households', 'Use Household Management to switch between households');
    router.push('/household-management');
  };

  const goToHouseholdManagement = () => {
    router.push('/household-management');
  };

  return (
    <Screen scrollable>
      <Header 
        title="👤 Profile"
        subtitle={`Welcome, ${user?.name || 'User'}!`}
      />

      <Card
        title="Account Information"
        icon={<Text style={styles.sectionIcon}>📋</Text>}
        style={styles.sectionCard}
      >
        <Text style={styles.infoLabel}>Name</Text>
        <Text style={styles.infoValue}>{user?.name || 'Unknown'}</Text>
        
        <Text style={[styles.infoLabel, styles.labelSpacing]}>Email</Text>
        <Text style={styles.infoValue}>{user?.email || 'Unknown'}</Text>
      </Card>

      <Card
        title="Household Status"
        icon={<Text style={styles.sectionIcon}>🏠</Text>}
        style={styles.sectionCard}
      >
        <Text style={styles.infoLabel}>Active Household</Text>
        <Text style={[styles.infoValue, activeHousehold ? styles.activeHousehold : styles.noHousehold]}>
          {getActiveHouseholdName()}
        </Text>
        
        {activeHousehold?.role && (
          <>
            <Text style={[styles.infoLabel, styles.labelSpacing]}>Your Role</Text>
            <Text style={styles.infoValue}>
              {activeHousehold.role === 'parent' ? '👑 Parent' : '👤 Member'}
            </Text>
          </>
        )}
        
        <Text style={[styles.infoLabel, styles.labelSpacing]}>Total Households</Text>
        <Text style={styles.infoValue}>
          {households.length} household{households.length !== 1 ? 's' : ''}
        </Text>
      </Card>

      {households.length > 1 && (
        <Button
          title={`Switch Household (${households.length} available)`}
          onPress={handleSwitchHousehold}
          variant="outline"
          style={styles.actionButton}
        />
      )}

      <Button
        title={activeHousehold ? "Manage Household" : "⚠️ Fix Household Setup"}
        onPress={goToHouseholdManagement}
        variant={activeHousehold ? "outline" : "primary"}
        style={styles.actionButton}
      />

      <Card
        title="Settings"
        icon={<Text style={styles.sectionIcon}>⚙️</Text>}
        style={styles.sectionCard}
      >
        <Text style={styles.comingSoonText}>
          🚧 Profile settings coming soon!
        </Text>
        <Text style={styles.featureList}>
          Coming features:{'\n'}• Update profile photo{'\n'}• Change display name{'\n'}• Notification preferences{'\n'}• Account settings
        </Text>
      </Card>

      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="ghost"
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionIcon: {
    fontSize: 24,
  },
  sectionCard: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 8,
  },
  labelSpacing: {
    marginTop: 8,
  },
  activeHousehold: {
    color: '#10b981',
    fontWeight: '600',
  },
  noHousehold: {
    color: '#ef4444',
    fontWeight: '600',
  },
  actionButton: {
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureList: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 80,
  },
});