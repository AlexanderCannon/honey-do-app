import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button, Header, Screen } from '@/components/ui/common';
import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';

export default function CalendarScreen() {
  const { activeHousehold, getActiveHouseholdName } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarKey, setCalendarKey] = useState(0);

  console.log('Calendar render - selectedDate:', selectedDate.toISOString(), 'currentMonth:', currentMonth.toISOString());

  const handleTodayPress = () => {
    const today = new Date();
    console.log('Today button pressed, setting date to:', today.toISOString());
    // Use the same date parsing approach for consistency
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() returns 0-11
    const day = today.getDate();
    const todayDate = new Date(year, month - 1, day);
    setSelectedDate(todayDate);
    setCurrentMonth(todayDate);
    setCalendarKey(prev => prev + 1);
  };

  if (!activeHousehold) {
    return (
      <Screen style={styles.container}>
        <Header title="Calendar" />
        <View style={styles.noHousehold}>
          <Text style={[styles.noHouseholdText, { color: colors.text }]}>
            No active household selected.
          </Text>
          <Text style={[styles.noHouseholdSubtext, { color: colors.text + '80' }]}>
            Please create or join a household to view events.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.headerContainer}>
        <Header
          title="Calendar"
          subtitle={getActiveHouseholdName()}
          style={styles.header}
        />
        <Button
          title="Today"
          onPress={handleTodayPress}
          variant="outline"
          style={styles.todayButton}
        />
      </View>

      <View style={styles.calendarContainer}>
        <RNCalendar
          key={`${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${calendarKey}`}
          current={currentMonth.toISOString().split('T')[0]}
          onDayPress={(day) => {
            console.log('Day pressed:', day.dateString, 'timestamp:', day.timestamp);
            // Use the dateString instead of timestamp to avoid timezone issues
            const [year, month, dayOfMonth] = day.dateString.split('-').map(Number);
            const selectedDate = new Date(year, month - 1, dayOfMonth);
            setSelectedDate(selectedDate);
          }}
          markedDates={{
            [selectedDate.toISOString().split('T')[0]]: {
              selected: true,
              selectedColor: colors.tint,
            },
          }}
          theme={{
            backgroundColor: colors.background,
            calendarBackground: colors.background,
            textSectionTitleColor: colors.text,
            selectedDayBackgroundColor: colors.tint,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.tint,
            dayTextColor: colors.text,
            textDisabledColor: colors.text + '40',
            arrowColor: colors.tint,
            monthTextColor: colors.text,
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
        />
      </View>

      <View style={styles.eventsContainer}>
        <Text style={[styles.eventsTitle, { color: colors.text }]}>
          Events for {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.text + '80' }]}>
            No events scheduled for this date.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    flex: 1,
  },
  todayButton: {
    minWidth: 70,
  },
  calendarContainer: {
    marginBottom: 20,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  noHousehold: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noHouseholdText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noHouseholdSubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

