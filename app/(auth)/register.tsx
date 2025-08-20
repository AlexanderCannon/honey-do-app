import { Button, Divider, Header, Input, Screen } from '@/components/ui/common';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { showError } = useToast();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      showError('Missing Fields', 'Please fill in all fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      showError('Password Too Short', 'Password must be at least 6 characters long');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      // Navigation will be handled automatically by the auth state change
    } catch (error: any) {
      console.error('Registration error:', error);
      showError(
        'Registration Failed',
        error.message || 'An error occurred during registration'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <Header
        title="🍯 Join Honey Do"
        subtitle="Create your account and start your household quest!"
      />

      <Input
        label="Full Name"
        value={formData.name}
        onChangeText={(value) => updateFormData('name', value)}
        placeholder="Enter your full name"
        autoCapitalize="words"
        autoCorrect={false}
        required
      />

      <Input
        label="Email"
        value={formData.email}
        onChangeText={(value) => updateFormData('email', value)}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        required
      />

      <Input
        label="Password"
        value={formData.password}
        onChangeText={(value) => updateFormData('password', value)}
        placeholder="Create a password (min 6 characters)"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        required
      />

      <Input
        label="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(value) => updateFormData('confirmPassword', value)}
        placeholder="Confirm your password"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        required
      />

      <Button
        title={isLoading ? 'Creating Account...' : 'Create Account'}
        onPress={handleRegister}
        disabled={isLoading}
        loading={isLoading}
        style={{ marginTop: 8, marginBottom: 8 }}
      />

      <Divider text="or" />

      <Button
        title="Already have an account? Sign In"
        onPress={goToLogin}
        variant="outline"
        disabled={isLoading}
        style={{ marginBottom: 40 }}
      />

      <Text style={styles.footerText}>
        Transform chores into achievements with family gamification! 🎯
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
