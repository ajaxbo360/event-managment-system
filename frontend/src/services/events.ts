import api from './api.ts';
import type { Event, ConflictingEvent, JoinEventResponse } from '@/types/types.d.ts';


// Export these interfaces so they can be imported elsewhere



/**
 * Events API Service
 */
const eventsService = {
  /**
   * Fetch all events (with optional date range for calendar)
   */
  async fetchEvents(startDate?: string, endDate?: string): Promise<Event[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/events?${params.toString()}`);
    return response.data;
  },

  /**
   * Fetch single event details
   */
  async fetchEventDetails(eventId: number): Promise<Event> {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  /**
   * Join an event
   */
  async joinEvent(eventId: number): Promise<JoinEventResponse> {
    const response = await api.post(`/events/${eventId}/join`);
    return response.data;
  },

  /**
   * Leave an event
   */
  async leaveEvent(eventId: number): Promise<{ message: string }> {
    const response = await api.post(`/events/${eventId}/leave`);
    return response.data;
  },

  /**
   * Fetch user's registered events
   */
  async fetchMyEvents(): Promise<Event[]> {
    const response = await api.get('/my-events');
    return response.data;
  },
};

export default eventsService;