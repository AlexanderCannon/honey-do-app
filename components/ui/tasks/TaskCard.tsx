import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Task, TaskOccurrence } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface TaskCardProps {
  task?: Task;
  taskOccurrence?: TaskOccurrence;
  onPress?: () => void;
  onComplete?: () => void;
  onReopen?: () => void;
  showCompleteButton?: boolean;
  style?: any;
}

export function TaskCard({
  task,
  taskOccurrence,
  onPress,
  onComplete,
  onReopen,
  showCompleteButton = true,
  style,
}: TaskCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Use task from taskOccurrence if available, otherwise use direct task
  const displayTask = taskOccurrence?.task || task;
  const isCompleted = taskOccurrence?.status === 'completed';
  const isOverdue = taskOccurrence?.status === 'overdue';
  const isPending = taskOccurrence?.status === 'pending';

  if (!displayTask) {
    return null;
  }

  const handleComplete = () => {
    if (isCompleted && onReopen) {
      onReopen();
    } else if (!isCompleted && onComplete) {
      onComplete();
    }
  };

  const getStatusColor = () => {
    if (isCompleted) return '#10b981'; // green
    if (isOverdue) return '#ef4444'; // red
    if (isPending) return '#f59e0b'; // amber
    return colors.text; // default
  };

  const getStatusText = () => {
    if (isCompleted) return 'Completed';
    if (isOverdue) return 'Overdue';
    if (isPending) return 'Pending';
    if (displayTask.status === 'paused') return 'Paused';
    return 'Active';
  };

  const formatDueTime = () => {
    if (taskOccurrence?.due_at) {
      const dueDate = new Date(taskOccurrence.due_at);
      const today = new Date();
      const isToday = dueDate.toDateString() === today.toDateString();
      const isTomorrow = dueDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
      
      const timeStr = dueDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
      if (isToday) return `Today at ${timeStr}`;
      if (isTomorrow) return `Tomorrow at ${timeStr}`;
      
      return dueDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    if (displayTask.due_time) {
      return `Due at ${displayTask.due_time}`;
    }
    
    return null;
  };

  const assignedUserName = taskOccurrence?.assigned_user?.name || displayTask.assigned_user?.name;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.text + '20',
        },
        isCompleted && styles.completedCard,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isCompleted && styles.completedTitle,
            ]}
            numberOfLines={2}
          >
            {displayTask.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {displayTask.description && (
          <Text
            style={[
              styles.description,
              { color: colors.text + '80' },
              isCompleted && styles.completedText,
            ]}
            numberOfLines={2}
          >
            {displayTask.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.details}>
            {assignedUserName && (
              <Text style={[styles.assignedTo, { color: colors.text + '60' }]}>
                👤 {assignedUserName}
              </Text>
            )}
            {formatDueTime() && (
              <Text style={[styles.dueTime, { color: getStatusColor() }]}>
                🕒 {formatDueTime()}
              </Text>
            )}
          </View>

          {showCompleteButton && taskOccurrence && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isCompleted ? colors.text + '20' : '#10b981',
                },
              ]}
              onPress={handleComplete}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { color: isCompleted ? colors.text : '#ffffff' },
                ]}
              >
                {isCompleted ? 'Undo' : '✓'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  completedCard: {
    opacity: 0.7,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  assignedTo: {
    fontSize: 12,
    marginBottom: 4,
  },
  dueTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
