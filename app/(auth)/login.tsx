import { Button, Divider, Header, Input, Screen } from '@/components/ui/common';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();



  const handleLogin = async () => {
    if (!email || !password) {
      showError('Missing Fields', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      // Let the index screen handle navigation based on auth state
      router.replace('/');
    } catch (error: any) {
      // Show generic error message for security (don't reveal if email exists)
      showError(
        'Login Failed',
        'Your email or password was incorrect. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <Header
        title="🍯 Honey Do"
        subtitle="Welcome back! Sign in to your account"
      />

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        required
      />

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        required
      />

      <Button
        title={isLoading ? 'Signing In...' : 'Sign In'}
        onPress={handleLogin}
        disabled={isLoading}
        loading={isLoading}
        style={{ marginTop: 8, marginBottom: 8 }}
      />

      <Divider text="or" />

      <Button
        title="Create New Account"
        onPress={goToRegister}
        variant="outline"
        disabled={isLoading}
        style={{ marginBottom: 16 }}
      />

      <Text style={styles.footerText}>
        Turn household chores into fun family quests! 🎮
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
