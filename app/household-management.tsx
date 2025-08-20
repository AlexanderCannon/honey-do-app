import { Button, Card, Header, Screen } from '@/components/ui/common';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { showConfirmationAlert } from '@/lib/alertHelpers';
import { householdService } from '@/services/householdService';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

export default function HouseholdManagementScreen() {
  const { activeHousehold, households, leaveHousehold, deleteHousehold, setActiveHousehold, refreshUserData, isParent } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  // Helper function to get household name (simplified for actual API response)
  const getHouseholdName = (householdMembership: any): string => {
    return householdMembership?.name || 'Unknown';
  };

  // Helper function to get household ID (simplified for actual API response)  
  const getHouseholdId = (householdMembership: any): string | null => {
    return householdMembership?.id || null;
  };

  // Fetch member count for the active household
  const fetchMemberCount = useCallback(async () => {
    const householdId = getHouseholdId(activeHousehold);
    if (!householdId) return;

    try {
      const membersData = await householdService.getMembers(householdId);
      const count = membersData.data?.length || 0;
      setMemberCount(count);
    } catch (error) {
      console.error('Failed to fetch member count:', error);
      setMemberCount(null);
    }
  }, [activeHousehold]);

  // Load member count when component mounts or active household changes
  useEffect(() => {
    if (activeHousehold) {
      fetchMemberCount();
    } else {
      setMemberCount(null);
    }
  }, [activeHousehold, fetchMemberCount]);

  const handleLeaveHousehold = () => {
    if (!getHouseholdId(activeHousehold)) {
      showError('Cannot Leave', 'No active household to leave');
      return;
    }

    // Safety check: don't allow leaving if you're the only member
    if (memberCount === 1) {
      showError(
        'Cannot Leave Household',
        'You cannot leave this household because you are the only member. Please delete the household instead or invite other members first.'
      );
      return;
    }

    showConfirmationAlert(
      'Leave Household',
      `Are you sure you want to leave "${getHouseholdName(activeHousehold)}"?\n\nThis action cannot be undone. You'll need a new invite to rejoin.`,
      confirmLeaveHousehold,
      {
        confirmText: 'Leave Household',
        destructive: true,
      }
    );
  };

  const confirmLeaveHousehold = async () => {
    const householdId = getHouseholdId(activeHousehold);
    if (!householdId) return;

    setIsLoading(true);
    try {
      await leaveHousehold(householdId);
      showSuccess(
        'Left Household',
        'You have successfully left the household. You can now create a new household or join another one.'
      );
      router.replace('/(auth)/family-setup');
    } catch (error: any) {
      console.error('Leave household error:', error);
      showError(
        'Leave Failed',
        error.message || 'Failed to leave household. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHousehold = () => {
    if (!getHouseholdId(activeHousehold)) {
      showError('Cannot Delete', 'No active household to delete');
      return;
    }

    if (!isParent) {
      showError('Permission Denied', 'Only parents can delete households');
      return;
    }

    showConfirmationAlert(
      '🚨 Delete Household',
      `Are you sure you want to permanently delete "${getHouseholdName(activeHousehold)}"?\n\n⚠️ This will:\n• Delete ALL household data\n• Remove ALL members\n• Delete ALL tasks and events\n• This action CANNOT be undone`,
      confirmDeleteHousehold,
      {
        confirmText: 'Delete Forever',
        destructive: true,
      }
    );
  };

  const confirmDeleteHousehold = async () => {
    const householdId = getHouseholdId(activeHousehold);
    if (!householdId) return;

    setIsLoading(true);
    try {
      // First, verify the household exists before attempting deletion
      try {
        await householdService.getHousehold(householdId);
      } catch (getError: any) {
        console.error('Household verification failed:', getError);
        showError('Cannot Delete Household', 'Household not found. It may have already been deleted.');
        return;
      }

      // Now try to delete it
      await deleteHousehold(householdId);
      await handlePostDeletionFlow();
    } catch (error: any) {
      console.error('Delete household error:', error);

      // More detailed error handling
      let errorMessage = 'Failed to delete household';
      if (error?.code === '404') {
        errorMessage = 'Household not found. It may have already been deleted.';
      } else if (error?.code === '403') {
        errorMessage = 'You do not have permission to delete this household.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showError('Delete Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchHousehold = async (household: any) => {
    if (getHouseholdId(household) === getHouseholdId(activeHousehold)) {
      return; // Already active
    }

    try {
      setIsLoading(true);
      await setActiveHousehold(household);
      showSuccess('Household Switched', `Now using "${getHouseholdName(household)}"`);
      router.back();
    } catch (error: any) {
      console.error('Switch household error:', error);
      showError('Switch Failed', 'Failed to switch household');
    } finally {
      setIsLoading(false);
    }
  };

  const goToFamilySetup = () => {
    router.push('/(auth)/family-setup');
  };

  const goBack = () => {
    router.back();
  };

  const handlePostDeletionFlow = async () => {
    try {
      await refreshUserData();

      // Wait a moment for context to update, then check fresh data
      await new Promise(resolve => setTimeout(resolve, 200));

      // Determine if there are remaining households
      const originalCount = households.length;
      const shouldHaveRemaining = originalCount > 1;

      if (shouldHaveRemaining) {
        showSuccess(
          'Household Removed',
          'You have been switched to your remaining household.'
        );
        router.back();
      } else {
        showSuccess(
          'Household Removed',
          'You can now create a new household or join another one.'
        );
        router.replace('/(auth)/family-setup');
      }
    } catch (error) {
      console.error('Error refreshing data after deletion:', error);
      // Fallback to family setup if refresh fails
      router.replace('/(auth)/family-setup');
    }
  };

  return (
    <Screen scrollable centered>
      <Header
        title="🏠 Household Management"
        subtitle="Manage your household membership"
      />

      {activeHousehold ? (
        <>
          <Card
            title="Current Household"
            subtitle={getHouseholdName(activeHousehold)}
            icon={<Text style={styles.householdIcon}>🏠</Text>}
            style={styles.currentHousehold}
          >
            <Text style={styles.roleText}>
              Your role: {activeHousehold.role === 'parent' ? '👑 Parent' : '👤 Member'}
            </Text>
            <Text style={styles.memberText}>
              You are a member of {households.length} household{households.length !== 1 ? 's' : ''}
            </Text>
            {memberCount !== null && (
              <Text style={styles.memberCountText}>
                👥 This household has {memberCount} member{memberCount !== 1 ? 's' : ''}
              </Text>
            )}
          </Card>

          {households.length > 1 && (
            <Card
              title="🔄 Switch Household"
              subtitle={`You belong to ${households.length} households`}
              style={styles.householdListCard}
            >
              {households.map((household, index) => (
                <Card
                  key={getHouseholdId(household)}
                  title={getHouseholdName(household)}
                  subtitle={`Role: ${household.role} • ${household.status}`}
                  icon={<Text style={styles.householdListIcon}>
                    {getHouseholdId(household) === getHouseholdId(activeHousehold) ? '✅' : '🏠'}
                  </Text>}
                  onPress={getHouseholdId(household) === getHouseholdId(activeHousehold)
                    ? undefined
                    : () => handleSwitchHousehold(household)
                  }
                  variant={getHouseholdId(household) === getHouseholdId(activeHousehold) ? 'filled' : 'outlined'}
                  style={styles.householdListItem}
                />
              ))}
            </Card>
          )}

          <Card
            title="Create New Household"
            subtitle="Start a fresh household for your family"
            icon={<Text style={styles.actionIcon}>➕</Text>}
            onPress={goToFamilySetup}
            variant="outlined"
            style={styles.actionCard}
          />

          {memberCount !== null && memberCount > 1 && (
            <Card
              title="Leave Household"
              subtitle="Remove yourself from the current household"
              icon={<Text style={styles.actionIcon}>🚪</Text>}
              onPress={handleLeaveHousehold}
              variant="outlined"
              style={styles.dangerCard}
            />
          )}

          {memberCount !== null && memberCount === 1 && (
            <Card
              title="Cannot Leave Household"
              subtitle="You're the only member - use delete instead"
              icon={<Text style={styles.actionIcon}>⚠️</Text>}
              variant="outlined"
              style={styles.warningCard}
            >
              <Text style={styles.warningText}>
                Since you&apos;re the only member of this household, you cannot leave it.
                Use &quot;Delete Household&quot; to remove the entire household, or invite others to join first.
              </Text>
            </Card>
          )}

          {isParent && (
            <Card
              title="Delete Household"
              subtitle="Permanently delete this entire household (PARENT ONLY)"
              icon={<Text style={styles.actionIcon}>🗑️</Text>}
              onPress={handleDeleteHousehold}
              variant="outlined"
              style={styles.deleteCard}
            />
          )}
        </>
      ) : (
        <>
          <Card
            title="No Active Household"
            subtitle="You're not currently part of any household"
            icon={<Text style={styles.actionIcon}>⚠️</Text>}
            style={styles.warningCard}
          >
            <Text style={styles.warningText}>
              To use Honey Do, you need to either create a new household or join an existing one.
            </Text>
          </Card>

          <Card
            title="Create New Household"
            subtitle="Start a fresh household for your family"
            icon={<Text style={styles.actionIcon}>🏠</Text>}
            onPress={goToFamilySetup}
            style={styles.actionCard}
          />

          <Card
            title="Join Existing Household"
            subtitle="Use an invite code to join a family"
            icon={<Text style={styles.actionIcon}>🤝</Text>}
            onPress={goToFamilySetup}
            variant="outlined"
            style={styles.actionCard}
          />
        </>
      )}

      <Button
        title="Back to Profile"
        onPress={goBack}
        variant="ghost"
        disabled={isLoading}
        style={styles.backButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  householdIcon: {
    fontSize: 32,
  },
  actionIcon: {
    fontSize: 24,
  },
  currentHousehold: {
    marginBottom: 24,
  },
  actionCard: {
    marginBottom: 16,
  },
  dangerCard: {
    marginBottom: 16,
    borderColor: '#ef4444',
  },
  deleteCard: {
    marginBottom: 24,
    borderColor: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  warningCard: {
    marginBottom: 24,
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberText: {
    fontSize: 14,
    opacity: 0.8,
  },
  memberCountText: {
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginTop: 24,
  },
  householdListCard: {
    marginBottom: 16,
  },
  householdListItem: {
    marginBottom: 8,
    marginTop: 8,
  },
  householdListIcon: {
    fontSize: 20,
  },
  activeHousehold: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
  },
});
