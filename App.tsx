import { LinearGradient } from 'expo-linear-gradient';
import {
    Calendar,
    CheckSquare,
    Home,
    Plus,
    Settings,
    Sparkles, Timer,
    TrendingUp,
    UserCircle,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Import Screens ---
import FocusScreen from './app/(tabs)/focus';
import SettingsScreen from './app/(tabs)/settings';
import TaskPage from './app/TaskPage';

const { width } = Dimensions.get('window');

const Theme = {
    primary: '#FF5A5F',
    primaryGradient: ['#FF5A5F', '#FF8085'] as const,
    secondary: '#FF8FAB',
    background: '#FAFAFA',
    text: '#2D3436',
    grayText: '#A0A0A0',
    lightGray: '#F5F5F5',
    cardBg: '#FFFFFF',
    accentBlue: '#E3F2FD',
    accentBlueText: '#2196F3',
    accentPink: '#FCE4EC',
    accentPinkText: '#E91E63',
    navBarBg: '#FFFFFF',
};

interface Task {
    id: string;
    title: string;
    priority: 'High' | 'Medium' | 'Low';
    subject: string;
    completed: boolean;
    duration: string;
    dueDate: string;
}

const INITIAL_TASKS: Task[] = [
    { id: '1', title: 'Complete Math Assignment', priority: 'High', subject: 'Mathematics', completed: false, duration: '2 hours', dueDate: 'Tomorrow' },
    { id: '2', title: 'Read Chapter 5 - History', priority: 'Medium', subject: 'History', completed: true, duration: '1 hour', dueDate: 'Today' },
];

export default function App() {
    const [currentView, setCurrentView] = useState<'dashboard' | 'tasks' | 'focus' | 'settings'>('dashboard');
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const handleAddTask = (newTask: Task) => { setTasks([newTask, ...tasks]); setIsTaskModalOpen(false); };
    const handleUpdateTask = (updatedTask: Task) => { setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t)); setIsTaskModalOpen(false); setEditingTask(null); };
    const handleDeleteTask = (taskId: string) => { setTasks(tasks.filter(t => t.id !== taskId)); setIsTaskModalOpen(false); setEditingTask(null); };
    const toggleTaskCompletion = (taskId: string) => { setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)); };
    const openEditModal = (task: Task) => { setEditingTask(task); setIsTaskModalOpen(true); };
    const openNewTaskModal = () => { setEditingTask(null); setIsTaskModalOpen(true); };

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardView tasks={tasks} />;
            case 'tasks': return <TaskPage tasks={tasks} onToggleComplete={toggleTaskCompletion} onEdit={openEditModal} onOpenNew={openNewTaskModal} />;
            case 'focus': return <FocusScreen />;
            case 'settings': return <SettingsScreen />;
            default: return <DashboardView tasks={tasks} />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.contentContainer}>
                {currentView === 'focus' || currentView === 'settings' ? (
                    <View style={styles.fullScreenContent}>{renderContent()}</View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {renderContent()}
                        <View style={{ height: 120 }} />
                    </ScrollView>
                )}

                <View style={styles.navBarWrapper}>
                    <View style={styles.navBarBg}><View style={styles.navBarHump} /></View>
                    <View style={styles.navBarContent}>
                        <NavButton icon={<Home size={24} color={currentView === 'dashboard' ? Theme.primary : Theme.grayText} />} label="Home" active={currentView === 'dashboard'} onPress={() => setCurrentView('dashboard')} />
                        <NavButton icon={<CheckSquare size={24} color={currentView === 'tasks' ? Theme.primary : Theme.grayText} />} label="Tasks" active={currentView === 'tasks'} onPress={() => setCurrentView('tasks')} />
                        <View style={styles.centerButtonContainer}>
                            <TouchableOpacity style={styles.centerButton} onPress={() => { }} activeOpacity={0.9}>
                                <LinearGradient colors={Theme.primaryGradient} style={styles.centerButtonGradient}>
                                    <Sparkles size={28} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                            <Text style={styles.centerButtonLabel}>AI</Text>
                        </View>
                        <NavButton icon={<Timer size={24} color={currentView === 'focus' ? Theme.primary : Theme.grayText} />} label="Focus" active={currentView === 'focus'} onPress={() => setCurrentView('focus')} />
                        <NavButton icon={<Settings size={24} color={currentView === 'settings' ? Theme.primary : Theme.grayText} />} label="Settings" active={currentView === 'settings'} onPress={() => setCurrentView('settings')} />
                    </View>
                </View>

                <Modal visible={isTaskModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsTaskModalOpen(false)}>
                    <TaskModalContent onClose={() => setIsTaskModalOpen(false)} onSubmit={editingTask ? handleUpdateTask : handleAddTask} onDelete={handleDeleteTask} initialData={editingTask} />
                </Modal>
            </View>
        </SafeAreaView>
    );
}

