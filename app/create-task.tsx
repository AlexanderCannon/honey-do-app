import { Header, Screen } from '@/components/ui/common';
import { TaskForm } from '@/components/ui/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { taskService } from '@/services/taskService';
import { CreateTaskRequest } from '@/types';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

export default function CreateTaskScreen() {
  const { activeHousehold } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const householdId = activeHousehold?.id;

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    if (!householdId) {
      showError('No Household', 'Please select a household first. If you just registered, please complete the family setup process.');
      return;
    }

    setIsLoading(true);
    try {
      const createdTask = await taskService.createTask(householdId, taskData);
      showSuccess('Task Created', `"${createdTask.title}" has been created successfully!`);
      router.back(); // Return to tasks screen
    } catch (error: any) {
      console.error('Failed to create task:', error);
      showError(
        'Create Failed',
        error.message || 'Failed to create task. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Screen style={styles.container}>
      <Header
        title="Create Task"
      />

      <TaskForm
        onSubmit={handleCreateTask}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitLabel="Create Task"
        style={styles.form}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
});
