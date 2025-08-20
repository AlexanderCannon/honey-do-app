import { Button, Divider, Header, Input, Screen } from '@/components/ui/common';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const testApiConnection = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4000/api/v1/healthz');
      const data = await response.text();
      console.log('Health check response:', data);
      Alert.alert('API Test', `API Response: ${data}`);
    } catch (error: any) {
      console.error('API test failed:', error);
      Alert.alert('API Test Failed', 'Could not connect to localhost:4000');
    } finally {
      setIsLoading(false);
    }
  };

  const testMeEndpoint = async () => {
    try {
      setIsLoading(true);
      // First login to get token
      const loginResponse = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const loginData = await loginResponse.json();
      console.log('Login response for /me test:', loginData);

      if (loginData.token) {
        // Now test /me endpoint
        const meResponse = await fetch('http://localhost:4000/api/v1/me', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Me response status:', meResponse.status);
        const meData = await meResponse.text();
        console.log('Me response data:', meData);

        Alert.alert(
          'Me Endpoint Test',
          `Status: ${meResponse.status}\nResponse: ${meData.substring(0, 200)}...`
        );
      }
    } catch (error: any) {
      console.error('Me endpoint test failed:', error);
      Alert.alert('Me Endpoint Test Failed', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      // Navigation will be handled automatically by the auth state change
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        `${error.message || 'An error occurred during login'}\n\nCode: ${error.code || 'unknown'}`
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

      <Button
        title="Test API Connection"
        onPress={testApiConnection}
        variant="ghost"
        size="small"
        disabled={isLoading}
        style={{ marginBottom: 8 }}
      />

      <Button
        title="Test /me Endpoint"
        onPress={testMeEndpoint}
        variant="ghost"
        size="small"
        disabled={isLoading}
        style={{ marginBottom: 40 }}
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
