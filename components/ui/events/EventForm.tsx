import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
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

  const getNearestQuarterHour = (date: Date): Date => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes, 0, 0);
    return newDate;
  };

  const getDefaultTimes = () => {
    const now = new Date();
    const startTime = getNearestQuarterHour(now);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1); // Default 1 hour duration
    return {
      starts_at: startTime.toISOString(),
      ends_at: endTime.toISOString(),
    };
  };

  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    starts_at: getDefaultTimes().starts_at,
    ends_at: getDefaultTimes().ends_at,
    type: 'other',
  });

  const [isAllDay, setIsAllDay] = useState(false);
  const [repeatAnnually, setRepeatAnnually] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [endTimeManuallySet, setEndTimeManuallySet] = useState(false);


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
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // If start time is being updated and end time hasn't been manually set,
      // automatically adjust the end time to maintain the same duration
      if (field === 'starts_at' && !endTimeManuallySet) {
        const oldStartTime = new Date(prev.starts_at);
        const oldEndTime = new Date(prev.ends_at);
        const duration = oldEndTime.getTime() - oldStartTime.getTime();
        
        const newStartTime = new Date(value);
        const newEndTime = new Date(newStartTime.getTime() + duration);
        
        newData.ends_at = newEndTime.toISOString();
      }
      
      return newData;
    });
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      return false;
    }
    if (!formData.starts_at) {
      return false;
    }
    if (!isAllDay) {
      if (!formData.ends_at) {
        return false;
      }
      const startDate = new Date(formData.starts_at);
      const endDate = new Date(formData.ends_at);
      if (endDate <= startDate) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Prepare the data to submit
    const submitData = { ...formData };
    
    // Handle all-day events
    if (isAllDay) {
      const startDate = new Date(formData.starts_at);
      // Set start time to beginning of day
      startDate.setHours(0, 0, 0, 0);
      // Set end time to end of day
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      
      submitData.starts_at = startDate.toISOString();
      submitData.ends_at = endDate.toISOString();
    }
    
    // Handle annual repeat
    if (repeatAnnually) {
      submitData.rrule = 'FREQ=YEARLY';
    }
    
    await onSubmit(submitData);
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

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Date
          </Text>
          <Button
            title={new Date(formData.starts_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            onPress={() => setShowDatePicker(true)}
            variant="outline"
            style={styles.dateButton}
          />
        </View>

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
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsAllDay(!isAllDay)}
          >
            <View style={[styles.checkbox, { borderColor: colors.text + '40' }]}>
              {isAllDay && (
                <View style={[styles.checkboxInner, { backgroundColor: colors.tint }]} />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              All-day event
            </Text>
          </TouchableOpacity>
        </View>

        {!isAllDay && (
          <>
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
          </>
        )}

        <View style={styles.field}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRepeatAnnually(!repeatAnnually)}
          >
            <View style={[styles.checkbox, { borderColor: colors.text + '40' }]}>
              {repeatAnnually && (
                <View style={[styles.checkboxInner, { backgroundColor: colors.tint }]} />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Repeat annually
            </Text>
          </TouchableOpacity>
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

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Date</Text>
                  <DateTimePicker
                    value={new Date(formData.starts_at)}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        // Preserve the time when changing date
                        const currentTime = new Date(formData.starts_at);
                        selectedDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                        updateFormData('starts_at', selectedDate.toISOString());
                      }
                    }}
                  />
                  <Button
                    title="Done"
                    onPress={() => setShowDatePicker(false)}
                    style={styles.pickerDoneButton}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Start Time Picker Modal */}
        <Modal
          visible={showStartPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStartPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowStartPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Start Time</Text>
                  <DateTimePicker
                    value={new Date(formData.starts_at)}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        // Preserve the date when changing time
                        const currentDate = new Date(formData.starts_at);
                        selectedDate.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                        // Round to nearest quarter hour
                        const roundedTime = getNearestQuarterHour(selectedDate);
                        updateFormData('starts_at', roundedTime.toISOString());
                      }
                    }}
                  />
                  <Button
                    title="Done"
                    onPress={() => setShowStartPicker(false)}
                    style={styles.pickerDoneButton}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* End Time Picker Modal */}
        <Modal
          visible={showEndPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEndPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowEndPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Select End Time</Text>
                  <DateTimePicker
                    value={new Date(formData.ends_at)}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        // Preserve the date when changing time
                        const currentDate = new Date(formData.ends_at);
                        selectedDate.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                        // Round to nearest quarter hour
                        const roundedTime = getNearestQuarterHour(selectedDate);
                        updateFormData('ends_at', roundedTime.toISOString());
                        setEndTimeManuallySet(true);
                      }
                    }}
                  />
                  <Button
                    title="Done"
                    onPress={() => setShowEndPicker(false)}
                    style={styles.pickerDoneButton}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  dateButton: {
    height: 50,
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerDoneButton: {
    marginTop: 16,
  },
});
