// Core entity types based on Phoenix API
export interface User {
  id: string;
  email: string;
  name: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// ACTUAL API Response Structure (what /me endpoint returns)
export interface HouseholdMembership {
  id: string;           // This is actually the household ID, not membership ID
  name: string;         // Household name
  role: 'parent' | 'child';
  status: 'active' | 'inactive';
  timezone: string;     // Household timezone
  created_at?: string;
  updated_at?: string;
}

// THEORETICAL Full Structure (for reference, but not used by current API)
export interface HouseholdMember {
  id: string;
  user_id: string;
  household_id: string;
  role: 'parent' | 'child';
  status: 'active' | 'inactive';
  user: User;
  household?: Household; // Optional household data when populated
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  household_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  rrule?: string; // Recurrence rule
  due_time?: string; // Time of day in HH:MM format
  grace_hours?: number;
  status: 'active' | 'paused';
  created_at: string;
  updated_at: string;
  assigned_user?: User;
}

export interface TaskOccurrence {
  id: string;
  task_id: string;
  household_id: string;
  assigned_to?: string;
  due_at: string;
  completed_at?: string;
  status: 'pending' | 'completed' | 'overdue';
  task: Task;
  assigned_user?: User;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  household_id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  type?: string;
  rrule?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Invite {
  code: string;
  household_id: string;
  invited_by: string;
  invited_email?: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  household: Household;
  invited_by_user: User;
  created_at: string;
  updated_at: string;
}

// API response types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  has_more: boolean;
  cursor?: string;
}

// Phoenix API specific response types
export interface PhoenixTasksResponse {
  tasks: Task[];
  next_cursor?: string;
  limit?: number;
}

export interface PhoenixOccurrencesResponse {
  occurrences: TaskOccurrence[];
  next_cursor?: string;
  limit?: number;
}

export interface PhoenixMembersResponse {
  members: PhoenixMember[];
  next_cursor?: string;
  limit?: number;
}

// What the backend actually returns for members
export interface PhoenixMember {
  id: string;           // user ID
  email: string;
  name: string | null;  // can be null
  photo_url: string | null;  // can be null
  role: 'parent' | 'child';
  status: 'active' | 'invited';
}

export interface UserWithHouseholds {
  user: User;
  households: HouseholdMembership[]; // API returns simple array, not paginated response
}

// API error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Points and gamification types
export interface UserStats {
  user_id: string;
  household_id: string;
  total_points: number;
  level: number;
  tasks_completed: number;
  current_streak: number;
  longest_streak: number;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  household_id: string;
  points: number;
  reason: string;
  task_occurrence_id?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user: User;
  total_points: number;
  level: number;
  rank: number;
}

// Device token for notifications
export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android';
}

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  photo_url?: string;
}

export interface CreateHouseholdRequest {
  name: string;
  timezone: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigned_to?: string;
  rrule?: string;
  due_time?: string;
  grace_hours?: number;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  type?: string;
  rrule?: string;
}

export interface CreateInviteRequest {
  invited_email?: string;
}

// App state types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  households: HouseholdMembership[];         // Use actual API response type
  activeHousehold: HouseholdMembership | null; // Use actual API response type
  isLoading: boolean;
}
