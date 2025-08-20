import { Button, Input } from '@/components/ui/common';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CreateTaskRequest, PhoenixMember } from '@/types';
import { householdService } from '@/services/householdService';
import React, { useState, useEffect } from 'react';
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
  const { user, activeHousehold } = useAuth();

  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assigned_to: initialData?.assigned_to || '',
    due_time: initialData?.due_time || '',
    grace_hours: initialData?.grace_hours || 0,
    rrule: initialData?.rrule || '',
  });

  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [monthlyType, setMonthlyType] = useState<'day' | 'weekday'>('day');
  const [monthlyInterval, setMonthlyInterval] = useState<number>(1);
  const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState<number>(1);
  const [yearlyMonth, setYearlyMonth] = useState<number>(1);
  const [yearlyDay, setYearlyDay] = useState<number>(1);

  const [householdMembers, setHouseholdMembers] = useState<{ id: string; name: string }[]>([
    { id: '', name: 'Anyone' },
  ]);

  // Load household members
  useEffect(() => {
    const loadMembers = async () => {
      if (!activeHousehold?.id) return;

      try {
        const response = await householdService.getMembers(activeHousehold.id);
        const members: PhoenixMember[] = response.data || [];

        setHouseholdMembers([
          { id: '', name: 'Anyone' },
          ...members.map(member => ({
            id: member.id,  // Backend returns user ID directly as 'id'
            name: member.id === user?.id ? 'Me' : (member.name || member.email || 'Unknown Member'),
          })),
        ]);
      } catch (error) {
        console.error('Failed to load household members:', error);
        console.error('Household ID:', activeHousehold.id);
        console.error('User ID:', user?.id);
        // Fallback to basic options
        setHouseholdMembers([
          { id: '', name: 'Anyone' },
          { id: user?.id || '', name: 'Me' },
        ]);
      }
    };

    loadMembers();
  }, [activeHousehold?.id, user?.id]);

  const updateFormData = (field: keyof CreateTaskRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Initialize recurrence state from existing rrule
  useEffect(() => {
    const rrule = initialData?.rrule || '';
    if (!rrule) {
      setRecurrenceType('none');
      setSelectedDays([]);
    } else if (rrule === 'FREQ=DAILY') {
      // Convert old daily to weekly with all days
      setRecurrenceType('weekly');
      setSelectedDays(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);
    } else if (rrule === 'FREQ=MONTHLY') {
      setRecurrenceType('monthly');
      setSelectedDays([]);
    } else if (rrule.startsWith('FREQ=WEEKLY')) {
      setRecurrenceType('weekly');
      if (rrule === 'FREQ=WEEKLY') {
        // Basic weekly (no specific days selected)
        setSelectedDays([]);
      } else {
        // Extract BYDAY from rrule like "FREQ=WEEKLY;BYDAY=MO,TU,WE"
        const dayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
        const days = dayMatch ? dayMatch[1].split(',') : [];
        setSelectedDays(days);
      }
    }
  }, [initialData?.rrule]);

  // Update rrule when recurrence settings change
  useEffect(() => {
    // Generate RRULE from current recurrence settings
    const generateRrule = (): string => {
      switch (recurrenceType) {
        case 'none':
          return '';
        case 'weekly':
          if (selectedDays.length === 0) {
            return 'FREQ=WEEKLY'; // Basic weekly
          } else if (selectedDays.length === 7) {
            return 'FREQ=DAILY'; // All days = daily
          } else {
            return `FREQ=WEEKLY;BYDAY=${selectedDays.join(',')}`;
          }
        case 'monthly':
          if (monthlyType === 'weekday') {
            return 'FREQ=MONTHLY;BYDAY=1MO'; // First Monday of each month (example)
          }
          let monthlyRrule = 'FREQ=MONTHLY';
          if (monthlyInterval > 1) {
            monthlyRrule += `;INTERVAL=${monthlyInterval}`;
          }
          if (monthlyDayOfMonth > 1) {
            monthlyRrule += `;BYMONTHDAY=${monthlyDayOfMonth}`;
          }
          return monthlyRrule;
        case 'yearly':
          let yearlyRrule = 'FREQ=YEARLY';
          if (yearlyMonth > 1 || yearlyDay > 1) {
            yearlyRrule += `;BYMONTH=${yearlyMonth};BYMONTHDAY=${yearlyDay}`;
          }
          return yearlyRrule;
        default:
          return '';
      }
    };

    const newRrule = generateRrule();
    updateFormData('rrule', newRrule);
  }, [recurrenceType, selectedDays, monthlyType, monthlyInterval, monthlyDayOfMonth, yearlyMonth, yearlyDay]);

  const dayOptions = [
    { value: 'MO', label: 'Mon', fullLabel: 'Monday' },
    { value: 'TU', label: 'Tue', fullLabel: 'Tuesday' },
    { value: 'WE', label: 'Wed', fullLabel: 'Wednesday' },
    { value: 'TH', label: 'Thu', fullLabel: 'Thursday' },
    { value: 'FR', label: 'Fri', fullLabel: 'Friday' },
    { value: 'SA', label: 'Sat', fullLabel: 'Saturday' },
    { value: 'SU', label: 'Sun', fullLabel: 'Sunday' },
  ];

  const toggleDay = (dayValue: string) => {
    setSelectedDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(day => day !== dayValue)
        : [...prev, dayValue]
    );
  };

  const handleRecurrenceTypeChange = (type: typeof recurrenceType) => {
    setRecurrenceType(type);
    // Reset options when switching recurrence types
    if (type !== 'weekly') {
      setSelectedDays([]);
    }
    if (type !== 'monthly') {
      setMonthlyInterval(1);
      setMonthlyType('day');
      setMonthlyDayOfMonth(1);
    }
    if (type !== 'yearly') {
      setYearlyMonth(1);
      setYearlyDay(1);
    }
  };

  // Helper functions
  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'January';
  };

  // Quick preset functions for common day combinations
  const setEveryDay = () => setSelectedDays(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);
  const setWeekdays = () => setSelectedDays(['MO', 'TU', 'WE', 'TH', 'FR']);
  const setWeekends = () => setSelectedDays(['SA', 'SU']);
  const clearDays = () => setSelectedDays([]);

  const validateTimeFormat = (time: string): boolean => {
    if (!time.trim()) return true; // Empty is valid
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleSubmit = () => {
    const title = formData.title.trim();
    if (!title) return;

    // Validate due_time format if provided
    if (formData.due_time && !validateTimeFormat(formData.due_time)) {
      // Form validation handled by UI feedback
      return;
    }

    // Clean up the data before submitting
    const cleanData: CreateTaskRequest = {
      title,
      description: formData.description?.trim() || undefined,
      assigned_to: formData.assigned_to || undefined,
      due_time: formData.due_time?.trim() || undefined,
      grace_hours: (formData.grace_hours || 0) > 0 ? formData.grace_hours : undefined,
      rrule: formData.rrule || undefined,
    };

    onSubmit(cleanData);
  };

  const isValid = formData.title.trim().length > 0 && (!formData.due_time || validateTimeFormat(formData.due_time));

  const recurrenceTypeOptions = [
    { value: 'none', label: 'No repeat' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  // Generate preview text for recurrence
  const getRecurrencePreview = (): string => {
    switch (recurrenceType) {
      case 'weekly':
        if (selectedDays.length > 0) {
          const dayNames = selectedDays.map(day =>
            dayOptions.find(option => option.value === day)?.label || day
          );
          if (dayNames.length === 7) return 'Every day';
          if (dayNames.length === 5 && !selectedDays.includes('SA') && !selectedDays.includes('SU')) return 'Weekdays only';
          if (dayNames.length === 2 && selectedDays.includes('SA') && selectedDays.includes('SU')) return 'Weekends only';
          return `Every ${dayNames.join(', ')}`;
        }
        return 'Same day each week';

      case 'monthly':
        if (monthlyType === 'weekday') return 'Same weekday each month';
        const monthText = monthlyInterval === 1 ? 'month' : `${monthlyInterval} months`;
        const dayText = monthlyDayOfMonth === 1 ? 'same date' : `${monthlyDayOfMonth}${getOrdinalSuffix(monthlyDayOfMonth)}`;
        return `${dayText} of every ${monthText}`;

      case 'yearly':
        const monthName = getMonthName(yearlyMonth);
        const dayWithSuffix = `${yearlyDay}${getOrdinalSuffix(yearlyDay)}`;
        return `${monthName} ${dayWithSuffix} every year`;

      default:
        return '';
    }
  };

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
            style={[
              styles.input,
              formData.due_time && !validateTimeFormat(formData.due_time) && {
                borderColor: '#FF6B6B',
                borderWidth: 1,
              }
            ]}
          />
          <Text style={[styles.helper, {
            color: formData.due_time && !validateTimeFormat(formData.due_time)
              ? '#FF6B6B'
              : colors.text + '60'
          }]}>
            {formData.due_time && !validateTimeFormat(formData.due_time)
              ? 'Please use 24-hour format (HH:MM) like 07:00 or 19:30'
              : 'Use 24-hour format (HH:MM) or leave empty for no specific time'
            }
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

          {/* Recurrence Type Selection */}
          <View style={styles.pickerContainer}>
            {recurrenceTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: recurrenceType === option.value
                      ? colors.tint + '20'
                      : colors.background,
                    borderColor: recurrenceType === option.value
                      ? colors.tint
                      : colors.text + '30',
                  },
                ]}
                onPress={() => handleRecurrenceTypeChange(option.value as typeof recurrenceType)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    {
                      color: recurrenceType === option.value
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

          {/* Show preview for any recurrence type */}
          {recurrenceType !== 'none' && getRecurrencePreview() && (
            <View style={styles.recurrencePreviewContainer}>
              <Text style={[styles.recurrencePreview, { color: colors.text + '80' }]}>
                {getRecurrencePreview()}
              </Text>
            </View>
          )}

          {/* Weekly Days Selection */}
          {recurrenceType === 'weekly' && (
            <View style={styles.optionsContainer}>
              <View style={styles.optionsHeader}>
                <Text style={[styles.optionsLabel, { color: colors.text + '80' }]}>
                  Which days?
                </Text>
                <View style={styles.presetsContainer}>
                  <TouchableOpacity style={styles.presetButton} onPress={setEveryDay}>
                    <Text style={[styles.presetText, { color: colors.tint }]}>Daily</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetButton} onPress={setWeekdays}>
                    <Text style={[styles.presetText, { color: colors.tint }]}>Weekdays</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetButton} onPress={setWeekends}>
                    <Text style={[styles.presetText, { color: colors.tint }]}>Weekends</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetButton} onPress={clearDays}>
                    <Text style={[styles.presetText, { color: colors.text + '60' }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.daysGrid}>
                {dayOptions.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayOption,
                      {
                        backgroundColor: selectedDays.includes(day.value)
                          ? colors.tint
                          : colors.background,
                        borderColor: selectedDays.includes(day.value)
                          ? colors.tint
                          : colors.text + '30',
                      },
                    ]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text
                      style={[
                        styles.dayOptionText,
                        {
                          color: selectedDays.includes(day.value)
                            ? 'white'
                            : colors.text,
                        },
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}



          {/* Monthly Options */}
          {recurrenceType === 'monthly' && (
            <View style={styles.optionsContainer}>
              <Text style={[styles.optionsLabel, { color: colors.text + '80' }]}>
                Day of month:
              </Text>
              
              {/* Day of Month Grid */}
              <View style={styles.monthDaysGrid}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthDayOption,
                      {
                        backgroundColor: monthlyDayOfMonth === day
                          ? colors.tint
                          : colors.background,
                        borderColor: monthlyDayOfMonth === day
                          ? colors.tint
                          : colors.text + '30',
                      },
                    ]}
                    onPress={() => setMonthlyDayOfMonth(day)}
                  >
                    <Text
                      style={[
                        styles.monthDayText,
                        {
                          color: monthlyDayOfMonth === day
                            ? 'white'
                            : colors.text,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Interval Selection */}
              {monthlyInterval > 1 && (
                <View style={styles.intervalRow}>
                  <Text style={[styles.intervalLabel, { color: colors.text + '80' }]}>Every</Text>
                  <Input
                    value={monthlyInterval.toString()}
                    onChangeText={(value) => setMonthlyInterval(parseInt(value) || 1)}
                    keyboardType="numeric"
                    style={styles.intervalInput}
                  />
                  <Text style={[styles.intervalLabel, { color: colors.text + '80' }]}>months</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.intervalToggle} 
                onPress={() => setMonthlyInterval(monthlyInterval === 1 ? 2 : 1)}
              >
                <Text style={[styles.intervalToggleText, { color: colors.tint }]}>
                  {monthlyInterval === 1 ? 'Change to every few months' : 'Change to every month'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Yearly Options */}
          {recurrenceType === 'yearly' && (
            <View style={styles.optionsContainer}>
              <Text style={[styles.optionsLabel, { color: colors.text + '80' }]}>
                Select month:
              </Text>
              
              {/* Month Selection Grid */}
              <View style={styles.monthsGrid}>
                {[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].map((monthName, index) => (
                  <TouchableOpacity
                    key={monthName}
                    style={[
                      styles.monthOption,
                      {
                        backgroundColor: yearlyMonth === index + 1
                          ? colors.tint
                          : colors.background,
                        borderColor: yearlyMonth === index + 1
                          ? colors.tint
                          : colors.text + '30',
                      },
                    ]}
                    onPress={() => setYearlyMonth(index + 1)}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        {
                          color: yearlyMonth === index + 1
                            ? 'white'
                            : colors.text,
                        },
                      ]}
                    >
                      {monthName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.optionsLabel, { color: colors.text + '80', marginTop: 16 }]}>
                Select day:
              </Text>
              
              {/* Day Selection Grid */}
              <View style={styles.monthDaysGrid}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthDayOption,
                      {
                        backgroundColor: yearlyDay === day
                          ? colors.tint
                          : colors.background,
                        borderColor: yearlyDay === day
                          ? colors.tint
                          : colors.text + '30',
                      },
                    ]}
                    onPress={() => setYearlyDay(day)}
                  >
                    <Text
                      style={[
                        styles.monthDayText,
                        {
                          color: yearlyDay === day
                            ? 'white'
                            : colors.text,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  presetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recurrencePreview: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  recurrencePreviewContainer: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  optionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionsLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  intervalLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  intervalInput: {
    width: 50,
    textAlign: 'center',
    marginBottom: 0,
    fontSize: 13,
    paddingVertical: 6,
  },
  intervalToggle: {
    marginTop: 12,
    paddingVertical: 8,
  },
  intervalToggleText: {
    fontSize: 12,
    textAlign: 'center',
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    justifyContent: 'flex-start',
  },
  monthDayOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  monthDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-start',
  },
  monthOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  monthOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
