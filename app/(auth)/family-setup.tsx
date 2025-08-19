import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { householdService } from '@/services/householdService';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FamilySetupScreen() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { refreshUserData } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating household with name:', householdName.trim());
      const createResponse = await householdService.createHousehold({
        name: householdName.trim(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      });
      console.log('Household created successfully:', createResponse);
      
      // Refresh user data to get the new household
      console.log('Refreshing user data after household creation...');
      await refreshUserData();
      console.log('User data refreshed, navigating to main app...');
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Create household error:', error);
      Alert.alert(
        'Failed to Create Household',
        error.message || 'An error occurred while creating your household'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setIsLoading(true);
    try {
      await householdService.acceptInvite(inviteCode.trim());
      
      // Refresh user data to get the new household
      await refreshUserData();
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Join household error:', error);
      Alert.alert(
        'Failed to Join Household',
        error.message || 'Invalid invite code or invitation has expired'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderChooseMode = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🏠 Set Up Your Household</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Choose how you'd like to get started with Honey Do
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, { borderColor: colors.tint }]}
          onPress={() => setMode('create')}
        >
          <Text style={[styles.optionIcon]}>🏠</Text>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Create New Household</Text>
          <Text style={[styles.optionDescription, { color: colors.text }]}>
            Start fresh and invite family members to join
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, { borderColor: colors.tint }]}
          onPress={() => setMode('join')}
        >
          <Text style={[styles.optionIcon]}>🤝</Text>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Join Existing Household</Text>
          <Text style={[styles.optionDescription, { color: colors.text }]}>
            Enter an invite code to join your family's household
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateMode = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🏠 Create Your Household</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Give your household a name that represents your family
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Household Name</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              borderColor: colors.text + '30',
              color: colors.text 
            }]}
            value={householdName}
            onChangeText={setHouseholdName}
            placeholder="e.g., The Smith Family, Casa Rodriguez"
            placeholderTextColor={colors.text + '60'}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={handleCreateHousehold}
          disabled={isLoading}
        >
          <Text style={styles.actionButtonText}>
            {isLoading ? 'Creating...' : 'Create Household'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.text + '30' }]}
          onPress={() => setMode('choose')}
          disabled={isLoading}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderJoinMode = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🤝 Join a Household</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Enter the invite code shared by your family member
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Invite Code</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              borderColor: colors.text + '30',
              color: colors.text 
            }]}
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="Enter invite code"
            placeholderTextColor={colors.text + '60'}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={handleJoinHousehold}
          disabled={isLoading}
        >
          <Text style={styles.actionButtonText}>
            {isLoading ? 'Joining...' : 'Join Household'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.text + '30' }]}
          onPress={() => setMode('choose')}
          disabled={isLoading}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mode === 'choose' && renderChooseMode()}
        {mode === 'create' && renderCreateMode()}
        {mode === 'join' && renderJoinMode()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    opacity: 0.8,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
