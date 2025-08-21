import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input, Screen } from '@/components/ui/common';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Event } from '@/types';
import { CreateEventRequest } from '@/services/eventService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export interface EventFormProps {
  initialData?: Partial<Event>;
  onSubmit: (data: CreateEventRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  style?: any;
}

export function EventForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Event',
  style,
}: EventFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
    type: 'other',
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        starts_at: initialData.starts_at || new Date().toISOString(),
        ends_at: initialData.ends_at || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        type: (initialData.type as 'birthday' | 'appointment' | 'other') || 'other',
        rrule: initialData.rrule,
      });
    }
  }, [initialData]);

  const updateFormData = (field: keyof CreateEventRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      return false;
    }
    if (!formData.starts_at || !formData.ends_at) {
      return false;
    }
    const startDate = new Date(formData.starts_at);
    const endDate = new Date(formData.ends_at);
    if (endDate <= startDate) {
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    await onSubmit(formData);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'birthday':
        return '#FF6B6B';
      case 'appointment':
        return '#4ECDC4';
      case 'other':
        return '#45B7D1';
      default:
        return '#45B7D1';
    }
  };

  return (
    <Screen scrollable keyboardAvoiding style={style}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          {initialData ? 'Edit Event' : 'Create Event'}
        </Text>

        <Input
          label="Event Title"
          value={formData.title}
          onChangeText={(value) => updateFormData('title', value)}
          placeholder="Enter event title"
          required
        />

        <Input
          label="Description"
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          placeholder="Enter event description (optional)"
          multiline
          numberOfLines={3}
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Event Type
          </Text>
          <View style={[styles.pickerContainer, { borderColor: colors.text + '30' }]}>
            <Picker
              selectedValue={formData.type}
              onValueChange={(value) => updateFormData('type', value)}
              style={[styles.picker, { color: colors.text }]}
            >
              <Picker.Item 
                label="🎂 Birthday" 
                value="birthday" 
                color={getEventTypeColor('birthday')}
              />
              <Picker.Item 
                label="📅 Appointment" 
                value="appointment" 
                color={getEventTypeColor('appointment')}
              />
              <Picker.Item 
                label="📝 Other" 
                value="other" 
                color={getEventTypeColor('other')}
              />
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Start Time
          </Text>
          <Button
            title={formatDateTime(formData.starts_at)}
            onPress={() => setShowStartPicker(true)}
            variant="outline"
            style={styles.timeButton}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            End Time
          </Text>
          <Button
            title={formatDateTime(formData.ends_at)}
            onPress={() => setShowEndPicker(true)}
            variant="outline"
            style={styles.timeButton}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
            disabled={isLoading}
          />
          <Button
            title={submitLabel}
            onPress={handleSubmit}
            disabled={!validateForm() || isLoading}
            loading={isLoading}
            style={styles.submitButton}
          />
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={new Date(formData.starts_at)}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) {
                updateFormData('starts_at', selectedDate.toISOString());
              }
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={new Date(formData.ends_at)}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) {
                updateFormData('ends_at', selectedDate.toISOString());
              }
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  timeButton: {
    height: 50,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
