import { Stack, useRouter } from 'expo-router';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    Trash2,
    X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Color Palette based on Image 3 (Dashboard)
const COLORS = {
    primary: '#FF4D6D', // The pinkish-red from the Calendar button
    secondary: '#FFB703', // The orange from the Events icon/button
    background: '#FFFFFF',
    cardBg: '#FFFFFF',
    textMain: '#1A1A1A',
    textSub: '#8E8E93',
    border: '#F0F0F0',
    todayHighlight: '#FFF0F3', // Light pink background for context
    lightGray: '#F5F5F5',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Types and Mock Data ---
interface Event {
    id: string;
    date: Date;
    title: string;
    time: string;
    color: string;
}

const initialEvents: Event[] = [
    { id: '1', date: new Date(2025, 11, 5), title: 'Final Project Deadline', time: '11:59 PM', color: COLORS.primary },
    { id: '2', date: new Date(2025, 11, 12), title: 'Team Sync Meeting', time: '10:00 AM', color: COLORS.secondary },
    { id: '3', date: new Date(2025, 11, 12), title: 'Study Session: Physics', time: '2:00 PM', color: '#4CAF50' },
];

export default function CalendarPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // Start Dec 2025 as per inspo
    const [selectedDate, setSelectedDate] = useState<number | null>(5); // Dec 5th selected as per inspo
    const [events, setEvents] = useState(initialEvents);
    const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventTime, setEventTime] = useState('');

    // Update events list when a date is selected
    useEffect(() => {
        if (selectedDate === null) {
            setSelectedDayEvents([]);
            return;
        }
        const dayEvents = events.filter(
            (event) => event.date.getDate() === selectedDate && event.date.getMonth() === month && event.date.getFullYear() === year
        );
        setSelectedDayEvents(dayEvents);
    }, [selectedDate, events, currentDate]);

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
        setCurrentDate(new Date(year, month + increment, 1));
        setSelectedDate(null); // Reset selection on month change
    };

    // --- CRUD Functions ---
    const handleOpenAddModal = () => {
        if (selectedDate === null) {
            Alert.alert("No Date Selected", "Please select a date to add an event.");
            return;
        }
        setEditingEvent(null);
        setEventTitle('');
        setEventTime('');
        setIsModalVisible(true);
    };

    const handleOpenEditModal = (event: Event) => {
        setEditingEvent(event);
        setEventTitle(event.title);
        setEventTime(event.time);
        setIsModalVisible(true);
    };

    const handleSaveEvent = () => {
        if (!eventTitle.trim() || !eventTime.trim()) {
            Alert.alert("Missing Information", "Please fill in both title and time.");
            return;
        }

        if (editingEvent) {
            // Update existing event
            setEvents(events.map(e => e.id === editingEvent.id ? { ...e, title: eventTitle, time: eventTime } : e));
        } else {
            // Add new event
            const newEvent: Event = {
                id: Date.now().toString(),
                date: new Date(year, month, selectedDate!),
                title: eventTitle,
                time: eventTime,
                color: [COLORS.primary, COLORS.secondary, '#4CAF50'][Math.floor(Math.random() * 3)],
            };
            setEvents([...events, newEvent]);
        }
        setIsModalVisible(false);
    };

    const handleDeleteEvent = () => {
        if (!editingEvent) return;
        Alert.alert(
            "Delete Event",
            "Are you sure you want to delete this event?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setEvents(events.filter(e => e.id !== editingEvent.id));
                        setIsModalVisible(false);
                    },
                },
            ]
        );
    };

    const renderCalendarGrid = () => {

        // Render Header (Days of Week)
        const headerRow = weekDays.map((day, index) => (
            <View key={`header-${index}`} style={styles.gridCell}>
                <Text style={styles.weekDayText}>{day}</Text>
            </View>
        ));

        // Render Empty Cells for start of month
        const emptyCells: JSX.Element[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            emptyCells.push(<View key={`empty-${i}`} style={styles.gridCell} />);
        }

        // Render Days
        const dayCells: JSX.Element[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const isSelected = i === selectedDate;
            const hasEvent = events.some(e => e.date.getDate() === i && e.date.getMonth() === month && e.date.getFullYear() === year);

            dayCells.push(
                <TouchableOpacity
                    key={`day-${i}`}
                    style={[styles.gridCell, isSelected && styles.selectedDayCell]}
                    onPress={() => setSelectedDate(i)}
                >
                    <View style={styles.dayCellContent}>
                        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{i}</Text>
                        {hasEvent && <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />}
                    </View>
                </TouchableOpacity>
            );
        }

        // Combine all cells
        const allCells = [...emptyCells, ...dayCells];
        const rows: JSX.Element[] = [];
        let cellsInRow: JSX.Element[] = [];

        allCells.forEach((cell, index) => {
            cellsInRow.push(cell);
            if ((index + 1) % 7 === 0 || index === allCells.length - 1) {
                rows.push(
                    <View key={`row-${rows.length}`} style={styles.gridRow}>
                        {cellsInRow}
                    </View>
                );
                cellsInRow = [];
            }
        });

        return (
            <View style={styles.calendarContainer}>
                <View style={styles.gridRow}>{headerRow}</View>
                {rows}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ChevronLeft color={COLORS.textMain} size={28} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>Calendar</Text>
                            <Text style={styles.subtitle}>5 events this month</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={handleOpenAddModal}>
                        <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
                        <Text style={styles.addButtonText}>Event</Text>
                    </TouchableOpacity>
                </View>

                {/* Calendar Card */}
                <View style={styles.card}>
                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <Text style={styles.monthTitle}>{monthNames[month]} {year}</Text>
                        <View style={styles.navArrows}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
                                <ChevronLeft color={COLORS.textMain} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
                                <ChevronRight color={COLORS.textMain} size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Grid */}
                    {renderCalendarGrid()}
                </View>

                {/* Today's Events Section */}
                <View style={styles.sectionContainer} key={selectedDate}>
                    <Text style={styles.sectionTitle}>
                        Events for {monthNames[month]} {selectedDate || new Date().getDate()}
                    </Text>
                    {selectedDayEvents.length > 0 ? (
                        <View style={styles.card}>
                            {selectedDayEvents.map((event, index) => (
                                <TouchableOpacity key={event.id} style={[styles.eventItem, { borderBottomWidth: index === selectedDayEvents.length - 1 ? 0 : 1 }]} onPress={() => handleOpenEditModal(event)}>
                                    <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                                    <View style={styles.eventContent}>
                                        <Text style={styles.eventTitle}>{event.title}</Text>
                                        <View style={styles.eventTimeContainer}>
                                            <Clock size={14} color={COLORS.textSub} />
                                            <Text style={styles.eventTime}>{event.time}</Text>
                                        </View>
                                    </View>
                                    <ChevronRight color={COLORS.textSub} size={20} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.card, styles.emptyStateCard]}>
                            <CalendarIcon color={COLORS.textSub} size={48} strokeWidth={1} />
                            <Text style={styles.emptyStateText}>No events for this day</Text>
                        </View>
                    )}
                </View>

                {/* This Week Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>This Week</Text>
                    <View style={[styles.card, { height: 100 }]} />
                </View>

            </ScrollView>

            {/* Add/Edit Event Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingEvent ? 'Edit Event' : 'Add Event'}</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <X size={24} color={COLORS.textSub} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Event Title"
                            value={eventTitle}
                            onChangeText={setEventTitle}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Event Time (e.g., 10:00 AM)"
                            value={eventTime}
                            onChangeText={setEventTime}
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEvent}>
                            <Text style={styles.saveButtonText}>Save Event</Text>
                        </TouchableOpacity>

                        {editingEvent && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvent}>
                                <Trash2 size={16} color={COLORS.primary} />
                                <Text style={styles.deleteButtonText}>Delete Event</Text>
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
        color: COLORS.textMain,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSub,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary, // Orange color from Theme
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        shadowColor: COLORS.secondary,
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
        backgroundColor: COLORS.cardBg,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
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
        color: COLORS.textMain,
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
        width: (SCREEN_WIDTH - 80) / 7, // Calculate dynamic width based on padding
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
        color: COLORS.textSub,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    dayText: {
        fontSize: 14,
        color: COLORS.textMain,
        fontWeight: '500',
    },
    selectedDayCell: {
        backgroundColor: COLORS.primary, // Pink color from Theme
        borderRadius: 12,
        shadowColor: COLORS.primary,
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
        backgroundColor: COLORS.primary,
        position: 'absolute',
        bottom: 4,
    },
    eventDotSelected: {
        backgroundColor: '#FFFFFF',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textMain,
        marginBottom: 12,
    },
    emptyStateCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyStateText: {
        color: COLORS.textSub,
        fontSize: 14,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomColor: COLORS.border,
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
        color: COLORS.textMain,
        marginBottom: 4,
    },
    eventTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventTime: {
        fontSize: 14,
        color: COLORS.textSub,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain },
    input: { backgroundColor: COLORS.lightGray, padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    saveButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 8,
    },
    deleteButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];