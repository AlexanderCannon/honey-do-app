import { apiClient } from '@/lib/apiClient';
import {
  CreateTaskRequest,
  PaginatedResponse,
  PhoenixTasksResponse,
  PhoenixOccurrencesResponse,
  Task,
  TaskOccurrence,
} from '@/types';

export class TaskService {
  // Tasks CRUD
  async getTasks(
    householdId: string,
    options?: {
      limit?: number;
      cursor?: string;
      status?: 'active' | 'paused';
      assigned_to?: string;
    }
  ): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.status) params.append('status', options.status);
    if (options?.assigned_to) params.append('assigned_to', options.assigned_to);

    const queryString = params.toString();
    const url = `/households/${householdId}/tasks${queryString ? `?${queryString}` : ''}`;
    
    const phoenixResponse = await apiClient.get<PhoenixTasksResponse>(url);
    
    // Map Phoenix response to expected format
    return {
      data: phoenixResponse.tasks,
      has_more: !!phoenixResponse.next_cursor,
      cursor: phoenixResponse.next_cursor,
    };
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get<{ task: Task }>(`/tasks/${taskId}`);
    return response.task;
  }

  async createTask(householdId: string, taskData: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post<{ task: Task }>(`/households/${householdId}/tasks`, taskData);
    return response.task;
  }

  async updateTask(taskId: string, taskData: Partial<CreateTaskRequest>): Promise<Task> {
    const response = await apiClient.patch<{ task: Task }>(`/tasks/${taskId}`, taskData);
    return response.task;
  }

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  }

  async pauseTask(taskId: string): Promise<Task> {
    const response = await apiClient.post<{ task: Task }>(`/tasks/${taskId}/pause`, {});
    return response.task;
  }

  async resumeTask(taskId: string): Promise<Task> {
    const response = await apiClient.post<{ task: Task }>(`/tasks/${taskId}/resume`, {});
    return response.task;
  }

  // Task Occurrences
  async getTaskOccurrences(
    householdId: string,
    options?: {
      limit?: number;
      cursor?: string;
      status?: 'pending' | 'completed' | 'overdue';
      assigned_to?: string;
      from_date?: string;
      to_date?: string;
    }
  ): Promise<PaginatedResponse<TaskOccurrence>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.status) params.append('status', options.status);
    if (options?.assigned_to) params.append('assigned_to', options.assigned_to);
    if (options?.from_date) params.append('from_date', options.from_date);
    if (options?.to_date) params.append('to_date', options.to_date);

    const queryString = params.toString();
    const url = `/households/${householdId}/task-occurrences${queryString ? `?${queryString}` : ''}`;
    
    const phoenixResponse = await apiClient.get<PhoenixOccurrencesResponse>(url);
    
    // Map Phoenix response to expected format
    return {
      data: phoenixResponse.occurrences,
      has_more: !!phoenixResponse.next_cursor,
      cursor: phoenixResponse.next_cursor,
    };
  }

  async completeTaskOccurrence(occurrenceId: string): Promise<TaskOccurrence> {
    const response = await apiClient.patch<{ occurrence: TaskOccurrence }>(
      `/task-occurrences/${occurrenceId}/complete`,
      {}
    );
    return response.occurrence;
  }

  async reopenTaskOccurrence(occurrenceId: string): Promise<TaskOccurrence> {
    const response = await apiClient.patch<{ occurrence: TaskOccurrence }>(
      `/task-occurrences/${occurrenceId}/reopen`,
      {}
    );
    return response.occurrence;
  }

  async reassignTaskOccurrence(occurrenceId: string, assignedTo: string): Promise<TaskOccurrence> {
    const response = await apiClient.patch<{ occurrence: TaskOccurrence }>(
      `/task-occurrences/${occurrenceId}/reassign`,
      { assigned_to: assignedTo }
    );
    return response.occurrence;
  }

  // Helper methods for common queries
  async getMyTasks(householdId: string, userId: string): Promise<PaginatedResponse<Task>> {
    return this.getTasks(householdId, { assigned_to: userId, status: 'active' });
  }

  async getMyTaskOccurrences(
    householdId: string, 
    userId: string,
    status?: 'pending' | 'completed' | 'overdue'
  ): Promise<PaginatedResponse<TaskOccurrence>> {
    return this.getTaskOccurrences(householdId, { 
      assigned_to: userId,
      status,
      limit: 50 // Get more for personal view
    });
  }

  async getTodaysTasks(householdId: string, userId?: string): Promise<PaginatedResponse<TaskOccurrence>> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.getTaskOccurrences(householdId, {
      assigned_to: userId,
      from_date: todayStr,
      to_date: tomorrowStr,
      status: 'pending'
    });
  }

  async getOverdueTasks(householdId: string, userId?: string): Promise<PaginatedResponse<TaskOccurrence>> {
    return this.getTaskOccurrences(householdId, {
      assigned_to: userId,
      status: 'overdue'
    });
  }

  // Admin functions
  async cleanupExcessiveOccurrences(householdId: string): Promise<{ message: string; deleted_count: number }> {
    const response = await apiClient.post<{ message: string; deleted_count: number }>(
      `/households/${householdId}/task-occurrences/cleanup`,
      {}
    );
    return response;
  }
}

// Export singleton instance
export const taskService = new TaskService();