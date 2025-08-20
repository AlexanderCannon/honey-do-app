import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { TaskOccurrence } from '@/types';
import { TaskCard } from './TaskCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TaskFeedProps {
  taskOccurrences: TaskOccurrence[];
  onCompleteTask: (occurrenceId: string) => void;
  onReopenTask: (occurrenceId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface Section {
  title: string;
  data: TaskOccurrence[];
  emoji: string;
}

export function TaskFeed({ 
  taskOccurrences, 
  onCompleteTask, 
  onReopenTask, 
  onRefresh,
  isRefreshing = false 
}: TaskFeedProps) {
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // The backend already organizes tasks in the correct order and sections
  // We just need to display them with visual section headers
  // For now, let's just show all tasks in a single section to debug
  const sections: Section[] = taskOccurrences.length > 0 ? [{
    title: `All Tasks (${taskOccurrences.length})`,
    data: taskOccurrences,
    emoji: "📋"
  }] : [];

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={styles.sectionEmoji}>{section.emoji}</Text>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {section.title}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.text + '80' }]}>
        {section.data.length}
      </Text>
    </View>
  );

  const renderTask = ({ item }: { item: TaskOccurrence }) => (
    <TaskCard
      taskOccurrence={item}
      onComplete={() => onCompleteTask(item.id)}
      onReopen={() => onReopenTask(item.id)}
    />
  );

  const renderSection = ({ item: section }: { item: Section }) => (
    <View style={styles.section}>
      {renderSectionHeader({ section })}
      <FlatList
        data={section.data}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sectionContent}
      />
    </View>
  );

  if (sections.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
          No tasks found. Create your first task to get started!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      renderItem={renderSection}
      keyExtractor={(section) => section.title}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? (
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      ) : undefined}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContent: {
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
