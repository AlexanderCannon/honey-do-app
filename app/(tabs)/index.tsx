import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { user, activeHousehold, isParent } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          🍯 Welcome to Honey Do!
        </Text>
        <Text style={[styles.userName, { color: colors.tint }]}>
          Hello, {user?.name}!
        </Text>
        {activeHousehold && (
          <Text style={[styles.householdName, { color: colors.text }]}>
            {activeHousehold.household?.name}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.text + '20' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🎯 Your Quest Begins!</Text>
          <Text style={[styles.cardDescription, { color: colors.text }]}>
            Turn household chores into fun family quests. Earn Nectar points, level up, and compete with your family!
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.text + '20' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isParent ? '👑 Parent Dashboard' : '👤 Member Dashboard'}
          </Text>
          <Text style={[styles.cardDescription, { color: colors.text }]}>
            {isParent 
              ? 'As a parent, you can create tasks, manage the household, and invite family members.'
              : 'Complete your assigned tasks to earn Nectar points and climb the family leaderboard!'
            }
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.text + '20' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🚧 Coming Soon</Text>
          <Text style={[styles.cardDescription, { color: colors.text }]}>
            We&apos;re building amazing features:
            {'\n'}• Task management with recurring chores
            {'\n'}• Nectar points and leveling system
            {'\n'}• Family leaderboards and achievements
            {'\n'}• Calendar integration
            {'\n'}• Push notifications
            {'\n'}• And much more!
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
          <Text style={[styles.cardTitle, { color: colors.tint }]}>🔗 API Connected!</Text>
          <Text style={[styles.cardDescription, { color: colors.text }]}>
            Your app is successfully connected to the Phoenix API at localhost:4000. 
            Authentication, households, and user management are ready to go!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  householdName: {
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.9,
  },
});
