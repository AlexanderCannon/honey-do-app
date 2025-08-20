import { Button, Header, Screen } from '@/components/ui/common';
import { TaskCard, TaskFilters, TaskFilterType } from '@/components/ui/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { TaskOccurrence } from '@/types';
import { taskService } from '@/services/taskService';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

export default function TasksScreen() {
  const { activeHousehold, getActiveHouseholdName, user } = useAuth();
  const { showError } = useToast();

  const [taskOccurrences, setTaskOccurrences] = useState<TaskOccurrence[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<TaskFilterType>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const householdId = activeHousehold?.id;
  const isParent = activeHousehold?.role === 'parent';

  const loadTaskOccurrences = useCallback(async (showLoading = true) => {
    if (!householdId) return;

    if (showLoading) setIsLoading(true);

    try {
      let response;
      
      switch (selectedFilter) {
        case 'my-tasks':
          response = await taskService.getMyTaskOccurrences(householdId, user?.id || '', 'pending');
          break;
        case 'pending':
          response = await taskService.getTaskOccurrences(householdId, { status: 'pending' });
          break;
        case 'completed':
          response = await taskService.getTaskOccurrences(householdId, { status: 'completed' });
          break;
        case 'overdue':
          response = await taskService.getTaskOccurrences(householdId, { status: 'overdue' });
          break;
        case 'all':
        default:
          response = await taskService.getTaskOccurrences(householdId);
          break;
      }
      
      const taskData = response.data;
      setTaskOccurrences(Array.isArray(taskData) ? taskData : []);
    } catch (error: any) {
      console.error('Failed to load task occurrences:', error);
      setTaskOccurrences([]); // Set empty array on error
      showError('Load Failed', 'Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [householdId, selectedFilter, user?.id, showError]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTaskOccurrences(false);
  }, [loadTaskOccurrences]);

  const handleFilterChange = useCallback((filter: TaskFilterType) => {
    setSelectedFilter(filter);
  }, []);

  const handleCompleteTask = useCallback(async (occurrenceId: string) => {
    try {
      await taskService.completeTaskOccurrence(occurrenceId);
      // Refresh the list to show updated state
      loadTaskOccurrences();
    } catch (error: any) {
      console.error('Failed to complete task:', error);
      showError('Task Error', 'Failed to complete task. Please try again.');
    }
  }, [showError, loadTaskOccurrences]);

  const handleReopenTask = useCallback(async (occurrenceId: string) => {
    try {
      await taskService.reopenTaskOccurrence(occurrenceId);
      // Refresh the list to show updated state
      loadTaskOccurrences();
    } catch (error: any) {
      console.error('Failed to reopen task:', error);
      showError('Task Error', 'Failed to reopen task. Please try again.');
    }
  }, [showError, loadTaskOccurrences]);

  const handleCreateTask = useCallback(() => {
    if (!isParent) {
      showError('Permission Denied', 'Only parents can create tasks.');
      return;
    }
    // Navigate to create task screen
    // TODO: Implement navigation when create-task screen is ready
    console.log('🚧 Navigate to create task screen');
  }, [isParent, showError]);

  useEffect(() => {
    loadTaskOccurrences();
  }, [loadTaskOccurrences]);

  if (!activeHousehold) {
    return (
      <Screen style={styles.container}>
        <Header title="Tasks" />
        <View style={styles.noHousehold}>
          <Text style={styles.noHouseholdText}>
            No active household selected.
          </Text>
          <Text style={styles.noHouseholdSubtext}>
            Please create or join a household to view tasks.
          </Text>
        </View>
      </Screen>
    );
  }

  const renderTaskOccurrence = ({ item }: { item: TaskOccurrence }) => (
    <TaskCard
      taskOccurrence={item}
      onComplete={() => handleCompleteTask(item.id)}
      onReopen={() => handleReopenTask(item.id)}
      showCompleteButton={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        No Tasks Yet
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {selectedFilter === 'my-tasks' 
          ? "You don't have any assigned tasks yet."
          : `No ${selectedFilter} tasks found.`}
        {'\n\n'}
        {isParent 
          ? "Create your first task to get started with organizing your household!"
          : "Tasks will appear here when they're assigned to you."}
      </Text>
      {isParent && (
        <Button
          title="+ Create First Task"
          onPress={handleCreateTask}
          variant="outline"
          style={styles.createButton}
        />
      )}
    </View>
  );

  return (
    <Screen style={styles.container}>
      <View style={styles.headerContainer}>
        <Header
          title="Tasks"
          subtitle={getActiveHouseholdName()}
          style={styles.header}
        />
        {isParent && (
          <Button
            title="+ Add"
            onPress={handleCreateTask}
            variant="outline"
            style={styles.addButton}
          />
        )}
      </View>

      <TaskFilters
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
        showMyTasks={true}
      />

      <FlatList
        data={taskOccurrences}
        renderItem={renderTaskOccurrence}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    flex: 1,
  },
  noHousehold: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noHouseholdText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noHouseholdSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding for bottom tab
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  createButton: {
    marginTop: 16,
  },
});
