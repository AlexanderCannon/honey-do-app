import { apiClient } from '@/lib/apiClient';
import { Event } from '@/types';

export interface CreateEventRequest {
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  type: 'birthday' | 'appointment' | 'other';
  rrule?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export class EventService {
  // List events for a date range
  async getEvents(
    householdId: string,
    fromDate: string,
    toDate: string
  ): Promise<Event[]> {
    const params = new URLSearchParams();
    params.append('from', fromDate);
    params.append('to', toDate);
    
    const response = await apiClient.get<{ events: Event[] }>(`/households/${householdId}/events?${params}`);
    return response.events;
  }

  // Get a single event
  async getEvent(eventId: string): Promise<Event> {
    const response = await apiClient.get<{ event: Event }>(`/events/${eventId}`);
    return response.event;
  }

  // Create a new event
  async createEvent(householdId: string, eventData: CreateEventRequest): Promise<Event> {
    const response = await apiClient.post<{ event: Event }>(`/households/${householdId}/events`, eventData);
    return response.event;
  }

  // Update an existing event
  async updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<Event> {
    const response = await apiClient.patch<{ event: Event }>(`/events/${eventId}`, eventData);
    return response.event;
  }

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}`);
  }

  // Helper method to get events for a specific month
  async getEventsForMonth(householdId: string, year: number, month: number): Promise<Event[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month at end of day
    
    const fromDate = startDate.toISOString();
    const toDate = endDate.toISOString();
    
    console.log('Getting events for month:', year, month, 'from:', fromDate, 'to:', toDate);
    
    return this.getEvents(householdId, fromDate, toDate);
  }
}

export const eventService = new EventService();
