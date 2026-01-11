import { LinearGradient } from 'expo-linear-gradient';
import {
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Plus,
    Search
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// You might want to move these types/constants to a separate file like 'types.ts' later
type Priority = 'High' | 'Medium' | 'Low';

export interface Task {
    id: string;
    title: string;
    // The description was in the interface but not used in the component logic.
    // description: string; 
    dueDate: string;
    duration: string;
    priority: Priority;
    subject: string;
    completed: boolean;
}

// Define Theme locally or import it from a constants file
const Theme = {
    primary: '#FF5A5F',
    primaryGradient: ['#FF5A5F', '#FF8085'] as const,
    priorityHigh: '#FF5A5F',
    priorityMedium: '#FFB300',
    priorityLow: '#4CAF50',
};

interface TaskPageProps {
    tasks: Task[];
    onToggleComplete: (id: string) => void;
    onEdit: (task: Task) => void;
    onOpenNew: () => void;
}

export default function TaskPage({
    tasks,
    onToggleComplete,
    onEdit,
    onOpenNew
}: TaskPageProps) {
    const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);

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
                                {task.completed ? <CheckCircle2 size={24} color="#4CAF50" fill="#e8f5e9" /> : <Circle size={24} color="#D1D5DB" />}
                            </TouchableOpacity>

                            <View style={styles.taskContent}>
                                <View style={styles.taskTitleRow}>
                                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                                        {task.title}
                                    </Text>
                                    <View style={[styles.priorityTag, { backgroundColor: task.priority === 'High' ? '#FFF0F0' : task.priority === 'Medium' ? '#FFF8E1' : '#E8F5E9' }]}>
                                        <Text style={[styles.priorityText, { color: task.priority === 'High' ? Theme.priorityHigh : task.priority === 'Medium' ? Theme.priorityMedium : Theme.priorityLow }]}>
                                            {task.priority}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.taskDetailsRow}>
                                    <View style={styles.taskDetailsInner}>
                                        <View style={styles.taskDetailItem}>
                                            <Calendar size={12} />
                                            <Text style={styles.taskDetailText}>{task.dueDate}</Text>
                                        </View>
                                        <View style={styles.taskDetailItem}>
                                            <Clock size={12} />
                                            <Text style={styles.taskDetailText}>{task.duration}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.subjectTag, { backgroundColor: '#E3F2FD' }]}>
                                        <Text style={[styles.subjectText, { color: '#2196F3' }]}>
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
                            <TouchableOpacity
                                onPress={onOpenNew}
                                style={styles.newTaskButton}
                            >
                                <LinearGradient colors={Theme.primaryGradient} style={styles.newTaskButtonGradient}>
                                    <Plus size={16} color="white" />
                                    <Text style={styles.newTaskButtonText}>New Task</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Search size={20} color="#A0A0A0" style={styles.searchIcon} />
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
                                <Text style={[styles.overviewValue, { color: '#FF5A5F' }]}>{highPriorityCount}</Text>
                                <Text style={styles.overviewLabel}>High Priority</Text>
                            </View>
                            <View style={styles.overviewCard}>
                                <Text style={[styles.overviewValue, { color: '#4CAF50' }]}>{completedCount}</Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    contentContainer: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3436' },
    pageSubtitle: { color: '#A0A0A0', fontSize: 14 },
    newTaskButton: { borderRadius: 999, overflow: 'hidden' },
    newTaskButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
    newTaskButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 24 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14 },
    filterContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'white', borderWidth: 1, borderColor: '#F0F0F0' },
    filterChipActive: { backgroundColor: Theme.primary, borderColor: Theme.primary },
    filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    filterChipTextActive: { color: 'white' },
    overviewContainer: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    overviewCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
    overviewValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 2 },
    overviewLabel: { fontSize: 12, color: '#A0A0A0', fontWeight: '500' },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436' },
    toggleText: { fontSize: 12, fontWeight: '500', color: '#A0A0A0' },
    taskCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
    taskCardCompleted: { opacity: 0.7, backgroundColor: '#F9F9F9' },
    taskCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
    checkboxContainer: { marginTop: 2 },
    taskContent: { flex: 1 },
    taskTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    taskTitle: { fontWeight: 'bold', color: '#2D3436', fontSize: 15, flex: 1, marginRight: 8 },
    taskTitleCompleted: { textDecorationLine: 'line-through', color: '#A0A0A0' },
    priorityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    priorityText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    taskDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    taskDetailsInner: { flexDirection: 'row', gap: 12 },
    taskDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    taskDetailText: { fontSize: 12, color: '#A0A0A0' },
    subjectTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    subjectText: { fontSize: 10, fontWeight: '600' },
});