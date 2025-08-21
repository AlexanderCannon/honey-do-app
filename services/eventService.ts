import { apiClient } from '@/lib/apiClient';
import { Event, CreateEventRequest } from '@/types';

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export class EventService {
  // List events for a date range - now returns expanded occurrences
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

  // Get a single event occurrence
  async getEvent(eventId: string): Promise<Event> {
    const response = await apiClient.get<{ event: Event }>(`/events/${eventId}`);
    return response.event;
  }

  // Create a new event series
  async createEvent(householdId: string, eventData: CreateEventRequest): Promise<Event> {
    // Transform data for backend - it expects EventSeries creation
    const backendData = {
      ...eventData,
      household_id: householdId
    };
    
    const response = await apiClient.post<{ event: Event }>(`/households/${householdId}/events`, backendData);
    return response.event;
  }

  // Update an existing event series
  async updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<Event> {
    const response = await apiClient.patch<{ event: Event }>(`/events/${eventId}`, eventData);
    return response.event;
  }

  // Delete an event series
  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}`);
  }

  // Helper method to get events for a specific month
  async getEventsForMonth(householdId: string, year: number, month: number): Promise<Event[]> {
    // Create start date: first day of the month at 00:00:00
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    
    // Create end date: last day of the month at 23:59:59.999
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of the month
    const endDate = new Date(year, month - 1, lastDay, 23, 59, 59, 999);
    
    const fromDate = startDate.toISOString();
    const toDate = endDate.toISOString();
    
    return this.getEvents(householdId, fromDate, toDate);
  }

  // Get events for a specific day
  async getEventsForDay(householdId: string, date: Date): Promise<Event[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const fromDate = startOfDay.toISOString();
    const toDate = endOfDay.toISOString();
    
    return this.getEvents(householdId, fromDate, toDate);
  }
}

export const eventService = new EventService();
