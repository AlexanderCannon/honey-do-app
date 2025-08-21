import React, { useState } from 'react';
import { EventForm } from '@/components/ui/events';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CreateEventRequest, eventService } from '@/services/eventService';
import { router } from 'expo-router';

export default function CreateEventScreen() {
  const { activeHousehold } = useAuth();
  const { showError, showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (eventData: CreateEventRequest) => {
    if (!activeHousehold?.id) {
      showError('Error', 'No active household selected.');
      return;
    }

    try {
      setIsLoading(true);
      await eventService.createEvent(activeHousehold.id, eventData);
      showSuccess('Event Created', 'Event has been created successfully.');
      router.back();
    } catch (error: any) {
      console.error('Failed to create event:', error);
      showError('Create Failed', 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <EventForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
      submitLabel="Create Event"
    />
  );
}
