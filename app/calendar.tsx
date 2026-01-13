import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import {
    Bell,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    Trash2,
    X
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabaseApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Color constants for events
const COLORS = {
    primary: '#FF5A5F',
    secondary: '#FF8FAB',
};

// --- Types and Mock Data ---
interface Event {
    id: string;
    date: Date;
    title: string;
    time: string;
    color: string;
    hasAlarm?: boolean;
    notificationId?: string;
}

interface Task {
    id: string;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    is_completed: boolean;
    due_date: string;
    due_time?: string;
    subject?: string;
}

// Color constants for indicators
const INDICATOR_COLORS = {
    event: '#FF5A5F',    // Red/coral for events
    task: '#4CAF50',     // Green for tasks
    both: '#9C27B0',     // Purple when both exist
};

// Empty initial events - will be populated from database
const initialEvents: Event[] = [];

// Configure notifications (wrapped in try-catch for Expo Go compatibility)
try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} catch (error) {
    console.log('Notifications not fully supported in Expo Go');
}

export default function CalendarPage() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    
    // Create dynamic styles based on theme
    const dynamicStyles = createStyles(colors, isDarkMode);
    
    // Use real current date
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate()); // Select today by default
    const [events, setEvents] = useState(initialEvents);
    const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [enableAlarm, setEnableAlarm] = useState(false);

    // Request notification permissions on mount
    useEffect(() => {
        const requestPermissions = async () => {
            try {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                    console.log('Notification permissions not granted');
                }
            } catch (error) {
                console.log('Notifications not fully supported in Expo Go');
            }
        };
        requestPermissions();
    }, []);

    // Fetch events and tasks from Supabase on mount
    useEffect(() => {
        fetchEvents();
        fetchTasks();
    }, []);

    // Refresh data when screen comes into focus (navigating back)
    useFocusEffect(
        useCallback(() => {
            fetchEvents();
            fetchTasks();
        }, [])
    );

    // Generate proper UUID
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Fetch events from Supabase
    const fetchEvents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;

            const { data: calendarEvents, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                // Table might not exist yet - that's okay
                console.log('Calendar events table may not exist:', error.message);
                return;
            }

            if (calendarEvents) {
                const formattedEvents: Event[] = calendarEvents.map((e: any) => {
                    // Parse date string correctly to avoid timezone issues
                    // event_date comes as 'YYYY-MM-DD' string from Supabase
                    const [yearStr, monthStr, dayStr] = e.event_date.split('-');
                    const eventDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
                    
                    return {
                        id: e.id,
                        date: eventDate,
                        title: e.title,
                        time: e.event_time,
                        color: e.color || COLORS.primary,
                        hasAlarm: e.has_alarm || false,
                        notificationId: e.notification_id,
                    };
                });
                setEvents(formattedEvents);
                console.log('Fetched events:', formattedEvents.length);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    // Fetch tasks from Supabase
    const fetchTasks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;

            const { data: userTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('users_id', user.id)
                .eq('is_completed', false);

            if (error) {
                console.log('Tasks table may not exist:', error.message);
                return;
            }

            if (userTasks) {
                // Filter out tasks from past dates
                const todayStr = new Date().toISOString().split('T')[0];
                const futureTasks = userTasks.filter((task: Task) => task.due_date >= todayStr);
                setTasks(futureTasks);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Update events and tasks list when a date is selected
    useEffect(() => {
        if (selectedDate === null) {
            setSelectedDayEvents([]);
            setSelectedDayTasks([]);
            return;
        }
        const dayEvents = events.filter(
            (event) => event.date.getDate() === selectedDate && event.date.getMonth() === month && event.date.getFullYear() === year
        );
        setSelectedDayEvents(dayEvents);

        // Filter tasks for selected date
        const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        const dayTasks = tasks.filter((task) => task.due_date === selectedDateStr);
        setSelectedDayTasks(dayTasks);
    }, [selectedDate, events, tasks, currentDate]);

    // Calendar Logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const changeMonth = (increment: number) => {
        const newDate = new Date(year, month + increment, 1);
        const today = new Date();
        
        // Prevent navigating to past months
        if (increment < 0) {
            const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            if (newDate < currentMonthStart) {
                return; // Don't allow going to past months
            }
        }
        
        setCurrentDate(newDate);
        setSelectedDate(null); // Reset selection on month change
    };

    // Helper to check if a date is in the past
    const isDateInPast = (day: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(year, month, day);
        return checkDate < today;
    };

    // --- CRUD Functions ---
    const handleOpenAddModal = () => {
        if (selectedDate === null) {
            Alert.alert("No Date Selected", "Please select a date to add an event.");
            return;
        }
        
        // Prevent adding events to past dates
        if (isDateInPast(selectedDate)) {
            Alert.alert("Cannot Add Event", "You cannot add events to past dates.");
            return;
        }
        
        setEditingEvent(null);
        setEventTitle('');
        setEventTime('');
        setSelectedTime(new Date());
        setEnableAlarm(false);
        setIsModalVisible(true);
    };

    const handleOpenEditModal = (event: Event) => {
        setEditingEvent(event);
        setEventTitle(event.title);
        setEventTime(event.time);
        setEnableAlarm(event.hasAlarm || false);
        // Parse the time string to set selectedTime
        const [timePart, period] = event.time.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hour = parseInt(hours, 10);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        const timeDate = new Date();
        timeDate.setHours(hour, parseInt(minutes, 10));
        setSelectedTime(timeDate);
        setIsModalVisible(true);
    };

    // Format time for display
    const formatTimeDisplay = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    // Handle time picker change
    const onTimeChange = (event: any, selected?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selected) {
            setSelectedTime(selected);
            setEventTime(formatTimeDisplay(selected));
        }
    };

    // Schedule notification/alarm
    const scheduleAlarm = async (eventDate: Date, eventTimeStr: string, title: string): Promise<string | null> => {
        try {
            // Parse time
            const [timePart, period] = eventTimeStr.split(' ');
            const [hours, minutes] = timePart.split(':');
            let hour = parseInt(hours, 10);
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            // Create trigger date
            const triggerDate = new Date(eventDate);
            triggerDate.setHours(hour, parseInt(minutes, 10), 0, 0);

            // Don't schedule if in the past
            if (triggerDate <= new Date()) {
                return null;
            }

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⏰ Event Reminder',
                    body: title,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                },
            });

            return notificationId;
        } catch (error) {
            console.error('Error scheduling alarm:', error);
            return null;
        }
    };

    // Cancel scheduled notification
    const cancelAlarm = async (notificationId: string) => {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
            console.error('Error canceling alarm:', error);
        }
    };

    const handleSaveEvent = async () => {
        if (!eventTitle.trim() || !eventTime.trim()) {
            Alert.alert("Missing Information", "Please fill in both title and time.");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                Alert.alert("Error", "You must be logged in to save events.");
                return;
            }

            const eventDate = new Date(year, month, selectedDate!);
            let notificationId: string | null = null;

            // Schedule alarm if enabled
            if (enableAlarm) {
                notificationId = await scheduleAlarm(eventDate, eventTime, eventTitle);
                if (notificationId) {
                    Alert.alert("Alarm Set", `You will be reminded at ${eventTime}`);
                }
            }

            if (editingEvent) {
                // Cancel old alarm if exists
                if (editingEvent.notificationId) {
                    await cancelAlarm(editingEvent.notificationId);
                }

                // Update in Supabase
                const { error } = await supabase
                    .from('calendar_events')
                    .update({
                        title: eventTitle,
                        event_time: eventTime,
                        has_alarm: enableAlarm,
                        notification_id: notificationId,
                    })
                    .eq('id', editingEvent.id);

                if (error) {
                    console.error('Error updating event:', error);
                    Alert.alert("Error", "Failed to update event. Please try again.");
                    return;
                }

                // Update local state
                setEvents(events.map(e => e.id === editingEvent.id ? { 
                    ...e, 
                    title: eventTitle, 
                    time: eventTime,
                    hasAlarm: enableAlarm,
                    notificationId: notificationId || undefined,
                } : e));
            } else {
                // Add new event
                const uuid = generateUUID();
                const color = [COLORS.primary, COLORS.secondary, '#4CAF50'][Math.floor(Math.random() * 3)];
                
                // Format date as YYYY-MM-DD string to avoid timezone issues
                const eventDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
                console.log('Saving event with date:', eventDateStr);

                // Save to Supabase
                const { data: savedEvent, error } = await supabase.from('calendar_events').insert([
                    {
                        id: uuid,
                        user_id: user.id,
                        title: eventTitle,
                        event_date: eventDateStr,
                        event_time: eventTime,
                        color: color,
                        has_alarm: enableAlarm,
                        notification_id: notificationId,
                    }
                ]).select();

                if (error) {
                    console.error('Error saving event:', error);
                    Alert.alert("Error", "Failed to save event. Please try again.");
                    return;
                }

                console.log('Event saved successfully:', savedEvent);

                const newEvent: Event = {
                    id: uuid,
                    date: eventDate,
                    title: eventTitle,
                    time: eventTime,
                    color: color,
                    hasAlarm: enableAlarm,
                    notificationId: notificationId || undefined,
                };
                setEvents([...events, newEvent]);
                
                // Refresh events from database to ensure consistency
                await fetchEvents();
            }
            setIsModalVisible(false);
        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert("Error", "Failed to save event. Please try again.");
        }
    };

    const handleDeleteEvent = async () => {
        if (!editingEvent) return;
        Alert.alert(
            "Delete Event",
            "Are you sure you want to delete this event?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Cancel alarm if exists
                            if (editingEvent.notificationId) {
                                await cancelAlarm(editingEvent.notificationId);
                            }

                            // Delete from Supabase
                            const { error } = await supabase
                                .from('calendar_events')
                                .delete()
                                .eq('id', editingEvent.id);

                            if (error) {
                                console.error('Error deleting event:', error);
                                Alert.alert("Error", "Failed to delete event. Please try again.");
                                return;
                            }

                            setEvents(events.filter(e => e.id !== editingEvent.id));
                            setIsModalVisible(false);
                        } catch (error) {
                            console.error('Error deleting event:', error);
                            Alert.alert("Error", "Failed to delete event. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const renderCalendarGrid = () => {

        // Render Header (Days of Week)
        const headerRow = weekDays.map((day, index) => (
            <View key={`header-${index}`} style={dynamicStyles.gridCell}>
                <Text style={dynamicStyles.weekDayText}>{day}</Text>
            </View>
        ));

        // Render Empty Cells for start of month
        const emptyCells: React.ReactElement[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            emptyCells.push(<View key={`empty-${i}`} style={dynamicStyles.gridCell} />);
        }

        // Render Days
        const dayCells: React.ReactElement[] = [];
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        for (let i = 1; i <= daysInMonth; i++) {
            const isSelected = i === selectedDate;
            const hasEvent = events.some(e => e.date.getDate() === i && e.date.getMonth() === month && e.date.getFullYear() === year);
            
            // Check if this day has tasks
            const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const hasTask = tasks.some(t => t.due_date === dayDateStr);
            
            // Determine indicator color
            const getIndicatorColor = () => {
                if (hasEvent && hasTask) return INDICATOR_COLORS.both;
                if (hasEvent) return INDICATOR_COLORS.event;
                if (hasTask) return INDICATOR_COLORS.task;
                return null;
            };
            const indicatorColor = getIndicatorColor();
            
            // Check if this day is in the past
            const cellDate = new Date(year, month, i);
            const isPast = cellDate < todayDate;
            const isToday = cellDate.getTime() === todayDate.getTime();

            dayCells.push(
                <TouchableOpacity
                    key={`day-${i}`}
                    style={[
                        dynamicStyles.gridCell, 
                        isSelected && dynamicStyles.selectedDayCell,
                        isPast && { opacity: 0.4 }
                    ]}
                    onPress={() => !isPast && setSelectedDate(i)}
                    disabled={isPast}
                >
                    <View style={dynamicStyles.dayCellContent}>
                        <Text style={[
                            dynamicStyles.dayText, 
                            isSelected && dynamicStyles.selectedDayText,
                            isToday && !isSelected && { color: '#FF5A5F', fontWeight: 'bold' }
                        ]}>{i}</Text>
                        {indicatorColor && (
                            <View style={dynamicStyles.indicatorContainer}>
                                {hasEvent && <View style={[dynamicStyles.indicatorDot, { backgroundColor: isSelected ? '#FFFFFF' : INDICATOR_COLORS.event }]} />}
                                {hasTask && <View style={[dynamicStyles.indicatorDot, { backgroundColor: isSelected ? '#FFFFFF' : INDICATOR_COLORS.task }]} />}
                            </View>
                        )}
                        {isToday && !isSelected && !indicatorColor && <View style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF5A5F' }} />}
                    </View>
                </TouchableOpacity>
            );
        }

        // Combine all cells
        const allCells = [...emptyCells, ...dayCells];
        const rows: React.ReactElement[] = [];
        let cellsInRow: React.ReactElement[] = [];

        allCells.forEach((cell, index) => {
            cellsInRow.push(cell);
            if ((index + 1) % 7 === 0 || index === allCells.length - 1) {
                rows.push(
                    <View key={`row-${rows.length}`} style={dynamicStyles.gridRow}>
                        {cellsInRow}
                    </View>
                );
                cellsInRow = [];
            }
        });

        return (
            <View style={dynamicStyles.calendarContainer}>
                <View style={dynamicStyles.gridRow}>{headerRow}</View>
                {rows}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dynamicStyles.scrollContent}>

                {/* Header Section */}
                <View style={dynamicStyles.header}>
                    <View style={dynamicStyles.headerLeft}>
                        <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
                            <ChevronLeft color={colors.text} size={28} />
                        </TouchableOpacity>
                        <View>
                            <Text style={dynamicStyles.title}>Calendar</Text>
                            <Text style={dynamicStyles.subtitle}>
                                {events.filter(e => {
                                    const todayDate = new Date();
                                    todayDate.setHours(0, 0, 0, 0);
                                    return e.date >= todayDate && e.date.getMonth() === month && e.date.getFullYear() === year;
                                }).length} events this month
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={dynamicStyles.addButton} activeOpacity={0.8} onPress={handleOpenAddModal}>
                        <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
                        <Text style={dynamicStyles.addButtonText}>Event</Text>
                    </TouchableOpacity>
                </View>

                {/* Calendar Card */}
                <View style={dynamicStyles.card}>
                    {/* Month Navigation */}
                    <View style={dynamicStyles.monthNav}>
                        <Text style={dynamicStyles.monthTitle}>{monthNames[month]} {year}</Text>
                        <View style={dynamicStyles.navArrows}>
                            <TouchableOpacity 
                                onPress={() => changeMonth(-1)} 
                                style={[
                                    dynamicStyles.arrowBtn,
                                    // Disable if current month
                                    (year === today.getFullYear() && month === today.getMonth()) && { opacity: 0.3 }
                                ]}
                                disabled={year === today.getFullYear() && month === today.getMonth()}
                            >
                                <ChevronLeft color={colors.text} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={dynamicStyles.arrowBtn}>
                                <ChevronRight color={colors.text} size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Grid */}
                    {renderCalendarGrid()}
                </View>

                {/* Today's Schedule Section - Shows both Events and Tasks */}
                <View style={dynamicStyles.sectionContainer} key={selectedDate}>
                    <Text style={dynamicStyles.sectionTitle}>
                        Schedule for {monthNames[month]} {selectedDate || new Date().getDate()}
                    </Text>
                    
                    {/* Legend */}
                    <View style={dynamicStyles.legendContainer}>
                        <View style={dynamicStyles.legendItem}>
                            <View style={[dynamicStyles.legendDot, { backgroundColor: INDICATOR_COLORS.event }]} />
                            <Text style={dynamicStyles.legendText}>Events</Text>
                        </View>
                        <View style={dynamicStyles.legendItem}>
                            <View style={[dynamicStyles.legendDot, { backgroundColor: INDICATOR_COLORS.task }]} />
                            <Text style={dynamicStyles.legendText}>Tasks</Text>
                        </View>
                    </View>

                    {(selectedDayEvents.length > 0 || selectedDayTasks.length > 0) ? (
                        <View style={dynamicStyles.card}>
                            {/* Events */}
                            {selectedDayEvents.length > 0 && (
                                <>
                                    <View style={dynamicStyles.scheduleHeader}>
                                        <View style={[dynamicStyles.scheduleHeaderDot, { backgroundColor: INDICATOR_COLORS.event }]} />
                                        <Text style={dynamicStyles.scheduleHeaderText}>Events ({selectedDayEvents.length})</Text>
                                    </View>
                                    {selectedDayEvents.map((event, index) => (
                                        <TouchableOpacity 
                                            key={event.id} 
                                            style={[
                                                dynamicStyles.eventItem, 
                                                { borderBottomWidth: index === selectedDayEvents.length - 1 && selectedDayTasks.length === 0 ? 0 : 1, borderBottomColor: colors.border }
                                            ]} 
                                            onPress={() => handleOpenEditModal(event)}
                                        >
                                            <View style={[dynamicStyles.eventColorBar, { backgroundColor: event.color }]} />
                                            <View style={dynamicStyles.eventContent}>
                                                <Text style={dynamicStyles.eventTitle}>{event.title}</Text>
                                                <View style={dynamicStyles.eventTimeContainer}>
                                                    <Clock size={14} color={colors.grayText} />
                                                    <Text style={dynamicStyles.eventTime}>{event.time}</Text>
                                                </View>
                                            </View>
                                            <ChevronRight color={colors.grayText} size={20} />
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}
                            
                            {/* Tasks */}
                            {selectedDayTasks.length > 0 && (
                                <>
                                    <View style={[dynamicStyles.scheduleHeader, selectedDayEvents.length > 0 && { marginTop: 16 }]}>
                                        <View style={[dynamicStyles.scheduleHeaderDot, { backgroundColor: INDICATOR_COLORS.task }]} />
                                        <Text style={dynamicStyles.scheduleHeaderText}>Tasks ({selectedDayTasks.length})</Text>
                                    </View>
                                    {selectedDayTasks.map((task, index) => (
                                        <View 
                                            key={task.id} 
                                            style={[
                                                dynamicStyles.taskItem, 
                                                { borderBottomWidth: index === selectedDayTasks.length - 1 ? 0 : 1, borderBottomColor: colors.border }
                                            ]}
                                        >
                                            <View style={[dynamicStyles.taskColorBar, { backgroundColor: task.priority === 'High' ? '#FF5A5F' : task.priority === 'Medium' ? '#FFA726' : '#4CAF50' }]} />
                                            <View style={dynamicStyles.taskContent}>
                                                <Text style={dynamicStyles.taskTitle}>{task.title}</Text>
                                                <View style={dynamicStyles.taskMetaContainer}>
                                                    <View style={[dynamicStyles.priorityBadge, { backgroundColor: task.priority === 'High' ? '#FFEBEE' : task.priority === 'Medium' ? '#FFF3E0' : '#E8F5E9' }]}>
                                                        <Text style={[dynamicStyles.priorityText, { color: task.priority === 'High' ? '#FF5A5F' : task.priority === 'Medium' ? '#FFA726' : '#4CAF50' }]}>
                                                            {task.priority}
                                                        </Text>
                                                    </View>
                                                    {task.due_time && (
                                                        <View style={dynamicStyles.taskTimeContainer}>
                                                            <Clock size={12} color={colors.grayText} />
                                                            <Text style={dynamicStyles.taskTime}>{task.due_time}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </>
                            )}
                        </View>
                    ) : (
                        <View style={[dynamicStyles.card, dynamicStyles.emptyStateCard]}>
                            <CalendarIcon color={colors.grayText} size={48} strokeWidth={1} />
                            <Text style={dynamicStyles.emptyStateText}>No events or tasks for this day</Text>
                        </View>
                    )}
                </View>

                {/* This Week Section */}
                <View style={dynamicStyles.sectionContainer}>
                    <Text style={dynamicStyles.sectionTitle}>This Week</Text>
                    <View style={dynamicStyles.card}>
                        {(() => {
                            // Get current date and calculate days until Saturday
                            const todayDate = new Date();
                            todayDate.setHours(0, 0, 0, 0);
                            const currentDayOfWeek = todayDate.getDay(); // 0 = Sunday, 6 = Saturday
                            
                            // Calculate days remaining until Saturday (6)
                            const daysUntilSaturday = currentDayOfWeek === 0 ? 6 : 6 - currentDayOfWeek;
                            
                            // Generate array of dates from today to Saturday
                            const weekDates: Date[] = [];
                            for (let i = 0; i <= daysUntilSaturday; i++) {
                                const date = new Date(todayDate);
                                date.setDate(todayDate.getDate() + i);
                                weekDates.push(date);
                            }
                            
                            // Get all events and tasks for this week
                            const weekItems: { date: Date; type: 'event' | 'task'; item: Event | Task; dateStr: string }[] = [];
                            
                            weekDates.forEach(date => {
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                
                                // Add events for this date
                                events.forEach(event => {
                                    if (event.date.getDate() === date.getDate() && 
                                        event.date.getMonth() === date.getMonth() && 
                                        event.date.getFullYear() === date.getFullYear()) {
                                        weekItems.push({ date, type: 'event', item: event, dateStr });
                                    }
                                });
                                
                                // Add tasks for this date
                                tasks.forEach(task => {
                                    if (task.due_date === dateStr) {
                                        weekItems.push({ date, type: 'task', item: task, dateStr });
                                    }
                                });
                            });
                            
                            // Sort by date
                            weekItems.sort((a, b) => a.date.getTime() - b.date.getTime());
                            
                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            
                            if (weekItems.length === 0) {
                                return (
                                    <View style={dynamicStyles.emptyWeekState}>
                                        <CalendarIcon color={colors.grayText} size={32} strokeWidth={1} />
                                        <Text style={dynamicStyles.emptyStateText}>No events or tasks this week</Text>
                                    </View>
                                );
                            }
                            
                            return weekItems.map((weekItem, index) => {
                                const isEvent = weekItem.type === 'event';
                                const item = weekItem.item;
                                const dayName = dayNames[weekItem.date.getDay()];
                                const dateNum = weekItem.date.getDate();
                                const isToday = weekItem.date.getTime() === todayDate.getTime();
                                
                                return (
                                    <View 
                                        key={`${weekItem.type}-${isEvent ? (item as Event).id : (item as Task).id}-${index}`}
                                        style={[
                                            dynamicStyles.weekItem,
                                            { borderBottomWidth: index === weekItems.length - 1 ? 0 : 1, borderBottomColor: colors.border }
                                        ]}
                                    >
                                        <View style={dynamicStyles.weekDateColumn}>
                                            <Text style={[dynamicStyles.weekDayName, isToday && { color: colors.primary }]}>{dayName}</Text>
                                            <Text style={[dynamicStyles.weekDateNum, isToday && { color: colors.primary, fontWeight: 'bold' }]}>{dateNum}</Text>
                                        </View>
                                        <View style={[dynamicStyles.weekItemBar, { backgroundColor: isEvent ? INDICATOR_COLORS.event : INDICATOR_COLORS.task }]} />
                                        <View style={dynamicStyles.weekItemContent}>
                                            <Text style={dynamicStyles.weekItemTitle} numberOfLines={1}>
                                                {isEvent ? (item as Event).title : (item as Task).title}
                                            </Text>
                                            <View style={dynamicStyles.weekItemMeta}>
                                                {isEvent ? (
                                                    <>
                                                        <Clock size={12} color={colors.grayText} />
                                                        <Text style={dynamicStyles.weekItemTime}>{(item as Event).time}</Text>
                                                    </>
                                                ) : (
                                                    <View style={[dynamicStyles.weekPriorityBadge, { 
                                                        backgroundColor: (item as Task).priority === 'High' ? '#FFEBEE' : 
                                                                        (item as Task).priority === 'Medium' ? '#FFF3E0' : '#E8F5E9' 
                                                    }]}>
                                                        <Text style={[dynamicStyles.weekPriorityText, { 
                                                            color: (item as Task).priority === 'High' ? '#FF5A5F' : 
                                                                   (item as Task).priority === 'Medium' ? '#FFA726' : '#4CAF50' 
                                                        }]}>
                                                            {(item as Task).priority}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View style={[dynamicStyles.weekTypeBadge, { backgroundColor: isEvent ? '#FFEBEE' : '#E8F5E9' }]}>
                                                    <Text style={[dynamicStyles.weekTypeText, { color: isEvent ? INDICATOR_COLORS.event : INDICATOR_COLORS.task }]}>
                                                        {isEvent ? 'Event' : 'Task'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            });
                        })()}
                    </View>
                </View>

            </ScrollView>

            {/* Add/Edit Event Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={dynamicStyles.modalContent}>
                        <View style={dynamicStyles.modalHeader}>
                            <Text style={dynamicStyles.modalTitle}>{editingEvent ? 'Edit Event' : 'Add Event'}</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <X size={24} color={colors.grayText} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={dynamicStyles.input}
                            placeholder="Event Title"
                            placeholderTextColor={colors.grayText}
                            value={eventTitle}
                            onChangeText={setEventTitle}
                        />
                        {/* Time Picker Button */}
                        <TouchableOpacity 
                            style={dynamicStyles.timePickerButton}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Clock size={20} color={colors.primary} />
                            <Text style={dynamicStyles.timePickerText}>
                                {eventTime || 'Select Time'}
                            </Text>
                        </TouchableOpacity>

                        {/* Time Picker */}
                        {showTimePicker && (
                            <DateTimePicker
                                value={selectedTime}
                                mode="time"
                                is24Hour={false}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onTimeChange}
                            />
                        )}

                        {/* Alarm Toggle */}
                        <TouchableOpacity 
                            style={dynamicStyles.alarmToggle}
                            onPress={() => setEnableAlarm(!enableAlarm)}
                        >
                            <View style={dynamicStyles.alarmToggleLeft}>
                                <Bell size={20} color={enableAlarm ? colors.primary : colors.grayText} />
                                <Text style={[dynamicStyles.alarmToggleText, enableAlarm && { color: colors.primary }]}>
                                    Set Alarm Reminder
                                </Text>
                            </View>
                            <View style={[
                                dynamicStyles.toggleSwitch,
                                enableAlarm && { backgroundColor: colors.primary }
                            ]}>
                                <View style={[
                                    dynamicStyles.toggleKnob,
                                    enableAlarm && { transform: [{ translateX: 20 }] }
                                ]} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={dynamicStyles.saveButton} onPress={handleSaveEvent}>
                            <Text style={dynamicStyles.saveButtonText}>Save Event</Text>
                        </TouchableOpacity>

                        {editingEvent && (
                            <TouchableOpacity style={dynamicStyles.deleteButton} onPress={handleDeleteEvent}>
                                <Trash2 size={16} color={colors.primary} />
                                <Text style={dynamicStyles.deleteButtonText}>Delete Event</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Slightly off-white background
    },
});

// This will be replaced with dynamic styles created in the component
const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: colors.grayText,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 4,
    },
    card: {
        backgroundColor: colors.cardBg,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    navArrows: {
        flexDirection: 'row',
        gap: 16,
    },
    arrowBtn: {
        padding: 4,
    },
    calendarContainer: {
        width: '100%',
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gridCell: {
        width: (SCREEN_WIDTH - 80) / 7,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCellContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    weekDayText: {
        fontSize: 12,
        color: colors.grayText,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    dayText: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
    },
    selectedDayCell: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    selectedDayText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    eventDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.primary,
        position: 'absolute',
        bottom: 4,
    },
    eventDotSelected: {
        backgroundColor: '#FFFFFF',
    },
    indicatorContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 2,
        gap: 3,
    },
    indicatorDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    legendContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: colors.grayText,
    },
    scheduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    scheduleHeaderDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    scheduleHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.grayText,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomColor: colors.border,
    },
    taskColorBar: {
        width: 4,
        height: 32,
        borderRadius: 2,
        marginRight: 16,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    taskMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '600',
    },
    taskTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    taskTime: {
        fontSize: 12,
        color: colors.grayText,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    emptyStateCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyStateText: {
        color: colors.grayText,
        fontSize: 14,
    },
    emptyWeekState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    weekItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    weekDateColumn: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    weekDayName: {
        fontSize: 11,
        color: colors.grayText,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    weekDateNum: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '600',
    },
    weekItemBar: {
        width: 3,
        height: 36,
        borderRadius: 2,
        marginRight: 12,
    },
    weekItemContent: {
        flex: 1,
    },
    weekItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    weekItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    weekItemTime: {
        fontSize: 12,
        color: colors.grayText,
        marginLeft: 4,
    },
    weekPriorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    weekPriorityText: {
        fontSize: 10,
        fontWeight: '600',
    },
    weekTypeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    weekTypeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomColor: colors.border,
    },
    eventColorBar: {
        width: 4,
        height: 32,
        borderRadius: 2,
        marginRight: 16,
    },
    eventContent: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    eventTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventTime: {
        fontSize: 14,
        color: colors.grayText,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    input: {
        backgroundColor: colors.lightGray,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 8,
    },
    deleteButtonText: {
        color: colors.primary,
        fontWeight: '600',
    },
    timePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.lightGray,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    timePickerText: {
        fontSize: 16,
        color: colors.text,
    },
    alarmToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.lightGray,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    alarmToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    alarmToggleText: {
        fontSize: 16,
        color: colors.text,
    },
    toggleSwitch: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.border,
        padding: 2,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];