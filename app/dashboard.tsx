import { LinearGradient } from 'expo-linear-gradient';
import {
    Calendar,
    Check,
    CheckSquare,
    Plus,
    Trash2,
    TrendingUp,
    UserCircle,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Theme = {
    primary: '#FF5A5F',
    background: '#FAFAFA',
    text: '#2D3436',
    grayText: '#A0A0A0',
    lightGray: '#F5F5F5',
    cardBg: '#FFFFFF',
    accentBlue: '#E3F2FD',
    accentBlueText: '#2196F3',
    accentPink: '#FCE4EC',
    accentPinkText: '#E91E63',
};

// Mock Data
const initialTasks = [
    { id: '1', title: 'Review Chapter 3 notes', isDone: false },
    { id: '2', title: 'Start on Calculus homework', isDone: false },
    { id: '3', title: 'Plan presentation outline', isDone: true },
];

export default function DashboardScreen() {
    const [tasks, setTasks] = useState(initialTasks);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [isAddTaskModalVisible, setAddTaskModalVisible] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // Dynamic Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const handleToggleTask = (id: string) => {
        setTasks(tasks.map((task) =>
            task.id === id ? { ...task, isDone: !task.isDone } : task
        ));
    };

    const handleAddTask = () => {
        if (newTaskTitle.trim() === '') return;
        const newTask = {
            id: Date.now().toString(),
            title: newTaskTitle.trim(),
            isDone: false,
        };
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setAddTaskModalVisible(false);
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
                    onPress: () => setTasks(tasks.filter((task) => task.id !== id))
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brandTitle}>
                            Prod<Text style={{ color: Theme.primary }}>AI</Text>ctive
                        </Text>
                        <Text style={styles.brandSubtitle}>Study companion</Text>
                    </View>
                    <UserCircle size={36} color="#D1D5DB" />
                </View>

                {/* Greeting */}
                <View style={styles.section}>
                    <Text style={styles.greetingTitle}>{getGreeting()}, Alex!</Text>
                    <Text style={styles.greetingSubtitle}>You have 3 tasks due today</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.actionButtonPrimary}
                        onPress={() => setCalendarVisible(true)}
                    >
                        <LinearGradient
                            colors={[Theme.primary, '#FF8085']}
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
                        onPress={() => setAddTaskModalVisible(true)}
                    >
                        <Plus size={20} color={Theme.grayText} />
                        <Text style={styles.actionButtonTextSecondary}>Quick Add</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <StatCard
                        icon={<CheckSquare size={18} color={Theme.primary} />}
                        bg="#FFF0F0"
                        label="Tasks"
                        value="12"
                    />
                    <StatCard
                        icon={<Calendar size={18} color="#FFB300" />}
                        bg="#FFF8E1"
                        label="Events"
                        value="5"
                    />
                    <StatCard
                        icon={<TrendingUp size={18} color="#9C27B0" />}
                        bg="#F3E5F5"
                        label="Progress"
                        value="78%"
                    />
                </View>

                {/* Today's Schedule */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        <TouchableOpacity><Plus size={20} color={Theme.grayText} /></TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <ScheduleItem
                            title="Math Lecture"
                            time="09:00 AM"
                            tag="study"
                            color={Theme.accentBlue}
                            textColor={Theme.accentBlueText}
                            isLast={false}
                        />
                        <ScheduleItem
                            title="Project Meeting"
                            time="02:00 PM"
                            tag="meeting"
                            color={Theme.accentPink}
                            textColor={Theme.accentPinkText}
                            isLast={false}
                        />
                        <ScheduleItem
                            title="Physics Lab"
                            time="04:00 PM"
                            tag="study"
                            color={Theme.accentBlue}
                            textColor={Theme.accentBlueText}
                            isLast={true}
                        />
                    </View>
                </View>

                {/* Upcoming Tasks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
                        <TouchableOpacity onPress={() => setAddTaskModalVisible(true)}>
                            <Plus size={20} color={Theme.grayText} />
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
                                        <Trash2 size={18} color={Theme.grayText} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Calendar Modal */}
            <Modal
                visible={isCalendarVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCalendarVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Calendar</Text>
                        <View style={styles.placeholderBox}>
                            <Text style={styles.placeholderText}>Calendar Component Placeholder</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setCalendarVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Task Modal */}
            <Modal
                visible={isAddTaskModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAddTaskModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Task</Text>
                            <TouchableOpacity onPress={() => setAddTaskModalVisible(false)}>
                                <X size={24} color={Theme.grayText} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Finish math assignment"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleAddTask}
                        >
                            <LinearGradient
                                colors={[Theme.primary, '#FF8085']}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.primaryButtonText}>Add Task</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

// Sub-components
function StatCard({ icon, bg, label, value }: any) {
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

function ScheduleItem({ title, time, tag, color, textColor, isLast }: any) {
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.background },
    scrollContent: { padding: 24, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
    brandTitle: { fontSize: 20, fontWeight: '800', color: Theme.text },
    brandSubtitle: { fontSize: 12, color: Theme.grayText },
    section: { marginBottom: 24 },
    greetingTitle: { fontSize: 26, fontWeight: 'bold', color: Theme.text },
    greetingSubtitle: { fontSize: 16, color: Theme.grayText },

    // Quick Actions
    quickActions: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    actionButtonPrimary: { flex: 1, height: 60, borderRadius: 16, overflow: 'hidden' },
    gradientBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
    actionButtonTextPrimary: { color: '#FFF', fontWeight: '600' },
    actionButtonSecondary: { flex: 1, height: 60, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
    actionButtonTextSecondary: { color: Theme.grayText, fontWeight: '600' },

    // Stats
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
    statCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, width: '31%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    statIcon: { padding: 8, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 8 },
    statLabel: { fontSize: 10, color: Theme.grayText, fontWeight: '600', textTransform: 'uppercase' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: Theme.text },

    // Schedule
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: Theme.text },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    scheduleItem: { flexDirection: 'row' },
    timelineColumn: { alignItems: 'center', marginRight: 16, width: 20 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.primary, marginTop: 6 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#F0F0F0', marginTop: 4 },
    scheduleContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    scheduleTitle: { fontSize: 16, fontWeight: '600', color: Theme.text },
    scheduleTime: { fontSize: 12, color: Theme.grayText, marginTop: 4 },
    tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    tagText: { fontSize: 12, fontWeight: '500' },

    // Tasks
    taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FAFAFA', borderRadius: 12, marginBottom: 8 },
    taskRowDone: { backgroundColor: '#F0FFF4' },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    checkboxDone: { backgroundColor: Theme.primary, borderColor: Theme.primary },
    taskText: { flex: 1, fontSize: 14, fontWeight: '500', color: Theme.text },
    taskTextDone: { color: Theme.grayText, textDecorationLine: 'line-through' },
    deleteButton: { padding: 4 },
    emptyText: { textAlign: 'center', color: Theme.grayText, padding: 16 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.text },
    placeholderBox: { height: 150, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    placeholderText: { color: Theme.grayText },
    modalButton: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    modalButtonText: { fontWeight: '600', color: '#4B5563' },
    input: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    primaryButton: { borderRadius: 12, overflow: 'hidden' },
    gradientButton: { padding: 16, alignItems: 'center' },
    primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});