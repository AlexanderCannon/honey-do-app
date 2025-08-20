import { Button, Card, Header, Input, Screen } from '@/components/ui/common';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { householdService } from '@/services/householdService';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

export default function FamilySetupScreen() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { refreshUserData } = useAuth();
  const { showError } = useToast();

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      showError('Missing Name', 'Please enter a household name');
      return;
    }

    setIsLoading(true);
    try {
      const createResponse = await householdService.createHousehold({
        name: householdName.trim(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      });

      // Refresh user data to get the new household and auto-select it as active
      await refreshUserData();

      // Small delay to ensure state is fully updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Create household error:', error);
      showError(
        'Failed to Create Household',
        error.message || 'An error occurred while creating your household'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      showError('Missing Code', 'Please enter an invite code');
      return;
    }

    setIsLoading(true);
    try {
      await householdService.acceptInvite(inviteCode.trim());

      // Refresh user data to get the new household and auto-select it as active
      await refreshUserData();

      // Small delay to ensure state is fully updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      showError(
        'Failed to Join Household',
        error.message || 'Invalid invite code or invitation has expired'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderChooseMode = () => (
    <>
      <Header
        title="🏠 Set Up Your Household"
        subtitle="Choose how you'd like to get started with Honey Do"
      />

      <Card
        title="Create New Household"
        subtitle="Start fresh and invite family members to join"
        icon={<Text style={styles.optionIcon}>🏠</Text>}
        onPress={() => setMode('create')}
        variant="outlined"
        style={styles.optionCard}
      />

      <Card
        title="Join Existing Household"
        subtitle="Enter an invite code to join your family's household"
        icon={<Text style={styles.optionIcon}>🤝</Text>}
        onPress={() => setMode('join')}
        variant="outlined"
        style={styles.optionCard}
      />
    </>
  );

  const renderCreateMode = () => (
    <>
      <Header
        title="🏠 Create Your Household"
        subtitle="Give your household a name that represents your family"
      />

      <Input
        label="Household Name"
        value={householdName}
        onChangeText={setHouseholdName}
        placeholder="e.g., The Smith Family, Casa Rodriguez"
        autoCapitalize="words"
        autoCorrect={false}
        required
      />

      <Button
        title={isLoading ? 'Creating...' : 'Create Household'}
        onPress={handleCreateHousehold}
        disabled={isLoading}
        loading={isLoading}
        style={styles.actionButton}
      />

      <Button
        title="Back"
        onPress={() => setMode('choose')}
        variant="outline"
        disabled={isLoading}
      />
    </>
  );

  const renderJoinMode = () => (
    <>
      <Header
        title="🤝 Join a Household"
        subtitle="Enter the invite code shared by your family member"
      />

      <Input
        label="Invite Code"
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="Enter invite code"
        autoCapitalize="characters"
        autoCorrect={false}
        required
      />

      <Button
        title={isLoading ? 'Joining...' : 'Join Household'}
        onPress={handleJoinHousehold}
        disabled={isLoading}
        loading={isLoading}
        style={styles.actionButton}
      />

      <Button
        title="Back"
        onPress={() => setMode('choose')}
        variant="outline"
        disabled={isLoading}
      />
    </>
  );

  return (
    <Screen scrollable keyboardAvoiding centered>
      {mode === 'choose' && renderChooseMode()}
      {mode === 'create' && renderCreateMode()}
      {mode === 'join' && renderJoinMode()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  optionIcon: {
    fontSize: 48,
  },
  optionCard: {
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 16,
  },
});
