import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type TaskFilterType = 'all' | 'pending' | 'completed' | 'overdue' | 'my-tasks';

export interface TaskFiltersProps {
  selectedFilter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
  showMyTasks?: boolean;
  style?: any;
}

export function TaskFilters({
  selectedFilter,
  onFilterChange,
  showMyTasks = true,
  style,
}: TaskFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const filters: { key: TaskFilterType; label: string; emoji: string }[] = [
    { key: 'all', label: 'All Tasks', emoji: '📋' },
    { key: 'pending', label: 'Pending', emoji: '⏳' },
    { key: 'completed', label: 'Completed', emoji: '✅' },
    { key: 'overdue', label: 'Overdue', emoji: '🚨' },
  ];

  if (showMyTasks) {
    filters.splice(1, 0, { key: 'my-tasks', label: 'My Tasks', emoji: '👤' });
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isSelected ? colors.tint : colors.background,
                  borderColor: isSelected ? colors.tint : colors.text + '30',
                },
              ]}
              onPress={() => onFilterChange(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterEmoji}>{filter.emoji}</Text>
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isSelected ? '#ffffff' : colors.text,
                  },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 40,
  },
  filterEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
