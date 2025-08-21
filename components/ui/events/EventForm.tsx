import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Button, Input, Screen } from '@/components/ui/common';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Event, CreateEventRequest } from '@/types';
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

  const getDefaultDates = () => {
    const today = new Date();
    return {
      start_date: today.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };
  };

  const [isAllDay, setIsAllDay] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    starts_at: getDefaultTimes().starts_at,
    ends_at: getDefaultTimes().ends_at,
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [endTimeManuallySet, setEndTimeManuallySet] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Determine if all-day based on initial data
      const allDay = Boolean(initialData.start_date && initialData.end_date);
      setIsAllDay(allDay);
      
      // Check if multi-day
      if (allDay && initialData.start_date && initialData.end_date) {
        const startDate = new Date(initialData.start_date);
        const endDate = new Date(initialData.end_date);
        setIsMultiDay(startDate.getTime() !== endDate.getTime());
      }
      
      setIsRecurring(Boolean(initialData.rrule));
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        type: initialData.type,
        starts_at: initialData.starts_at,
        ends_at: initialData.ends_at,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        rrule: initialData.rrule,
        timezone: initialData.timezone || 'UTC',
      });
    }
  }, [initialData]);

  const updateFormData = (field: keyof CreateEventRequest, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // If start time is being updated and end time hasn't been manually set,
      // automatically adjust the end time to maintain the same duration
      if (field === 'starts_at' && !endTimeManuallySet && !isAllDay) {
        const oldStartTime = new Date(prev.starts_at || '');
        const oldEndTime = new Date(prev.ends_at || '');
        const duration = oldEndTime.getTime() - oldStartTime.getTime();
        
        const newStartTime = new Date(value);
        const newEndTime = new Date(newStartTime.getTime() + duration);
        
        newData.ends_at = newEndTime.toISOString();
      }
      
      return newData;
    });
  };

  const handleAllDayToggle = (allDay: boolean) => {
    setIsAllDay(allDay);
    
    if (allDay) {
      // Switch to all-day mode
      const defaultDates = getDefaultDates();
      setFormData(prev => ({
        ...prev,
        start_date: defaultDates.start_date,
        end_date: defaultDates.end_date,
        // Clear scheduled times
        starts_at: undefined,
        ends_at: undefined,
      }));
      setIsMultiDay(false);
    } else {
      // Switch to scheduled mode
      const defaultTimes = getDefaultTimes();
      setFormData(prev => ({
        ...prev,
        starts_at: defaultTimes.starts_at,
        ends_at: defaultTimes.ends_at,
        // Clear all-day dates
        start_date: undefined,
        end_date: undefined,
      }));
      setIsMultiDay(false);
    }
  };

  const handleMultiDayToggle = (multiDay: boolean) => {
    setIsMultiDay(multiDay);
    
    if (multiDay && isAllDay) {
      // Set end date to tomorrow
      const startDate = new Date(formData.start_date || new Date());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      setFormData(prev => ({
        ...prev,
        end_date: endDate.toISOString().split('T')[0],
      }));
    } else if (!multiDay && isAllDay) {
      // Set end date same as start date
      setFormData(prev => ({
        ...prev,
        end_date: prev.start_date,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      return false;
    }

    if (isAllDay) {
      if (!formData.start_date || !formData.end_date) {
        return false;
      }
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      return endDate >= startDate;
    } else {
      if (!formData.starts_at || !formData.ends_at) {
        return false;
      }
      const startTime = new Date(formData.starts_at);
      const endTime = new Date(formData.ends_at);
      return endTime > startTime;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Prepare the data based on the all-day setting and recurrence
    const submitData: CreateEventRequest = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      timezone: formData.timezone || 'UTC',
    };

    if (isAllDay) {
      submitData.start_date = formData.start_date;
      submitData.end_date = formData.end_date;
    } else {
      submitData.starts_at = formData.starts_at;
      submitData.ends_at = formData.ends_at;
    }

    // Add recurrence if enabled
    if (isRecurring && formData.rrule) {
      submitData.rrule = formData.rrule;
    }

    await onSubmit(submitData);
  };

  const formatTime = (isoString: string | undefined): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string | undefined): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const getEventTypeLabel = (type: string | undefined): string => {
    switch (type) {
      case 'meeting': return 'Meeting';
      case 'appointment': return 'Appointment';
      case 'reminder': return 'Reminder';
      case 'birthday': return 'Birthday';
      case 'anniversary': return 'Anniversary';
      case 'holiday': return 'Holiday';
      case 'travel': return 'Travel';
      case 'other': return 'Other';
      default: return 'Select type...';
    }
  };

  const getRecurrenceLabel = (rrule: string | undefined): string => {
    switch (rrule) {
      case 'FREQ=YEARLY': return 'Yearly';
      case 'FREQ=MONTHLY': return 'Monthly';
      case 'FREQ=WEEKLY': return 'Weekly';
      case 'FREQ=DAILY': return 'Daily';
      default: return 'Select recurrence...';
    }
  };

  const renderScheduledFields = () => (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text }}>Time</Text>
      
      <TouchableOpacity
        style={{ ...styles.timeField, borderColor: colors.border }}
        onPress={() => setShowStartPicker(true)}
      >
        <Text style={{ ...styles.timeLabel, color: colors.text }}>Start Time</Text>
        <Text style={{ ...styles.timeValue, color: colors.text }}>
          {formatTime(formData.starts_at)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ ...styles.timeField, borderColor: colors.border }}
        onPress={() => setShowEndPicker(true)}
      >
        <Text style={{ ...styles.timeLabel, color: colors.text }}>End Time</Text>
        <Text style={{ ...styles.timeValue, color: colors.text }}>
          {formatTime(formData.ends_at)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAllDayFields = () => (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: colors.text }}>Date</Text>
      
      <TouchableOpacity
        style={{ ...styles.timeField, borderColor: colors.border }}
        onPress={() => setShowStartDatePicker(true)}
      >
        <Text style={{ ...styles.timeLabel, color: colors.text }}>Start Date</Text>
        <Text style={{ ...styles.timeValue, color: colors.text }}>
          {formatDate(formData.start_date)}
        </Text>
      </TouchableOpacity>

      {isMultiDay && (
        <TouchableOpacity
          style={{ ...styles.timeField, borderColor: colors.border }}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={{ ...styles.timeLabel, color: colors.text }}>End Date</Text>
          <Text style={{ ...styles.timeValue, color: colors.text }}>
            {formatDate(formData.end_date)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Screen style={{ ...styles.container, ...(style as any) }}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={{ ...styles.title, color: colors.text }}>Create Event</Text>
        </View>

        {/* Basic Event Info */}
        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.text }}>Event Details</Text>
          
          <Input
            label="Title"
            value={formData.title}
            onChangeText={(text) => updateFormData('title', text)}
            placeholder="Enter event title"
            style={styles.input}
          />

          <Input
            label="Description"
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
            placeholder="Enter event description"
            multiline
            style={styles.input}
          />

          {/* Event Type Picker */}
          <TouchableOpacity
            style={{ ...styles.pickerField, borderColor: colors.border }}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={{ ...styles.pickerLabel, color: colors.text }}>Event Type</Text>
            <Text style={{ ...styles.pickerValue, color: colors.text }}>
              {getEventTypeLabel(formData.type)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* All Day Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => handleAllDayToggle(!isAllDay)}
          >
            <View style={[styles.checkbox, { borderColor: colors.border }]}>
              {isAllDay && (
                <View style={[styles.checkboxInner, { backgroundColor: colors.tint }]} />
              )}
            </View>
            <Text style={{ ...styles.toggleLabel, color: colors.text }}>
              All Day
            </Text>
          </TouchableOpacity>
        </View>

        {/* Multi-day toggle (only for all-day events) */}
        {isAllDay && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => handleMultiDayToggle(!isMultiDay)}
            >
              <View style={[styles.checkbox, { borderColor: colors.border }]}>
                {isMultiDay && (
                  <View style={[styles.checkboxInner, { backgroundColor: colors.tint }]} />
                )}
              </View>
              <Text style={{ ...styles.toggleLabel, color: colors.text }}>
                Multiple Days
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Time/Date fields */}
        {isAllDay ? renderAllDayFields() : renderScheduledFields()}

        {/* Recurrence Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => {
              const newRecurring = !isRecurring;
              setIsRecurring(newRecurring);
              
              // Set default yearly recurrence when enabling
              if (newRecurring && !formData.rrule) {
                updateFormData('rrule', 'FREQ=YEARLY');
              }
            }}
          >
            <View style={[styles.checkbox, { borderColor: colors.border }]}>
              {isRecurring && (
                <View style={[styles.checkboxInner, { backgroundColor: colors.tint }]} />
              )}
            </View>
            <Text style={{ ...styles.toggleLabel, color: colors.text }}>
              Recurring Event
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recurrence picker (if enabled) */}
        {isRecurring && (
          <View style={styles.section}>
            <TouchableOpacity
              style={{ ...styles.pickerField, borderColor: colors.border }}
              onPress={() => setShowRecurrencePicker(true)}
            >
              <Text style={{ ...styles.pickerLabel, color: colors.text }}>Recurrence</Text>
              <Text style={{ ...styles.pickerValue, color: colors.text }}>
                {getRecurrenceLabel(formData.rrule)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onCancel}
            style={{ ...styles.button, ...styles.cancelButton }}
            textStyle={{ ...styles.buttonText, color: colors.text }}
          />
          <Button
            title={submitLabel}
            onPress={handleSubmit}
            disabled={!validateForm() || isLoading}
            style={{ ...styles.button, ...styles.submitButton, backgroundColor: colors.tint }}
            textStyle={{ ...styles.buttonText, color: '#fff' }}
          />
        </View>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={new Date(formData.starts_at || '')}
          mode="time"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) {
              updateFormData('starts_at', date.toISOString());
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={new Date(formData.ends_at || '')}
          mode="time"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) {
              updateFormData('ends_at', date.toISOString());
              setEndTimeManuallySet(true);
            }
          }}
        />
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={new Date(formData.start_date || '')}
          mode="date"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) {
              const newStartDate = date.toISOString().split('T')[0];
              updateFormData('start_date', newStartDate);
              
              // If not multi-day, update end date to match
              if (!isMultiDay) {
                updateFormData('end_date', newStartDate);
              }
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={new Date(formData.end_date || '')}
          mode="date"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) {
              updateFormData('end_date', date.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      {/* Event Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTypePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Event Type</Text>
                <View style={styles.pickerModalContent}>
                                     {[
                     { label: 'Meeting', value: 'meeting' },
                     { label: 'Appointment', value: 'appointment' },
                     { label: 'Reminder', value: 'reminder' },
                     { label: 'Birthday', value: 'birthday' },
                     { label: 'Anniversary', value: 'anniversary' },
                     { label: 'Holiday', value: 'holiday' },
                     { label: 'Travel', value: 'travel' },
                     { label: 'Other', value: 'other' },
                   ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        { borderColor: colors.border },
                        formData.type === option.value && { backgroundColor: colors.tint + '20' }
                      ]}
                                             onPress={() => {
                         updateFormData('type', option.value);
                         
                         // Auto-configure birthday and anniversary events
                         if (option.value === 'birthday' || option.value === 'anniversary') {
                           // Set to all-day
                           if (!isAllDay) {
                             handleAllDayToggle(true);
                           }
                           
                           // Enable recurring with yearly frequency
                           if (!isRecurring) {
                             setIsRecurring(true);
                           }
                           updateFormData('rrule', 'FREQ=YEARLY');
                         }
                         
                         setShowTypePicker(false);
                       }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        { color: colors.text },
                        formData.type === option.value && { color: colors.tint, fontWeight: '600' }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button
                  title="Cancel"
                  onPress={() => setShowTypePicker(false)}
                  style={styles.modalCancelButton}
                  textStyle={{ color: colors.text }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Recurrence Picker Modal */}
      <Modal
        visible={showRecurrencePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRecurrencePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowRecurrencePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Recurrence</Text>
                <View style={styles.pickerModalContent}>
                  {[
                    { label: 'Yearly', value: 'FREQ=YEARLY' },
                    { label: 'Monthly', value: 'FREQ=MONTHLY' },
                    { label: 'Weekly', value: 'FREQ=WEEKLY' },
                    { label: 'Daily', value: 'FREQ=DAILY' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        { borderColor: colors.border },
                        formData.rrule === option.value && { backgroundColor: colors.tint + '20' }
                      ]}
                      onPress={() => {
                        updateFormData('rrule', option.value);
                        setShowRecurrencePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        { color: colors.text },
                        formData.rrule === option.value && { color: colors.tint, fontWeight: '600' }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button
                  title="Cancel"
                  onPress={() => setShowRecurrencePicker(false)}
                  style={styles.modalCancelButton}
                  textStyle={{ color: colors.text }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
  },
  pickerField: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 16,
  },
  timeField: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerModalContent: {
    marginBottom: 16,
  },
  pickerOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  pickerOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  submitButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
