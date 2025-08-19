import { apiClient } from '@/lib/apiClient';
import {
  CreateTaskRequest,
  PaginatedResponse,
  Task,
  TaskOccurrence
} from '@/types';

export const taskService = {
  // Task management
  async getTasks(householdId: string, params?: { limit?: number; cursor?: string }): Promise<PaginatedResponse<Task>> {
    return apiClient.get(`/households/${householdId}/tasks`, params);
  },

  async createTask(householdId: string, taskData: CreateTaskRequest): Promise<{ task: Task }> {
    return apiClient.post(`/households/${householdId}/tasks`, taskData);
  },

  async getTask(taskId: string): Promise<{ task: Task }> {
    return apiClient.get(`/tasks/${taskId}`);
  },

  async updateTask(taskId: string, taskData: Partial<CreateTaskRequest>): Promise<{ task: Task }> {
    return apiClient.patch(`/tasks/${taskId}`, taskData);
  },

  async deleteTask(taskId: string): Promise<void> {
    return apiClient.delete(`/tasks/${taskId}`);
  },

  async pauseTask(taskId: string): Promise<{ task: Task }> {
    return apiClient.post(`/tasks/${taskId}/pause`);
  },

  async resumeTask(taskId: string): Promise<{ task: Task }> {
    return apiClient.post(`/tasks/${taskId}/resume`);
  },

  // Task occurrence management
  async getTaskOccurrences(householdId: string, params?: { limit?: number; cursor?: string }): Promise<PaginatedResponse<TaskOccurrence>> {
    return apiClient.get(`/households/${householdId}/task-occurrences`, params);
  },

  async completeTaskOccurrence(occurrenceId: string): Promise<{ occurrence: TaskOccurrence }> {
    return apiClient.patch(`/task-occurrences/${occurrenceId}/complete`);
  },

  async reopenTaskOccurrence(occurrenceId: string): Promise<{ occurrence: TaskOccurrence }> {
    return apiClient.patch(`/task-occurrences/${occurrenceId}/reopen`);
  },

  async reassignTaskOccurrence(occurrenceId: string, assignedTo: string): Promise<{ occurrence: TaskOccurrence }> {
    return apiClient.patch(`/task-occurrences/${occurrenceId}/reassign`, { assigned_to: assignedTo });
  },
};
