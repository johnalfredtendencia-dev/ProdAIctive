import { LinearGradient } from 'expo-linear-gradient';
import {
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Moon,
    Plus,
    Search,
    Sun
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AddTaskModal, { AddTaskData } from '../components/AddTaskModal';
import { useTheme } from '../contexts/ThemeContext';

// You might want to move these types/constants to a separate file like 'types.ts' later
type Priority = 'High' | 'Medium' | 'Low';

export interface PomodoroConfig {
    focusTime: number;
    breakTime: number;
    sessionsCount: number;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate: string | Date;
    duration?: string;
    priority: Priority;
    subject?: string;
    completed: boolean;
    timeOfDay?: 'morning' | 'afternoon';
    pomodoro?: PomodoroConfig;
}

// Theme colors are now from useTheme() context

interface TaskPageProps {
    tasks: Task[];
    onToggleComplete: (id: string) => void;
    onEdit: (task: Task) => void;
    onOpenNew: () => void;
    onAddTask?: (taskData: AddTaskData) => void;
}

export default function TaskPage({
    tasks,
    onToggleComplete,
    onEdit,
    onOpenNew,
    onAddTask,
}: TaskPageProps) {
    const { colors, isDarkMode, setIsDarkMode } = useTheme();
    const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        contentContainer: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
        pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
        pageSubtitle: { color: colors.grayText, fontSize: 14 },
        newTaskButton: { borderRadius: 999, overflow: 'hidden' },
        newTaskButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
        newTaskButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
        searchContainer: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: colors.cardBg, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
        searchIcon: { marginRight: 8 },
        searchInput: { flex: 1, fontSize: 14, color: colors.text },
        filterContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
        filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border },
        filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        filterChipText: { fontSize: 12, fontWeight: '600', color: colors.grayText },
        filterChipTextActive: { color: 'white' },
        overviewContainer: { flexDirection: 'row', gap: 16, marginBottom: 32 },
        overviewCard: { flex: 1, backgroundColor: colors.cardBg, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
        overviewValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 2, color: colors.text },
        overviewLabel: { fontSize: 12, color: colors.grayText, fontWeight: '500' },
        listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
        sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
        toggleText: { fontSize: 12, fontWeight: '500', color: colors.grayText },
        taskCard: { backgroundColor: colors.cardBg, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
        taskCardCompleted: { opacity: 0.7, backgroundColor: isDarkMode ? colors.background : '#F9F9F9' },
        taskCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
        checkboxContainer: { marginTop: 2 },
        taskContent: { flex: 1 },
        taskTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
        taskTitle: { fontWeight: 'bold', color: colors.text, fontSize: 15, flex: 1, marginRight: 8 },
        taskTitleCompleted: { textDecorationLine: 'line-through', color: colors.grayText },
        priorityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
        priorityText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
        taskDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
        taskDetailsInner: { flexDirection: 'row', gap: 12 },
        taskDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        taskDetailText: { fontSize: 12, color: colors.grayText },
        subjectTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
        subjectText: { fontSize: 10, fontWeight: '600' },
    });

    const filteredTasks = useMemo(() => {
        return tasks.filter((task: Task) => {
            const matchesSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filter === 'All' || task.priority === filter;
            const matchesHide = hideCompleted ? !task.completed : true;
            return matchesSearch && matchesFilter && matchesHide;
        });
    }, [tasks, filter, searchQuery, hideCompleted]);

    const highPriorityCount = tasks.filter((t: Task) => t.priority === 'High' && !t.completed).length;
    const completedCount = tasks.filter((t: Task) => t.completed).length;
    const pendingCount = tasks.filter((t: Task) => !t.completed).length;

    // Handle adding a new task
    const handleAddTask = (taskData: AddTaskData) => {
        if (onAddTask) {
            onAddTask(taskData);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredTasks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.contentContainer}
                renderItem={({ item: task }) => (
                    <TouchableOpacity
                        onPress={() => onEdit(task)}
                        style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                    >
                        <View style={styles.taskCardInner}>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onToggleComplete(task.id);
                                }}
                                style={styles.checkboxContainer}
                            >
                                {task.completed ? <CheckCircle2 size={24} color={colors.primary} fill={colors.lightGray} /> : <Circle size={24} color={colors.border} />}
                            </TouchableOpacity>

                            <View style={styles.taskContent}>
                                <View style={styles.taskTitleRow}>
                                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                                        {task.title}
                                    </Text>
                                    <View style={[styles.priorityTag, { backgroundColor: task.priority === 'High' ? colors.lightGray : task.priority === 'Medium' ? colors.lightGray : colors.lightGray }]}>
                                        <Text style={[styles.priorityText, { color: task.priority === 'High' ? colors.primary : task.priority === 'Medium' ? colors.accentBlue : colors.accentBlue }]}>
                                            {task.priority}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.taskDetailsRow}>
                                    <View style={styles.taskDetailsInner}>
                                        <View style={styles.taskDetailItem}>
                                            <Calendar size={12} />
                                            <Text style={styles.taskDetailText}>{typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toDateString()}</Text>
                                        </View>
                                        <View style={styles.taskDetailItem}>
                                            <Clock size={12} />
                                            <Text style={styles.taskDetailText}>{task.duration}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.subjectTag, { backgroundColor: colors.accentBlue }]}>
                                        <Text style={[styles.subjectText, { color: 'white' }]}>
                                            {task.subject}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.pageTitle}>Tasks & To-dos</Text>
                                <Text style={styles.pageSubtitle}>{pendingCount} pending tasks</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                <TouchableOpacity 
                                    onPress={() => setIsDarkMode(!isDarkMode)}
                                    style={{ padding: 8 }}
                                >
                                    {isDarkMode ? (
                                        <Sun size={20} color={colors.text} />
                                    ) : (
                                        <Moon size={20} color={colors.text} />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowAddModal(true)}
                                    style={styles.newTaskButton}
                                >
                                    <LinearGradient colors={colors.primaryGradient} style={styles.newTaskButtonGradient}>
                                        <Plus size={16} color="white" />
                                        <Text style={styles.newTaskButtonText}>New Task</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.searchContainer}>
                            <Search size={20} color={colors.grayText} style={styles.searchIcon} />
                            <TextInput
                                placeholder="Search tasks..."
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <View style={styles.filterContainer}>
                            {(['All', 'High Priority', 'Medium', 'Low'] as const).map((f) => {
                                const val = f === 'High Priority' ? 'High' : f;
                                const isActive = filter === val;
                                return (
                                    <TouchableOpacity
                                        key={f}
                                        onPress={() => setFilter(val as any)}
                                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                                    >
                                        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{f}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.overviewContainer}>
                            <View style={styles.overviewCard}>
                                <Text style={[styles.overviewValue, { color: colors.primary }]}>{highPriorityCount}</Text>
                                <Text style={styles.overviewLabel}>High Priority</Text>
                            </View>
                            <View style={styles.overviewCard}>
                                <Text style={[styles.overviewValue, { color: colors.accentBlue }]}>{completedCount}</Text>
                                <Text style={styles.overviewLabel}>Completed</Text>
                            </View>
                        </View>

                        <View style={styles.listHeader}>
                            <Text style={styles.sectionTitle}>Your Tasks</Text>
                            <TouchableOpacity
                                onPress={() => setHideCompleted(!hideCompleted)}
                            >
                                <Text style={styles.toggleText}>{hideCompleted ? 'Show Completed' : 'Hide Completed'}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                }
            />
            <AddTaskModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddTask}
                minDate={new Date()}
            />
        </View>
    );
}

