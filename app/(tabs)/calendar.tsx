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
      setEvents(monthEvents);

            // Create marked dates for calendar dots
      const marked: any = {};
      
      // Add events to calendar dots
      monthEvents.forEach(event => {
        if (event.is_all_day) {
          // For all-day events, mark all dates in the range
          if (event.start_date && event.end_date) {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const dateString = d.toISOString().split('T')[0];
              if (!marked[dateString]) {
                marked[dateString] = { marked: true, dotColor: getEventTypeColor(event.type) };
              }
            }
          }
        } else {
          // For timed events, mark the start date
          if (event.starts_at) {
            const eventDate = new Date(event.starts_at);
            const dateString = eventDate.toISOString().split('T')[0];
            
            if (!marked[dateString]) {
              marked[dateString] = { marked: true, dotColor: getEventTypeColor(event.type) };
            }
          }
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

  const getEventTypeColor = (type: string | undefined): string => {
    if (!type) return '#94A3B8';
    
    switch (type) {
      case 'birthday':
        return '#FF6B6B';
      case 'anniversary':
        return '#FF8E8E';
      case 'appointment':
        return '#4ECDC4';
      case 'meeting':
        return '#45B7D1';
      case 'reminder':
        return '#FFD93D';
      case 'holiday':
        return '#6BCF7F';
      case 'travel':
        return '#A78BFA';
      case 'other':
        return '#94A3B8';
      default:
        return '#94A3B8';
    }
  };



  const getEventsForSelectedDate = () => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    
    const filteredEvents = events.filter((event: Event) => {
      if (event.is_all_day) {
        // For all-day events, check if the selected date falls within the event's date range
        if (event.start_date && event.end_date) {
          return selectedDateString >= event.start_date && selectedDateString <= event.end_date;
        }
      } else {
        // For timed events, check if the event starts on the selected date
        if (event.starts_at) {
          const eventDate = new Date(event.starts_at);
          const eventDateString = eventDate.toISOString().split('T')[0];
          return eventDateString === selectedDateString;
        }
      }
      return false;
    });
    
    return filteredEvents;
  };

    const formatEventTime = (event: Event) => {
    // Use the is_all_day field from the backend
    if (event.is_all_day) {
      return 'All day';
    }
    
    // For timed events, format the time range
    if (event.starts_at && event.ends_at) {
      const startDate = new Date(event.starts_at);
      const endDate = new Date(event.ends_at);
      
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
    }
    
    return 'All day'; // Fallback
  };

  useEffect(() => {
    if (activeHousehold?.id) {
      loadEventsForMonth(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    }
  }, [activeHousehold?.id, currentMonth, loadEventsForMonth]);



  const handleTodayPress = () => {
    const todayDate = getTodayDate();
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
          onMonthChange={(monthData) => {
            const newMonth = new Date(monthData.timestamp);
            setCurrentMonth(newMonth);
            // Reload events for the new month
            if (activeHousehold?.id) {
              loadEventsForMonth(newMonth.getFullYear(), newMonth.getMonth() + 1);
            }
          }}
          onDayPress={(day) => {
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
                  keyExtractor={(item) => item.id || item.series_id}
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