// --- Sub-Components ---

function DashboardView({ tasks }: { tasks: Task[] }) {
    const pendingCount = tasks.filter(t => !t.completed).length;
    return (
        <View>
            <View style={styles.header}>
                <View>
                    <Text style={styles.brandTitle}>Prod<Text style={{ color: Theme.primary }}>AI</Text>ctive</Text>
                    <Text style={styles.brandSubtitle}>Study companion</Text>
                </View>
                <UserCircle size={36} color={Theme.grayText} />
            </View>
            <View style={styles.greetingSection}>
                <Text style={styles.greetingTitle}>Good morning, Alex!</Text>
                <Text style={styles.greetingSubtitle}>You have {pendingCount} tasks due today</Text>
            </View>
            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButtonPrimary}>
                    <LinearGradient colors={Theme.primaryGradient} style={styles.gradientBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Calendar size={24} color="#FFF" />
                        <Text style={styles.actionButtonTextPrimary}>Calendar</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonSecondary}>
                    <Plus size={24} color={Theme.grayText} />
                    <Text style={styles.actionButtonTextSecondary}>Quick Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
                <StatCard icon={<CheckSquare size={20} color={Theme.primary} />} bg="#FFF0F0" label="Tasks" value={pendingCount.toString()} />
                <StatCard icon={<Calendar size={20} color="#FFB300" />} bg="#FFF8E1" label="Events" value="5" />
                <StatCard icon={<TrendingUp size={20} color="#9C27B0" />} bg="#F3E5F5" label="Progress" value="78%" />
            </View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
            </View>
            <View style={styles.card}>
                <ScheduleItem title="Math Lecture" time="09:00 AM" tag="study" color={Theme.accentBlue} textColor={Theme.accentBlueText} />
                <ScheduleItem title="Project Meeting" time="02:00 PM" tag="meeting" color={Theme.accentPink} textColor={Theme.accentPinkText} isLast />
            </View>
        </View>
    );
}

function NavButton({ icon, label, active, onPress }: any) {
    return (
        <TouchableOpacity style={styles.navItem} onPress={onPress}>
            {icon}
            <Text style={[styles.navText, active && { color: Theme.primary }]}>{label}</Text>
        </TouchableOpacity>
    );
}

function StatCard({ icon, bg, label, value }: any) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: bg }]}>{icon}</View>
            <View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>
        </View>
    );
}

