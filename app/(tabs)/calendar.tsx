import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button, Header, Screen } from '@/components/ui/common';
import { router } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';

export default function CalendarScreen() {
  const { activeHousehold, getActiveHouseholdName } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Initialize with today's date using the same parsing approach to avoid timezone issues
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() returns 0-11
    const day = today.getDate();
    return new Date(year, month - 1, day);
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [currentMonth, setCurrentMonth] = useState(getTodayDate());
  const [calendarKey, setCalendarKey] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [isLoading, setIsLoading] = useState(false);

  const isParent = activeHousehold?.role === 'parent';

  const loadEventsForMonth = useCallback(async (year: number, month: number) => {
    if (!activeHousehold?.id) return;

    try {
      setIsLoading(true);
      const monthEvents = await eventService.getEventsForMonth(activeHousehold.id, year, month);
      console.log('Loaded events for month:', monthEvents);
      setEvents(monthEvents);

      // Create marked dates for calendar dots
      const marked: any = {};
      monthEvents.forEach(event => {
        const eventDate = new Date(event.starts_at);
        const dateString = eventDate.toISOString().split('T')[0];
        console.log('Event date:', event.title, 'starts_at:', event.starts_at, 'dateString:', dateString);

        if (!marked[dateString]) {
          marked[dateString] = { marked: true, dotColor: getEventTypeColor(event.type) };
        }
      });

      // Add selected date highlighting
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      if (marked[selectedDateString]) {
        marked[selectedDateString] = {
          ...marked[selectedDateString],
          selected: true,
          selectedColor: colors.tint,
        };
      } else {
        marked[selectedDateString] = {
          selected: true,
          selectedColor: colors.tint,
        };
      }

      setMarkedDates(marked);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeHousehold?.id, selectedDate, colors.tint]);

  const getEventTypeColor = (type: string | undefined) => {
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

  const getEventsForSelectedDate = () => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    console.log('Filtering events for date:', selectedDateString);
    console.log('All events:', events);
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.starts_at);
      const eventDateString = eventDate.toISOString().split('T')[0];
      console.log('Checking event:', event.title, 'eventDateString:', eventDateString, 'matches:', eventDateString === selectedDateString);
      return eventDateString === selectedDateString;
    });
    console.log('Filtered events:', filteredEvents);
    return filteredEvents;
  };

  const formatEventTime = (event: Event) => {
    const startDate = new Date(event.starts_at);
    const endDate = new Date(event.ends_at);

    // Check if it's an all-day event (spans full day)
    const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0 &&
      endDate.getHours() === 23 && endDate.getMinutes() === 59;

    if (isAllDay) {
      return 'All day';
    }

    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${startTime} - ${endTime}`;
  };

  useEffect(() => {
    if (activeHousehold?.id) {
      loadEventsForMonth(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    }
  }, [activeHousehold?.id, currentMonth, loadEventsForMonth]);

  console.log('Calendar render - selectedDate:', selectedDate.toISOString(), 'currentMonth:', currentMonth.toISOString());

  const handleTodayPress = () => {
    const todayDate = getTodayDate();
    console.log('Today button pressed, setting date to:', todayDate.toISOString());
    setSelectedDate(todayDate);
    setCurrentMonth(todayDate);
    setCalendarKey(prev => prev + 1);
    // Reload events for the current month
    if (activeHousehold?.id) {
      loadEventsForMonth(todayDate.getFullYear(), todayDate.getMonth() + 1);
    }
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
        <Text style={[styles.householdName, { color: colors.text }]}>
          {getActiveHouseholdName()}
        </Text>
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
            // Update marked dates to show selection
            const selectedDateString = selectedDate.toISOString().split('T')[0];
            setMarkedDates(prev => {
              const newMarked = { ...prev };
              // Remove previous selection
              Object.keys(newMarked).forEach(date => {
                if (newMarked[date].selected) {
                  delete newMarked[date].selected;
                  delete newMarked[date].selectedColor;
                }
              });
              // Add new selection
              if (newMarked[selectedDateString]) {
                newMarked[selectedDateString] = {
                  ...newMarked[selectedDateString],
                  selected: true,
                  selectedColor: colors.tint,
                };
              } else {
                newMarked[selectedDateString] = {
                  selected: true,
                  selectedColor: colors.tint,
                };
              }
              return newMarked;
            });
          }}
          markedDates={markedDates}
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
        <View style={styles.eventsHeader}>
          <Text style={[styles.eventsTitle, { color: colors.text }]}>
            Events for {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.eventsContent}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.text + '80' }]}>
                Loading events...
              </Text>
            </View>
          ) : (
            <>
              {getEventsForSelectedDate().length > 0 ? (
                <FlatList
                  data={getEventsForSelectedDate()}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.eventItem, { borderLeftColor: getEventTypeColor(item.type) }]}>
                      <View style={styles.eventHeader}>
                        <Text style={[styles.eventTitle, { color: colors.text }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.eventTime, { color: colors.text + '80' }]}>
                          {formatEventTime(item)}
                        </Text>
                      </View>
                      {item.description && (
                        <Text style={[styles.eventDescription, { color: colors.text + '80' }]}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.eventSeparator} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.text + '80' }]}>
                    No events scheduled for this date.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
      
      {/* Floating Action Button */}
      {isParent && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/create-event')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
    paddingVertical: 12,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '600',
  },
  todayButton: {
    minWidth: 70,
  },
  eventsHeader: {
    marginBottom: 16,
  },
  eventsContent: {
    flex: 1,
  },

  calendarContainer: {
    marginBottom: 20,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80, // Increased bottom padding to ensure content doesn't get hidden by tab bar
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
  eventItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  eventSeparator: {
    height: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Position above the tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

