import { Button, Input } from '@/components/ui/common';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CreateTaskRequest } from '@/types';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface TaskFormProps {
  initialData?: Partial<CreateTaskRequest>;
  onSubmit: (taskData: CreateTaskRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  style?: any;
}

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Task',
  style,
}: TaskFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assigned_to: initialData?.assigned_to || '',
    due_time: initialData?.due_time || '',
    grace_hours: initialData?.grace_hours || 0,
    rrule: initialData?.rrule || '',
  });

  const updateFormData = (field: keyof CreateTaskRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    
    // Clean up the data before submitting
    const cleanData: CreateTaskRequest = {
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      assigned_to: formData.assigned_to || undefined,
      due_time: formData.due_time || undefined,
      grace_hours: (formData.grace_hours || 0) > 0 ? formData.grace_hours : undefined,
      rrule: formData.rrule || undefined,
    };

    onSubmit(cleanData);
  };

  const isValid = formData.title.trim().length > 0;

  // Get household members for assignment (placeholder - we'll implement this properly later)
  const householdMembers: { id: string; name: string }[] = [
    { id: '', name: 'Anyone' },
    { id: user?.id || '', name: 'Me' },
    // TODO: Add other household members when we have member listing
  ];

  const recurrenceOptions = [
    { value: '', label: 'No repeat' },
    { value: 'FREQ=DAILY', label: 'Daily' },
    { value: 'FREQ=WEEKLY', label: 'Weekly' },
    { value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', label: 'Weekdays' },
    { value: 'FREQ=WEEKLY;BYDAY=SA,SU', label: 'Weekends' },
    { value: 'FREQ=MONTHLY', label: 'Monthly' },
  ];

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Task Name *
          </Text>
          <Input
            value={formData.title}
            onChangeText={(value) => updateFormData('title', value)}
            placeholder="e.g., Take out trash"
            style={styles.input}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Description
          </Text>
          <Input
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Additional details..."
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Assigned To */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Assign To
          </Text>
          <View style={styles.pickerContainer}>
            {householdMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: formData.assigned_to === member.id 
                      ? colors.tint + '20' 
                      : colors.background,
                    borderColor: formData.assigned_to === member.id 
                      ? colors.tint 
                      : colors.text + '30',
                  },
                ]}
                onPress={() => updateFormData('assigned_to', member.id)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    {
                      color: formData.assigned_to === member.id 
                        ? colors.tint 
                        : colors.text,
                    },
                  ]}
                >
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Time */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Due Time
          </Text>
          <Input
            value={formData.due_time}
            onChangeText={(value) => updateFormData('due_time', value)}
            placeholder="e.g., 07:00, 19:30"
            style={styles.input}
          />
          <Text style={[styles.helper, { color: colors.text + '60' }]}>
            Use 24-hour format (HH:MM) or leave empty for no specific time
          </Text>
        </View>

        {/* Grace Hours */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Grace Period (hours)
          </Text>
          <Input
            value={formData.grace_hours?.toString() || '0'}
            onChangeText={(value) => updateFormData('grace_hours', parseInt(value) || 0)}
            placeholder="0"
            keyboardType="numeric"
            style={styles.input}
          />
          <Text style={[styles.helper, { color: colors.text + '60' }]}>
            How many hours after due time before task becomes overdue
          </Text>
        </View>

        {/* Recurrence */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Repeat
          </Text>
          <View style={styles.pickerContainer}>
            {recurrenceOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: formData.rrule === option.value 
                      ? colors.tint + '20' 
                      : colors.background,
                    borderColor: formData.rrule === option.value 
                      ? colors.tint 
                      : colors.text + '30',
                  },
                ]}
                onPress={() => updateFormData('rrule', option.value)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    {
                      color: formData.rrule === option.value 
                        ? colors.tint 
                        : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={submitLabel}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            loading={isLoading}
            style={styles.submitButton}
          />
          {onCancel && (
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              style={styles.cancelButton}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helper: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  submitButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
});
