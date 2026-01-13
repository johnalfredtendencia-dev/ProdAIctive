import { Audio } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { BookOpen, CheckCircle, ChevronDown, Coffee, Lock, Moon, Pause, Play, RotateCcw, Settings, SkipForward, Sun, Target, Unlock } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Dimensions, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabaseApi';

const { width } = Dimensions.get('window');

// Configure notifications (wrapped in try-catch for Expo Go compatibility)
try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} catch (error) {
    console.log('Notifications not fully supported in Expo Go');
}

// Generate proper UUID
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Task interface
interface Task {
    id: string;
    title: string;
    pomodoro?: {
        focusTime: number;
        breakTime: number;
        sessionsCount: number;
    };
    completed: boolean;
}

// Pomodoro settings defaults
const DEFAULT_FOCUS_TIME = 25 * 60; // 25 minutes
const DEFAULT_SHORT_BREAK = 5 * 60; // 5 minutes
const DEFAULT_LONG_BREAK = 15 * 60; // 15 minutes
const SESSIONS_UNTIL_LONG_BREAK = 4;

export default function FocusTab() {
    const { colors, isDarkMode, setIsDarkMode } = useTheme();
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
    const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS_TIME);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [totalFocusTime, setTotalFocusTime] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [focusDuration, setFocusDuration] = useState(25);
    const [shortBreakDuration, setShortBreakDuration] = useState(5);
    const [longBreakDuration, setLongBreakDuration] = useState(15);
    
    // Task selection states
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const alarmSoundRef = useRef<Audio.Sound | null>(null);

    // Play alarm sound
    const playAlarmSound = async () => {
        try {
            // Set audio mode to play even in silent mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: false,
            });

            // Load and play the alarm sound from URL
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
                { shouldPlay: true, isLooping: true, volume: 1.0 }
            );
            alarmSoundRef.current = sound;
            
            // Auto-stop after 30 seconds if not manually stopped
            setTimeout(async () => {
                await stopAlarmSound();
            }, 30000);
        } catch (error) {
            console.log('Could not play alarm sound:', error);
            // Enhanced vibration pattern as fallback
            Vibration.vibrate([0, 1000, 500, 1000, 500, 1000, 500, 1000], true);
        }
    };

    // Stop alarm sound
    const stopAlarmSound = async () => {
        try {
            // Cancel any ongoing vibration
            Vibration.cancel();
            
            if (alarmSoundRef.current) {
                await alarmSoundRef.current.stopAsync();
                await alarmSoundRef.current.unloadAsync();
                alarmSoundRef.current = null;
            }
        } catch (error) {
            console.log('Error stopping alarm:', error);
        }
    };

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (alarmSoundRef.current) {
                alarmSoundRef.current.unloadAsync();
            }
        };
    }, []);

    // Fetch tasks from Supabase
    useEffect(() => {
        fetchTasks();
        fetchTodayStats();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                const { data: userTasks, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('users_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching tasks:', error);
                    return;
                }

                if (userTasks) {
                    const formattedTasks: Task[] = userTasks.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        completed: t.is_completed || false,
                        pomodoro: t.pomodoro_focus_time ? {
                            focusTime: t.pomodoro_focus_time || 25,
                            breakTime: t.pomodoro_break_time || 5,
                            sessionsCount: t.pomodoro_sessions || 4,
                        } : undefined,
                    }));
                    setTasks(formattedTasks);
                }
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Fetch today's stats
    const fetchTodayStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { data: sessions, error } = await supabase
                    .from('focus_sessions')
                    .select('*')
                    .eq('users_id', user.id)
                    .order('created_at', { ascending: false });

                if (!error && sessions) {
                    const totalSessions = sessions.length;
                    const totalTime = sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
                    setSessionsCompleted(totalSessions);
                    setTotalFocusTime(totalTime);
                }
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Save session to Supabase
    const saveSession = async (duration: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;

            const { error } = await supabase.from('focus_sessions').insert([
                {
                    id: generateUUID(),
                    users_id: user.id,
                    task_id: selectedTask?.id || null,
                    task_title: selectedTask?.title || 'General Focus',
                    duration: duration,
                    break_duration: shortBreakDuration * 60,
                    sessions_completed: 1,
                    completed_at: new Date().toISOString(),
                }
            ]);

            if (error) {
                console.error('Error saving session:', error);
            }
        } catch (error) {
            console.error('Error saving session:', error);
        }
    };

    // Apply task pomodoro settings
    const selectTask = (task: Task | null) => {
        setSelectedTask(task);
        setShowTaskPicker(false);
        
        if (task?.pomodoro) {
            setFocusDuration(task.pomodoro.focusTime);
            setShortBreakDuration(task.pomodoro.breakTime);
            setTimeLeft(task.pomodoro.focusTime * 60);
        } else {
            // Reset to defaults
            setFocusDuration(25);
            setShortBreakDuration(5);
            setTimeLeft(25 * 60);
        }
        
        // Reset timer state
        setIsActive(false);
        setMode('focus');
        setCurrentStreak(0);
    };

    // Request notification permissions
    useEffect(() => {
        const requestPermissions = async () => {
            try {
                await Notifications.requestPermissionsAsync();
            } catch (error) {
                console.log('Notifications not fully supported in Expo Go');
            }
        };
        requestPermissions();
    }, []);

    // Handle back button when locked
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isLocked) {
                Alert.alert(
                    '🔒 Focus Mode Active',
                    'You cannot exit while in focus mode. Complete your session or unlock first.',
                    [{ text: 'Stay Focused', style: 'cancel' }]
                );
                return true; // Prevent back
            }
            return false; // Allow back
        });

        return () => backHandler.remove();
    }, [isLocked]);

    // Keep screen awake during focus
    useEffect(() => {
        if (isActive && mode === 'focus') {
            activateKeepAwakeAsync('focus-mode');
        } else {
            deactivateKeepAwake('focus-mode');
        }
        
        return () => {
            deactivateKeepAwake('focus-mode');
        };
    }, [isActive, mode]);

    // Timer logic
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
                
                // Track focus time
                if (mode === 'focus') {
                    setTotalFocusTime((prev) => prev + 1);
                }
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isActive, mode]);

    // Handle timer completion
    const handleTimerComplete = async () => {
        setIsActive(false);
        
        // Play alarm sound and vibrate
        await playAlarmSound();
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
        
        // Save session to Supabase if focus mode completed
        if (mode === 'focus') {
            await saveSession(focusDuration * 60);
        }
        
        // Send notification (wrapped in try-catch for Expo Go compatibility)
        try {
            const taskName = selectedTask?.title || 'Focus session';
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: mode === 'focus' ? '🎉 Focus Session Complete!' : '☕ Break Time Over!',
                    body: mode === 'focus' 
                        ? `Great work on "${taskName}"! Time for a break.` 
                        : 'Ready to focus again?',
                    sound: true,
                },
                trigger: null, // Immediate
            });
        } catch (error) {
            console.log('Notification not sent - Expo Go limitation');
        }

        if (mode === 'focus') {
            // Completed a focus session
            const newSessionsCompleted = sessionsCompleted + 1;
            const newStreak = currentStreak + 1;
            setSessionsCompleted(newSessionsCompleted);
            setCurrentStreak(newStreak);
            
            // Determine next break type
            if (newStreak >= SESSIONS_UNTIL_LONG_BREAK) {
                // Long break after 4 sessions
                Alert.alert(
                    '🎉 Amazing Work!',
                    `You've completed ${SESSIONS_UNTIL_LONG_BREAK} sessions! Time for a long break.`,
                    [
                        {
                            text: 'Stop Alarm',
                            onPress: async () => {
                                await stopAlarmSound();
                            },
                        },
                        {
                            text: 'Start Long Break',
                            onPress: async () => {
                                await stopAlarmSound();
                                setMode('longBreak');
                                setTimeLeft(longBreakDuration * 60);
                                setCurrentStreak(0);
                                setIsLocked(false);
                                setTimeout(() => setIsActive(true), 500);
                            },
                        },
                    ]
                );
            } else {
                // Short break
                Alert.alert(
                    '✅ Session Complete!',
                    `Session ${newStreak} of ${SESSIONS_UNTIL_LONG_BREAK} done. Take a short break!`,
                    [
                        {
                            text: 'Stop Alarm',
                            onPress: async () => {
                                await stopAlarmSound();
                            },
                        },
                        {
                            text: 'Start Break',
                            onPress: async () => {
                                await stopAlarmSound();
                                setMode('shortBreak');
                                setTimeLeft(shortBreakDuration * 60);
                                setIsLocked(false);
                                setTimeout(() => setIsActive(true), 500);
                            },
                        },
                        {
                            text: 'Skip Break',
                            style: 'cancel',
                            onPress: async () => {
                                await stopAlarmSound();
                                setTimeLeft(focusDuration * 60);
                            },
                        },
                    ]
                );
            }
        } else {
            // Break complete - back to focus
            Alert.alert(
                '⏰ Break Over!',
                'Ready to start another focus session?',
                [
                    {
                        text: 'Stop Alarm',
                        onPress: async () => {
                            await stopAlarmSound();
                        },
                    },
                    {
                        text: 'Start Focus',
                        onPress: async () => {
                            await stopAlarmSound();
                            setMode('focus');
                            setTimeLeft(focusDuration * 60);
                            setIsActive(true);
                            setIsLocked(true);
                        },
                    },
                    {
                        text: 'Not Yet',
                        style: 'cancel',
                        onPress: async () => {
                            await stopAlarmSound();
                            setMode('focus');
                            setTimeLeft(focusDuration * 60);
                        },
                    },
                ]
            );
        }
    };

    const toggleTimer = () => {
        if (!isActive) {
            // Starting timer
            setIsActive(true);
            setSessionStartTime(new Date());
            if (mode === 'focus') {
                setIsLocked(true);
            }
            startTimeRef.current = Date.now();
        } else {
            // Pausing timer
            if (isLocked && mode === 'focus') {
                Alert.alert(
                    '🔒 Focus Mode Active',
                    `Are you sure you want to pause "${selectedTask?.title || 'Focus session'}"? Stay focused!`,
                    [
                        { text: 'Keep Going', style: 'cancel' },
                        { 
                            text: 'Pause Anyway', 
                            style: 'destructive',
                            onPress: () => setIsActive(false)
                        },
                    ]
                );
            } else {
                setIsActive(false);
            }
        }
    };

    const resetTimer = () => {
        if (isLocked) {
            Alert.alert(
                '🔒 Focus Mode Active',
                'You cannot reset while locked. Complete your session first.',
                [{ text: 'OK', style: 'cancel' }]
            );
            return;
        }
        setIsActive(false);
        setTimeLeft(
            mode === 'focus' 
                ? focusDuration * 60 
                : mode === 'shortBreak' 
                    ? shortBreakDuration * 60 
                    : longBreakDuration * 60
        );
    };

    const switchMode = () => {
        if (isLocked) {
            Alert.alert(
                '🔒 Focus Mode Active',
                'You cannot switch modes while locked. Complete your session first.',
                [{ text: 'OK', style: 'cancel' }]
            );
            return;
        }
        setIsActive(false);
        if (mode === 'focus') {
            setMode('shortBreak');
            setTimeLeft(shortBreakDuration * 60);
        } else {
            setMode('focus');
            setTimeLeft(focusDuration * 60);
        }
    };

    const toggleLock = () => {
        if (isLocked) {
            Alert.alert(
                '🔓 Unlock Focus Mode?',
                'Unlocking will allow you to exit. Are you sure?',
                [
                    { text: 'Stay Locked', style: 'cancel' },
                    { 
                        text: 'Unlock', 
                        style: 'destructive',
                        onPress: () => setIsLocked(false)
                    },
                ]
            );
        } else {
            setIsLocked(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
    };

    const formatTotalTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    };

    const getModeColor = () => {
        switch (mode) {
            case 'focus': return colors.primary;
            case 'shortBreak': return '#4CAF50';
            case 'longBreak': return '#2196F3';
            default: return colors.primary;
        }
    };

    const getModeLabel = () => {
        switch (mode) {
            case 'focus': return 'Focus Time';
            case 'shortBreak': return 'Short Break';
            case 'longBreak': return 'Long Break';
            default: return 'Focus Time';
        }
    };

    const getModeIcon = () => {
        switch (mode) {
            case 'focus': return <BookOpen size={32} color="white" />;
            case 'shortBreak': return <Coffee size={32} color="white" />;
            case 'longBreak': return <Coffee size={32} color="white" />;
            default: return <BookOpen size={32} color="white" />;
        }
    };

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: 24, paddingBottom: 120 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
        title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
        subtitle: { fontSize: 14, color: colors.grayText, marginTop: 4 },
        modeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
        modeText: { fontSize: 12, fontWeight: '600', color: colors.text },
        timerCard: { borderRadius: 32, padding: 32, alignItems: 'center', marginBottom: 24 },
        iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
        timerText: { fontSize: 64, fontWeight: 'bold', color: colors.text, fontVariant: ['tabular-nums'], marginBottom: 32 },
        controls: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' },
        controlButtonSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.cardBg, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: colors.border },
        controlButtonMain: { height: 56, paddingHorizontal: 32, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
        mainButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
        progressSection: { marginTop: 8 },
        sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
        progressCard: { backgroundColor: colors.cardBg, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
        statRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
        statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
        statInfo: { flex: 1 },
        statLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
        statSub: { fontSize: 12, color: colors.grayText, marginTop: 2 },
        countBadge: { backgroundColor: colors.accentBlue, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
        countText: { color: colors.primary, fontWeight: 'bold' },
        divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
        dots: { flexDirection: 'row', gap: 6 },
        dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lightGray },
        dotActive: { backgroundColor: colors.secondary },
        lockIndicator: { 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: colors.primary + '20', 
            paddingVertical: 8, 
            paddingHorizontal: 16, 
            borderRadius: 20,
            marginBottom: 16,
            gap: 8,
        },
        lockText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
        settingsButton: { 
            padding: 8, 
            backgroundColor: colors.cardBg, 
            borderRadius: 20, 
            borderWidth: 1, 
            borderColor: colors.border 
        },
        modalOverlay: { 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: 20 
        },
        modalContent: { 
            backgroundColor: colors.background, 
            borderRadius: 24, 
            padding: 24, 
            width: '100%', 
            maxWidth: 340 
        },
        modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
        settingRow: { 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        settingLabel: { fontSize: 16, color: colors.text },
        settingValue: { 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 12 
        },
        settingBtn: { 
            width: 36, 
            height: 36, 
            borderRadius: 18, 
            backgroundColor: colors.lightGray, 
            justifyContent: 'center', 
            alignItems: 'center' 
        },
        settingBtnText: { fontSize: 20, color: colors.text, fontWeight: 'bold' },
        settingNumber: { fontSize: 18, fontWeight: 'bold', color: colors.primary, minWidth: 30, textAlign: 'center' },
        closeButton: { 
            marginTop: 20, 
            backgroundColor: colors.primary, 
            padding: 16, 
            borderRadius: 12, 
            alignItems: 'center' 
        },
        closeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
        taskSelector: {
            backgroundColor: colors.cardBg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },
        taskSelectorLabel: {
            fontSize: 12,
            color: colors.grayText,
            marginBottom: 8,
            fontWeight: '600',
            textTransform: 'uppercase',
        },
        taskSelectorButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        taskSelectorText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            flex: 1,
        },
        taskSelectorPlaceholder: {
            color: colors.grayText,
        },
        taskPickerContent: {
            backgroundColor: colors.background,
            borderRadius: 24,
            padding: 20,
            width: '100%',
            maxWidth: 340,
            maxHeight: '70%',
        },
        taskPickerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 16,
        },
        taskItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.cardBg,
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },
        taskItemSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.primary + '10',
        },
        taskItemText: {
            flex: 1,
            fontSize: 16,
            color: colors.text,
            marginLeft: 12,
        },
        taskItemPomodoro: {
            fontSize: 12,
            color: colors.grayText,
        },
        noTaskOption: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.lightGray,
            borderRadius: 12,
            marginBottom: 8,
        },
        currentTaskBadge: {
            backgroundColor: colors.primary + '15',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        currentTaskLabel: {
            fontSize: 12,
            color: colors.grayText,
            fontWeight: '600',
        },
        currentTaskTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.primary,
            flex: 1,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Lock Indicator */}
                {isLocked && (
                    <View style={styles.lockIndicator}>
                        <Lock size={16} color={colors.primary} />
                        <Text style={styles.lockText}>Focus Mode Locked - Stay Focused!</Text>
                    </View>
                )}

                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Pomodoro Timer</Text>
                        <Text style={styles.subtitle}>{sessionsCompleted} sessions completed today</Text>
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
                            onPress={() => !isLocked && setShowSettings(true)} 
                            style={[styles.settingsButton, isLocked && { opacity: 0.5 }]}
                        >
                            <Settings size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Task Selector */}
                <TouchableOpacity 
                    style={[styles.taskSelector, isLocked && { opacity: 0.5 }]}
                    onPress={() => !isLocked && !isActive && setShowTaskPicker(true)}
                    disabled={isLocked || isActive}
                >
                    <Text style={styles.taskSelectorLabel}>Working On</Text>
                    <View style={styles.taskSelectorButton}>
                        <Text style={[
                            styles.taskSelectorText, 
                            !selectedTask && styles.taskSelectorPlaceholder
                        ]}>
                            {selectedTask ? selectedTask.title : 'Select a task to focus on...'}
                        </Text>
                        <ChevronDown size={20} color={colors.grayText} />
                    </View>
                    {selectedTask?.pomodoro && (
                        <Text style={{ color: colors.grayText, fontSize: 12, marginTop: 8 }}>
                            ⏱️ {selectedTask.pomodoro.focusTime}min focus / {selectedTask.pomodoro.breakTime}min break
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Current Task Badge (when active) */}
                {isActive && selectedTask && (
                    <View style={styles.currentTaskBadge}>
                        <BookOpen size={18} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.currentTaskLabel}>Currently focusing on:</Text>
                            <Text style={styles.currentTaskTitle} numberOfLines={1}>{selectedTask.title}</Text>
                        </View>
                    </View>
                )}

                {/* Mode Badge */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
                    <TouchableOpacity onPress={switchMode} style={[styles.modeBadge, { borderColor: getModeColor() }]}>
                        {mode === 'focus' ? (
                            <BookOpen size={14} color={getModeColor()} style={{ marginRight: 4 }} />
                        ) : (
                            <Coffee size={14} color={getModeColor()} style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.modeText, { color: getModeColor() }]}>{getModeLabel()}</Text>
                    </TouchableOpacity>
                </View>

                {/* Timer Card */}
                <View style={[styles.timerCard, { backgroundColor: getModeColor() + '15' }]}>
                    <View style={[styles.iconCircle, { backgroundColor: getModeColor() }]}>
                        {getModeIcon()}
                    </View>

                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.controlButtonSmall} onPress={resetTimer}>
                            <RotateCcw size={20} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.controlButtonMain, { backgroundColor: getModeColor() }]}
                            onPress={toggleTimer}
                        >
                            {isActive ? <Pause size={24} color="white" fill="white" /> : <Play size={24} color="white" fill="white" />}
                            <Text style={styles.mainButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.controlButtonSmall} onPress={switchMode}>
                            <SkipForward size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Lock Toggle Button */}
                    {mode === 'focus' && (
                        <TouchableOpacity 
                            onPress={toggleLock} 
                            style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                        >
                            {isLocked ? (
                                <>
                                    <Lock size={18} color={colors.primary} />
                                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Tap to Unlock</Text>
                                </>
                            ) : (
                                <>
                                    <Unlock size={18} color={colors.grayText} />
                                    <Text style={{ color: colors.grayText, fontWeight: '600' }}>Tap to Lock</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>Today's Progress</Text>

                    <View style={styles.progressCard}>
                        <View style={styles.statRow}>
                            <View style={[styles.statIcon, { backgroundColor: colors.lightGray }]}>
                                <BookOpen size={20} color={colors.primary} />
                            </View>
                            <View style={styles.statInfo}>
                                <Text style={styles.statLabel}>Work Sessions</Text>
                                <Text style={styles.statSub}>{formatTotalTime(totalFocusTime)} focused</Text>
                            </View>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{sessionsCompleted}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statRow}>
                            <View style={[styles.statIcon, { backgroundColor: colors.accentBlue }]}>
                                <Target size={20} color={colors.accentBlueText} />
                            </View>
                            <View style={styles.statInfo}>
                                <Text style={styles.statLabel}>Current Streak</Text>
                                <Text style={styles.statSub}>{currentStreak} / {SESSIONS_UNTIL_LONG_BREAK} until long break</Text>
                            </View>
                            <View style={styles.dots}>
                                {[...Array(SESSIONS_UNTIL_LONG_BREAK)].map((_, i) => (
                                    <View key={i} style={[styles.dot, i < currentStreak && styles.dotActive]} />
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Settings Modal */}
            <Modal
                visible={showSettings}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSettings(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>⚙️ Timer Settings</Text>

                        {/* Focus Duration */}
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Focus Duration</Text>
                            <View style={styles.settingValue}>
                                <TouchableOpacity 
                                    style={styles.settingBtn} 
                                    onPress={() => setFocusDuration(Math.max(5, focusDuration - 5))}
                                >
                                    <Text style={styles.settingBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.settingNumber}>{focusDuration}</Text>
                                <TouchableOpacity 
                                    style={styles.settingBtn} 
                                    onPress={() => setFocusDuration(Math.min(60, focusDuration + 5))}
                                >
                                    <Text style={styles.settingBtnText}>+</Text>
                                </TouchableOpacity>
                                <Text style={{ color: colors.grayText }}>min</Text>
                            </View>
                        </View>

                        {/* Short Break Duration */}
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Short Break</Text>
                            <View style={styles.settingValue}>
                                <TouchableOpacity 
                                    style={styles.settingBtn} 
                                    onPress={() => setShortBreakDuration(Math.max(1, shortBreakDuration - 1))}
                                >
                                    <Text style={styles.settingBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.settingNumber}>{shortBreakDuration}</Text>
                                <TouchableOpacity 
                                    style={styles.settingBtn} 
                                    onPress={() => setShortBreakDuration(Math.min(15, shortBreakDuration + 1))}
                                >
                                    <Text style={styles.settingBtnText}>+</Text>
                                </TouchableOpacity>
                                <Text style={{ color: colors.grayText }}>min</Text>
                            </View>
                        </View>

                        {/* Long Break Duration */}
                        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.settingLabel}>Long Break</Text>
                            <View style={styles.settingValue}>
                                <TouchableOpacity 
                                    style={styles.settingBtn} 
                                    onPress={() => setLongBreakDuration(Math.max(5, longBreakDuration - 5))}
                                >
                                    <Text style={styles.settingBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.settingNumber}>{longBreakDuration}</Text>
                                <TouchableOpacity 
                                    style={styles.settingBtn} 
                                    onPress={() => setLongBreakDuration(Math.min(30, longBreakDuration + 5))}
                                >
                                    <Text style={styles.settingBtnText}>+</Text>
                                </TouchableOpacity>
                                <Text style={{ color: colors.grayText }}>min</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => {
                                setShowSettings(false);
                                // Apply new duration if timer not running
                                if (!isActive) {
                                    setTimeLeft(
                                        mode === 'focus' 
                                            ? focusDuration * 60 
                                            : mode === 'shortBreak' 
                                                ? shortBreakDuration * 60 
                                                : longBreakDuration * 60
                                    );
                                }
                            }}
                        >
                            <Text style={styles.closeButtonText}>Save Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Task Picker Modal */}
            <Modal
                visible={showTaskPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTaskPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.taskPickerContent}>
                        <Text style={styles.taskPickerTitle}>📋 Select a Task</Text>
                        
                        {/* General Focus Option */}
                        <TouchableOpacity 
                            style={[styles.noTaskOption, !selectedTask && styles.taskItemSelected]}
                            onPress={() => selectTask(null)}
                        >
                            <BookOpen size={20} color={colors.primary} />
                            <Text style={styles.taskItemText}>General Focus (No specific task)</Text>
                            {!selectedTask && <CheckCircle size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <Text style={{ color: colors.grayText, marginVertical: 12, fontSize: 12, fontWeight: '600' }}>
                            YOUR TASKS ({tasks.length})
                        </Text>

                        <FlatList
                            data={tasks}
                            keyExtractor={(item) => item.id}
                            style={{ maxHeight: 300 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[
                                        styles.taskItem, 
                                        selectedTask?.id === item.id && styles.taskItemSelected
                                    ]}
                                    onPress={() => selectTask(item)}
                                >
                                    <BookOpen size={20} color={selectedTask?.id === item.id ? colors.primary : colors.grayText} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.taskItemText} numberOfLines={1}>{item.title}</Text>
                                        {item.pomodoro && (
                                            <Text style={styles.taskItemPomodoro}>
                                                ⏱️ {item.pomodoro.focusTime}min focus / {item.pomodoro.breakTime}min break
                                            </Text>
                                        )}
                                    </View>
                                    {selectedTask?.id === item.id && <CheckCircle size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={{ color: colors.grayText, textAlign: 'center', padding: 20 }}>
                                    No tasks yet. Add a task from the Tasks tab!
                                </Text>
                            }
                        />

                        <TouchableOpacity 
                            style={[styles.closeButton, { marginTop: 16 }]} 
                            onPress={() => setShowTaskPicker(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}