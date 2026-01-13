import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    Calendar,
    Check,
    CheckSquare,
    Clock,
    Moon,
    Plus,
    Sun,
    Trash2,
    TrendingUp
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabaseApi';

// Empty for new users - data comes from database
const initialTasks: any[] = [];

// Helper function to format time from 24h to 12h format
const formatTime = (time: string | null): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to check if an event time has passed
const isEventPassed = (eventTime: string): boolean => {
    if (!eventTime) return false;
    const now = new Date();
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventDate = new Date();
    eventDate.setHours(hours, minutes, 0, 0);
    return now > eventDate;
};

// Helper function to get priority colors
const getPriorityColor = (priority: string | null, colors: any) => {
    switch (priority?.toLowerCase()) {
        case 'high':
            return { bg: colors.accentPink, text: colors.accentPinkText };
        case 'medium':
            return { bg: colors.accentBlue, text: colors.accentBlueText };
        case 'low':
            return { bg: '#E8F5E9', text: '#4CAF50' };
        default:
            return { bg: colors.accentBlue, text: colors.accentBlueText };
    }
};

export default function DashboardScreen() {
    const { colors, isDarkMode, setIsDarkMode } = useTheme();
    const router = useRouter();
    const [tasks, setTasks] = useState(initialTasks);
    const [events, setEvents] = useState<any[]>([]);
    const [userName, setUserName] = useState('User');
    const [userEmail, setUserEmail] = useState('');
    const [avatarInitials, setAvatarInitials] = useState('U');
    const [currentDate, setCurrentDate] = useState('');
    const [tasksCount, setTasksCount] = useState(0);
    const [completedTasksCount, setCompletedTasksCount] = useState(0);
    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
    const [todayEvents, setTodayEvents] = useState<any[]>([]);
    const [eventsCount, setEventsCount] = useState(0);
    const [remainingTasks, setRemainingTasks] = useState(0);

    // Calculate progress dynamically (for today's tasks only)
    const todayTasksCount = todaySchedule.length;
    const todayCompletedCount = todaySchedule.filter((t: any) => t.isDone).length;
    const progressPercent = todayTasksCount > 0 ? Math.round((todayCompletedCount / todayTasksCount) * 100) : 0;

    // Dynamic Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Fetch all data function
    const fetchData = async () => {
        try {
            // Set current date
            const today = new Date();
            const dateString = today.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            setCurrentDate(dateString);
            const todayStr = today.toISOString().split('T')[0];

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserEmail(user.email || '');

                // Get user profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.log('Profile error:', profileError);
                }

                if (profile?.full_name && profile.full_name.trim() !== '') {
                    setUserName(profile.full_name);
                    const nameParts = profile.full_name.trim().split(/\s+/);
                    const firstLetter = nameParts[0]?.[0]?.toUpperCase() || '';
                    const lastLetter = nameParts[nameParts.length - 1]?.[0]?.toUpperCase() || '';
                    const initials = (firstLetter + lastLetter).toUpperCase();
                    setAvatarInitials(initials || 'U');
                } else {
                    const emailName = user.email?.split('@')[0] || 'User';
                    setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
                    setAvatarInitials(emailName[0]?.toUpperCase() || 'U');
                }

                // Fetch user's tasks (only today and future, not completed)
                const { data: userTasks } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('users_id', user.id)
                    .gte('due_date', todayStr)
                    .order('due_date', { ascending: true });

                // Fetch calendar events for today
                const { data: calendarEvents } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('event_date', todayStr);

                if (userTasks && userTasks.length > 0) {
                    const formattedTasks = userTasks.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        isDone: t.is_completed || false,
                        dueDate: t.due_date,
                        dueTime: t.due_time,
                        priority: t.priority,
                        subject: t.subject,
                        type: 'task',
                    }));
                    setTasks(formattedTasks);
                    setTasksCount(formattedTasks.length);
                    setCompletedTasksCount(formattedTasks.filter((t: any) => t.isDone).length);
                    setRemainingTasks(formattedTasks.filter((t: any) => !t.isDone).length);

                    // Filter today's tasks
                    const todayTasks = formattedTasks.filter((t: any) => t.dueDate === todayStr);
                    setTodaySchedule(todayTasks);
                } else {
                    setTasks([]);
                    setTasksCount(0);
                    setTodaySchedule([]);
                    setCompletedTasksCount(0);
                    setRemainingTasks(0);
                }

                // Format calendar events - filter out events that have already passed
                if (calendarEvents && calendarEvents.length > 0) {
                    const formattedEvents = calendarEvents
                        .filter((e: any) => !isEventPassed(e.event_time)) // Remove past events
                        .map((e: any) => ({
                            id: e.id,
                            title: e.title,
                            time: e.event_time,
                            color: e.color,
                            type: 'event',
                        }));
                    setTodayEvents(formattedEvents);
                    setEventsCount(formattedEvents.length);
                    setEvents(calendarEvents.filter((e: any) => !isEventPassed(e.event_time)));
                } else {
                    setTodayEvents([]);
                    setEventsCount(0);
                    setEvents([]);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Fetch user data and tasks on component load
    useEffect(() => {
        fetchData();
    }, []);

    // Auto-refresh every minute to update events (remove past events)
    useEffect(() => {
        const interval = setInterval(() => {
            // Filter out past events from current state
            const currentEvents = todayEvents.filter((e: any) => !isEventPassed(e.time));
            if (currentEvents.length !== todayEvents.length) {
                setTodayEvents(currentEvents);
                setEventsCount(currentEvents.length);
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [todayEvents]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const handleToggleTask = async (id: string) => {
        try {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const newIsDone = !task.isDone;

            // Update in Supabase
            const { error } = await supabase
                .from('tasks')
                .update({ is_completed: newIsDone })
                .eq('id', id);

            if (error) {
                console.error('Error updating task:', error);
                return;
            }

            // Update local state
            const updatedTasks = tasks.map((t) =>
                t.id === id ? { ...t, isDone: newIsDone } : t
            );
            setTasks(updatedTasks);

            // Update all counts
            setCompletedTasksCount(updatedTasks.filter((t: any) => t.isDone).length);
            setRemainingTasks(updatedTasks.filter((t: any) => !t.isDone).length);
            setTasksCount(updatedTasks.length);

            // Update today's schedule
            const todayStr = new Date().toISOString().split('T')[0];
            const todayTasks = updatedTasks.filter((t: any) => t.dueDate === todayStr);
            setTodaySchedule(todayTasks);
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const handleDeleteTask = (id: string) => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Delete from Supabase
                            const { error } = await supabase
                                .from('tasks')
                                .delete()
                                .eq('id', id);

                            if (error) {
                                console.error('Error deleting task:', error);
                                return;
                            }

                            const updatedTasks = tasks.filter((task) => task.id !== id);
                            setTasks(updatedTasks);
                            setTasksCount(updatedTasks.length);
                            setCompletedTasksCount(updatedTasks.filter((t: any) => t.isDone).length);
                            setRemainingTasks(updatedTasks.filter((t: any) => !t.isDone).length);
                            
                            // Update today's schedule
                            const todayStr = new Date().toISOString().split('T')[0];
                            setTodaySchedule(updatedTasks.filter((t: any) => t.dueDate === todayStr));
                        } catch (error) {
                            console.error('Error deleting task:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteEvent = (id: string) => {
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
                            const { error } = await supabase
                                .from('calendar_events')
                                .delete()
                                .eq('id', id);

                            if (error) {
                                console.error('Error deleting event:', error);
                                return;
                            }

                            const updatedEvents = todayEvents.filter((e) => e.id !== id);
                            setTodayEvents(updatedEvents);
                            setEventsCount(updatedEvents.length);
                        } catch (error) {
                            console.error('Error deleting event:', error);
                        }
                    }
                }
            ]
        );
    };

    // Create styles dynamically based on theme
    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { padding: 24, paddingBottom: 100 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
        brandTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
        brandSubtitle: { fontSize: 12, color: colors.grayText },
        avatarCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
        avatarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
        section: { marginBottom: 24 },
        greetingTitle: { fontSize: 26, fontWeight: 'bold', color: colors.text },
        greetingSubtitle: { fontSize: 16, color: colors.grayText },
        quickActions: { flexDirection: 'row', gap: 16, marginBottom: 24 },
        actionButtonPrimary: { flex: 1, height: 60, borderRadius: 16, overflow: 'hidden' },
        gradientBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
        actionButtonTextPrimary: { color: '#FFF', fontWeight: '600' },
        actionButtonSecondary: { flex: 1, height: 60, backgroundColor: colors.cardBg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
        actionButtonTextSecondary: { color: colors.grayText, fontWeight: '600' },
        statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
        statCard: { backgroundColor: colors.cardBg, borderRadius: 16, padding: 12, width: '31%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
        statIcon: { padding: 8, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 8 },
        statLabel: { fontSize: 10, color: colors.grayText, fontWeight: '600', textTransform: 'uppercase' },
        statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
        sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
        sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
        card: { backgroundColor: colors.cardBg, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
        scheduleItem: { flexDirection: 'row' },
        timelineColumn: { alignItems: 'center', marginRight: 16, width: 20 },
        timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 },
        timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 },
        scheduleContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        scheduleTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
        scheduleTime: { fontSize: 12, color: colors.grayText, marginTop: 4 },
        tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
        tagText: { fontSize: 12, fontWeight: '500' },
        taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.lightGray, borderRadius: 12, marginBottom: 8 },
        taskRowDone: { backgroundColor: colors.accentBlue },
        checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
        checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
        taskTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
        taskTitleDone: { textDecorationLine: 'line-through', color: colors.grayText },
        taskText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
        taskTextDone: { color: colors.grayText, textDecorationLine: 'line-through' },
        deleteButton: { padding: 4 },
        emptyText: { textAlign: 'center', color: colors.grayText, padding: 16 },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
        modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
        input: { flex: 1, backgroundColor: colors.lightGray, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, color: colors.text },
        primaryButton: { borderRadius: 12, overflow: 'hidden' },
        gradientButton: { padding: 16, alignItems: 'center' },
        primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
        // New styles for schedule items
        scheduleSubtitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
        scheduleItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
        scheduleItemDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
        scheduleItemContent: { flex: 1 },
        scheduleItemTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
        scheduleItemTitleDone: { textDecorationLine: 'line-through', color: colors.grayText },
        scheduleItemTime: { fontSize: 12, color: colors.grayText },
        scheduleCheckbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
        scheduleCheckboxDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
        priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
        priorityBadgeText: { fontSize: 10, fontWeight: '600' },
        // Progress section styles
        progressContainer: { marginBottom: 16 },
        progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        progressLabel: { fontSize: 14, color: colors.grayText },
        progressValue: { fontSize: 14, fontWeight: '600', color: colors.text },
        progressBarBg: { height: 8, backgroundColor: colors.lightGray, borderRadius: 4, overflow: 'hidden' },
        progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
        progressPercent: { fontSize: 12, color: colors.grayText, marginTop: 4, textAlign: 'right' },
        progressStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
        progressStatItem: { alignItems: 'center', flex: 1 },
        progressStatValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
        progressStatLabel: { fontSize: 12, color: colors.grayText, marginTop: 4 },
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brandTitle}>
                            Prod<Text style={{ color: colors.primary }}>AI</Text>ctive
                        </Text>
                        <Text style={styles.brandSubtitle}>{currentDate}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <TouchableOpacity 
                            onPress={() => setIsDarkMode(!isDarkMode)}
                            style={{ padding: 8 }}
                        >
                            {isDarkMode ? (
                                <Sun size={24} color={colors.text} />
                            ) : (
                                <Moon size={24} color={colors.text} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => router.push('/(tabs)/settings')}
                            style={[styles.avatarCircle, { backgroundColor: colors.primary }]}
                        >
                            <Text style={styles.avatarText}>{avatarInitials}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Greeting */}
                <View style={styles.section}>
                    <Text style={styles.greetingTitle}>{getGreeting()}, {userName}!</Text>
                    <Text style={styles.greetingSubtitle}>
                        {remainingTasks} tasks remaining • {eventsCount} events today
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.actionButtonPrimary}
                        onPress={() => router.push('/calendar')}
                    >
                        <LinearGradient
                            colors={[colors.primary, '#FF8085']}
                            style={styles.gradientBackground}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Calendar size={20} color="#FFF" />
                            <Text style={styles.actionButtonTextPrimary}>Calendar</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButtonSecondary}
                        onPress={() => router.push('/tasks')}
                    >
                        <Plus size={20} color={colors.grayText} />
                        <Text style={styles.actionButtonTextSecondary}>Add Task</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <StatCard
                        icon={<CheckSquare size={18} color={colors.accentBlueText} />}
                        bg={colors.accentBlue}
                        label="Remaining"
                        value={remainingTasks.toString()}
                        styles={styles}
                    />
                    <StatCard
                        icon={<Clock size={18} color="#4CAF50" />}
                        bg={colors.accentBlue}
                        label="Events"
                        value={eventsCount.toString()}
                        styles={styles}
                    />
                    <StatCard
                        icon={<TrendingUp size={18} color={colors.accentPinkText} />}
                        bg={colors.accentPink}
                        label="Today"
                        value={`${progressPercent}%`}
                        styles={styles}
                    />
                </View>

                {/* Today's Schedule */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        <TouchableOpacity onPress={() => router.push('/calendar')}>
                            <Plus size={20} color={colors.grayText} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        {todaySchedule.length === 0 && todayEvents.length === 0 ? (
                            <Text style={styles.emptyText}>No tasks or events scheduled for today</Text>
                        ) : (
                            <>
                                {/* Today's Events */}
                                {todayEvents.length > 0 && (
                                    <View style={{ marginBottom: todaySchedule.length > 0 ? 16 : 0 }}>
                                        <Text style={[styles.scheduleSubtitle, { color: '#FF5A5F' }]}>📅 Events</Text>
                                        {todayEvents.map((event, index) => (
                                            <View key={event.id} style={styles.scheduleItemRow}>
                                                <View style={[styles.scheduleItemDot, { backgroundColor: event.color || '#FF5A5F' }]} />
                                                <View style={styles.scheduleItemContent}>
                                                    <Text style={styles.scheduleItemTitle}>{event.title}</Text>
                                                    <Text style={styles.scheduleItemTime}>{event.time}</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => handleDeleteEvent(event.id)} style={{ padding: 4 }}>
                                                    <Trash2 size={16} color={colors.grayText} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                
                                {/* Today's Tasks */}
                                {todaySchedule.length > 0 && (
                                    <View>
                                        <Text style={[styles.scheduleSubtitle, { color: '#4CAF50' }]}>✅ Tasks</Text>
                                        {todaySchedule.map((task, index) => (
                                            <View key={task.id} style={styles.scheduleItemRow}>
                                                <TouchableOpacity 
                                                    onPress={() => handleToggleTask(task.id)}
                                                    style={[styles.scheduleCheckbox, task.isDone && styles.scheduleCheckboxDone]}
                                                >
                                                    {task.isDone && <Check size={12} color="white" />}
                                                </TouchableOpacity>
                                                <View style={styles.scheduleItemContent}>
                                                    <Text style={[styles.scheduleItemTitle, task.isDone && styles.scheduleItemTitleDone]}>
                                                        {task.title}
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        {task.dueTime && <Text style={styles.scheduleItemTime}>{formatTime(task.dueTime)}</Text>}
                                                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority, colors).bg }]}>
                                                            <Text style={[styles.priorityBadgeText, { color: getPriorityColor(task.priority, colors).text }]}>
                                                                {task.priority}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <TouchableOpacity onPress={() => handleDeleteTask(task.id)} style={{ padding: 4 }}>
                                                    <Trash2 size={16} color={colors.grayText} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>

                {/* Today's Progress */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Progress</Text>
                        {progressPercent === 100 && todayTasksCount > 0 && (
                            <Text style={{ color: '#4CAF50', fontWeight: '600' }}>🎉 All Done!</Text>
                        )}
                    </View>
                    <View style={styles.card}>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Tasks Completed</Text>
                                <Text style={styles.progressValue}>{todayCompletedCount}/{todayTasksCount}</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[
                                    styles.progressBarFill, 
                                    { 
                                        width: `${progressPercent}%`,
                                        backgroundColor: progressPercent === 100 ? '#4CAF50' : colors.primary
                                    }
                                ]} />
                            </View>
                            <Text style={[
                                styles.progressPercent,
                                progressPercent === 100 && { color: '#4CAF50', fontWeight: '600' }
                            ]}>
                                {progressPercent}% Complete {progressPercent === 100 && todayTasksCount > 0 ? '✓' : ''}
                            </Text>
                        </View>
                        
                        <View style={styles.progressStats}>
                            <View style={styles.progressStatItem}>
                                <Text style={styles.progressStatValue}>{todayTasksCount}</Text>
                                <Text style={styles.progressStatLabel}>Total Tasks</Text>
                            </View>
                            <View style={[styles.progressStatItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }]}>
                                <Text style={[styles.progressStatValue, { color: '#4CAF50' }]}>{todayCompletedCount}</Text>
                                <Text style={styles.progressStatLabel}>Completed</Text>
                            </View>
                            <View style={styles.progressStatItem}>
                                <Text style={[styles.progressStatValue, { color: todayTasksCount - todayCompletedCount > 0 ? '#FF5A5F' : '#4CAF50' }]}>
                                    {todayTasksCount - todayCompletedCount}
                                </Text>
                                <Text style={styles.progressStatLabel}>Remaining</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Upcoming Tasks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
                        <TouchableOpacity onPress={() => router.push('/tasks')}>
                            <Plus size={20} color={colors.grayText} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        {tasks.length === 0 ? (
                            <Text style={styles.emptyText}>No upcoming tasks. Add one!</Text>
                        ) : (
                            tasks.map((task) => (
                                <TouchableOpacity
                                    key={task.id}
                                    style={[styles.taskRow, task.isDone && styles.taskRowDone]}
                                    onPress={() => handleToggleTask(task.id)}
                                >
                                    <View style={[styles.checkbox, task.isDone && styles.checkboxDone]}>
                                        {task.isDone && <Check size={14} color="white" />}
                                    </View>

                                    <Text style={[styles.taskText, task.isDone && styles.taskTextDone]}>
                                        {task.title}
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => handleDeleteTask(task.id)}
                                        style={styles.deleteButton}
                                    >
                                        <Trash2 size={18} color={colors.grayText} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Sub-components
function StatCard({ icon, bg, label, value, styles }: any) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: bg }]}>
                {icon}
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );
}

function ScheduleItem({ title, time, tag, color, textColor, isLast, styles }: any) {
    return (
        <View style={[styles.scheduleItem, { marginBottom: isLast ? 0 : 24 }]}>
            <View style={styles.timelineColumn}>
                <View style={styles.timelineDot} />
                {!isLast && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.scheduleContent}>
                <View>
                    <Text style={styles.scheduleTitle}>{title}</Text>
                    <Text style={styles.scheduleTime}>{time}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: color }]}>
                    <Text style={[styles.tagText, { color: textColor }]}>{tag}</Text>
                </View>
            </View>
        </View>
    );
}