function ScheduleItem({ title, time, tag, color, textColor, isLast }: any) {
    return (
        <View style={[styles.scheduleItem, { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#F0F0F0', paddingBottom: isLast ? 0 : 16, marginBottom: isLast ? 0 : 16 }]}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.primary, marginTop: 6, marginRight: 12 }} />
            <View style={{ flex: 1 }}><Text style={styles.scheduleTitle}>{title}</Text><Text style={styles.scheduleTime}>{time}</Text></View>
            <View style={[styles.tag, { backgroundColor: color }]}><Text style={[styles.tagText, { color: textColor }]}>{tag}</Text></View>
        </View>
    );
}

function TaskModalContent({ onClose, onSubmit, onDelete, initialData }: any) {
    const [title, setTitle] = useState(initialData?.title || '');
    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit({ id: initialData?.id || Date.now().toString(), title, priority: 'Medium', subject: 'General', completed: false, duration: '1h', dueDate: 'Tomorrow' });
    };
    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={styles.modalHeaderTitle}>{initialData ? 'Edit Task' : 'New Task'}</Text>
                    <TouchableOpacity onPress={onClose}><X size={24} color={Theme.grayText} /></TouchableOpacity>
                </View>
                <TextInput style={styles.modalInput} placeholder="Task Title" value={title} onChangeText={setTitle} />
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Theme.primary, marginTop: 20 }]} onPress={handleSubmit}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Task</Text>
                </TouchableOpacity>
                {initialData && (
                    <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }} onPress={() => onDelete(initialData.id)}>
                        <Text style={{ color: 'red' }}>Delete Task</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.background },
    contentContainer: { flex: 1, position: 'relative' },
    scrollContent: { padding: 24, paddingBottom: 120 },
    fullScreenContent: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    brandTitle: { fontSize: 20, fontWeight: '800', color: Theme.text },
    brandSubtitle: { fontSize: 12, color: Theme.grayText },
    greetingSection: { marginBottom: 24 },
    greetingTitle: { fontSize: 26, fontWeight: 'bold', color: Theme.text },
    greetingSubtitle: { fontSize: 16, color: Theme.grayText },
    quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 16 },
    actionButtonPrimary: { flex: 1, height: 60, borderRadius: 16, overflow: 'hidden' },
    gradientBackground: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    actionButtonTextPrimary: { color: '#FFF', fontWeight: '600' },
    actionButtonSecondary: { flex: 1, height: 60, backgroundColor: Theme.cardBg, borderRadius: 16, borderWidth: 1, borderColor: '#EEE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
    actionButtonTextSecondary: { color: Theme.grayText, fontWeight: '600' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
    statCard: { backgroundColor: Theme.cardBg, borderRadius: 16, padding: 12, width: '31%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    statIconContainer: { padding: 8, borderRadius: 10, marginBottom: 8, alignSelf: 'flex-start' },
    statLabel: { fontSize: 12, color: Theme.grayText },
    statValue: { fontSize: 18, fontWeight: 'bold', color: Theme.text },
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: Theme.text, marginBottom: 12 },
    card: { backgroundColor: Theme.cardBg, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    scheduleItem: { flexDirection: 'row' },
    scheduleTitle: { fontSize: 16, fontWeight: '600', color: Theme.text },
    scheduleTime: { fontSize: 12, color: Theme.grayText },
    tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    tagText: { fontSize: 12, fontWeight: '500' },
    navBarWrapper: { position: 'absolute', bottom: 0, width: width, height: 90, justifyContent: 'flex-end', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, zIndex: 100 },
    navBarBg: { position: 'absolute', bottom: 0, width: '100%', height: 80, backgroundColor: Theme.navBarBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center' },
    navBarHump: { position: 'absolute', top: -30, width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.navBarBg },
    navBarContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 20, height: '100%' },
    navItem: { alignItems: 'center', justifyContent: 'center', width: 50, marginBottom: 0 },
    navText: { fontSize: 10, marginTop: 6, color: Theme.grayText, fontWeight: '500' },
    centerButtonContainer: { alignItems: 'center', justifyContent: 'flex-end', marginBottom: 35, zIndex: 10 },
    centerButton: { width: 60, height: 60, borderRadius: 30, shadowColor: Theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, marginBottom: 4 },
    centerButtonGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    centerButtonLabel: { fontSize: 10, fontWeight: '700', color: Theme.text, position: 'absolute', bottom: -22 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 20 },
    modalHeaderTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    modalInput: { borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 12, fontSize: 16 },
    modalBtn: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center' }
});