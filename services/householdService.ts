import { apiClient } from '@/lib/apiClient';
import {
  CreateHouseholdRequest,
  CreateInviteRequest,
  Household,
  HouseholdMember,
  Invite,
  PaginatedResponse,
} from '@/types';

export const householdService = {
  // Household management
  async getHouseholds(params?: { limit?: number; cursor?: string }): Promise<PaginatedResponse<HouseholdMember>> {
    return apiClient.get('/households', params);
  },

  async createHousehold(householdData: CreateHouseholdRequest): Promise<{ household: Household }> {
    return apiClient.post('/households', householdData);
  },

  async getHousehold(householdId: string): Promise<{ household: Household }> {
    return apiClient.get(`/households/${householdId}`);
  },

  async updateHousehold(householdId: string, householdData: Partial<CreateHouseholdRequest>): Promise<{ household: Household }> {
    return apiClient.patch(`/households/${householdId}`, householdData);
  },

  async deleteHousehold(householdId: string): Promise<void> {
    return apiClient.delete(`/households/${householdId}`);
  },

  // Member management
  async getMembers(householdId: string, params?: { limit?: number; cursor?: string }): Promise<PaginatedResponse<HouseholdMember>> {
    return apiClient.get(`/households/${householdId}/members`, params);
  },

  async updateMember(householdId: string, userId: string, memberData: { role?: 'parent' | 'child'; status?: 'active' | 'inactive' }): Promise<{ member: HouseholdMember }> {
    return apiClient.patch(`/households/${householdId}/members/${userId}`, memberData);
  },

  async removeMember(householdId: string, userId: string): Promise<void> {
    return apiClient.delete(`/households/${householdId}/members/${userId}`);
  },

  // Invite management
  async createInvite(householdId: string, inviteData: CreateInviteRequest): Promise<{ invite: Invite }> {
    return apiClient.post(`/households/${householdId}/invites`, inviteData);
  },

  async previewInvite(inviteCode: string): Promise<{ invite: Invite }> {
    // This endpoint doesn't require auth
    const response = await fetch(`${apiClient.getBaseURL()}/invites/${inviteCode}`);
    if (!response.ok) {
      throw new Error('Failed to preview invite');
    }
    return response.json();
  },

  async acceptInvite(inviteCode: string): Promise<{ household: Household }> {
    return apiClient.post(`/invites/${inviteCode}/accept`);
  },
};
