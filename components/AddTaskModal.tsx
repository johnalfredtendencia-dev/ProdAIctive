import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import PomodoroSettings, { PomodoroConfig } from './PomodoroSettings';

export interface AddTaskData {
  title: string;
  description: string;
  dueDate: Date;
  startTime: Date;
  endTime: Date;
  priority: 'High' | 'Medium' | 'Low';
  pomodoro: PomodoroConfig;
}

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (taskData: AddTaskData) => void;
  minDate?: Date;
}

const defaultPomodoro: PomodoroConfig = {
  focusTime: 25,
  breakTime: 5,
  sessionsCount: 4,
};

// Helper to create time Date object
const createTimeDate = (hours: number, minutes: number = 0) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Get minimum time (current time rounded up to next 5 minutes)
const getMinimumStartTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 5) * 5;
  now.setMinutes(roundedMinutes, 0, 0);
  return now;
};

// Get default end time (3 hours after start time)
const getDefaultEndTime = (startTime: Date) => {
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 3);
  return endTime;
};

export default function AddTaskModal({
  visible,
  onClose,
  onAdd,
  minDate = new Date(),
}: AddTaskModalProps) {
  const { colors, isDarkMode } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date(minDate));
  
  // Initialize with current time as minimum
  const initialStartTime = getMinimumStartTime();
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(getDefaultEndTime(initialStartTime));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [pomodoro, setPomodoro] = useState<PomodoroConfig>(defaultPomodoro);
  
  // Calculate available time in minutes between start and end time
  const getAvailableMinutes = () => {
    return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      marginTop: Platform.OS === 'ios' ? 60 : 20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    section: {
      marginBottom: 20,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    titleInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.cardBg,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.cardBg,
    },
    descriptionInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: 12,
      color: colors.grayText,
      alignSelf: 'flex-end',
    },
    datePickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 8,
      backgroundColor: isDarkMode ? colors.background : '#FAFAFA',
    },
    dateArrowButton: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dateDisplay: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    dateDisplayValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    warningText: {
      fontSize: 12,
      color: '#FF9800',
      marginTop: 8,
    },
    timeRangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    timePickerButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 14,
      backgroundColor: colors.cardBg,
    },
    timePickerButtonActive: {
      borderColor: colors.primary,
      backgroundColor: isDarkMode ? colors.background : '#FFF0F0',
    },
    timePickerText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    timeRangeSeparator: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.grayText,
    },
    timeOfDayContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    timeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.cardBg,
    },
    timeButtonActive: {
      backgroundColor: isDarkMode ? colors.background : '#FFF0F0',
      borderColor: colors.primary,
    },
    timeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.grayText,
    },
    timeButtonTextActive: {
      color: colors.primary,
    },
    priorityContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    priorityButton: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    priorityButtonActive: {
      borderColor: 'transparent',
    },
    priorityButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    priorityButtonTextActive: {
      fontWeight: '700',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.primary,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  });

  // Calculate pomodoro settings based on available time
  const calculatePomodoroFromTime = (start: Date, end: Date, focusTime: number = 25) => {
    const availableMins = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const breakTime = Math.max(1, Math.ceil(focusTime / 5)); // Break = Focus ÷ 5
    const cycleTime = focusTime + breakTime;
    // Sessions = available time ÷ cycle time (no arbitrary cap)
    const sessions = availableMins > 0 ? Math.max(1, Math.floor(availableMins / cycleTime)) : 4;
    return { focusTime, breakTime, sessionsCount: sessions };
  };

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setSelectedDate(minDate);
      const newStartTime = getMinimumStartTime();
      const newEndTime = getDefaultEndTime(newStartTime);
      setStartTime(newStartTime);
      setEndTime(newEndTime);
      setShowStartPicker(false);
      setShowEndPicker(false);
      setPriority('Medium');
      // Auto-calculate pomodoro based on the time range
      setPomodoro(calculatePomodoroFromTime(newStartTime, newEndTime));
    }
  }, [visible, minDate]);

  // Auto-calculate pomodoro sessions when time range changes
  useEffect(() => {
    const availableMinutes = getAvailableMinutes();
    if (availableMinutes > 0 && pomodoro.focusTime > 0) {
      const newConfig = calculatePomodoroFromTime(startTime, endTime, pomodoro.focusTime);
      // Only update if something changed
      if (newConfig.sessionsCount !== pomodoro.sessionsCount || newConfig.breakTime !== pomodoro.breakTime) {
        setPomodoro(newConfig);
      }
    }
  }, [startTime, endTime]);

  // Handle date change - simpler approach for Expo Go compatibility
  const handleDateChange = (daysOffset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysOffset);
    setSelectedDate(newDate);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display (12-hour format)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Check if selected date is today
  const isToday = () => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  };

  // Handle start time change
  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    // On Android, dismiss picker immediately
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    
    // Only update if user selected a time (not cancelled)
    if (event.type === 'set' && selectedTime) {
      // If today, ensure time is not in the past
      if (isToday()) {
        const minTime = getMinimumStartTime();
        if (selectedTime < minTime) {
          alert('Cannot select a time in the past. Please choose a future time.');
          setStartTime(minTime);
          return;
        }
      }
      
      setStartTime(selectedTime);
      // Auto-adjust end time if it's before start time
      if (selectedTime >= endTime) {
        const newEndTime = new Date(selectedTime);
        newEndTime.setHours(newEndTime.getHours() + 1);
        setEndTime(newEndTime);
      }
    }
  };

  // Handle end time change
  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    // On Android, dismiss picker immediately
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    
    // Only update if user selected a time (not cancelled)
    if (event.type === 'set' && selectedTime) {
      // Ensure end time is after start time
      if (selectedTime > startTime) {
        setEndTime(selectedTime);
      } else {
        alert('End time must be after start time');
      }
    }
  };

  // Check if date is in the past (excluding today)
  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleAddTask = () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    // Prevent adding tasks to past dates
    if (isDateInPast(selectedDate)) {
      alert('Please select today or a future date');
      return;
    }

    onAdd({
      title: title.trim(),
      description: description.trim(),
      dueDate: selectedDate,
      startTime,
      endTime,
      priority,
      pomodoro,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSelectedDate(new Date(minDate));
    const newStartTime = getMinimumStartTime();
    setStartTime(newStartTime);
    setEndTime(getDefaultEndTime(newStartTime));
    setPriority('Medium');
    setPomodoro(defaultPomodoro);
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedDate(new Date(minDate));
    const newStartTime = getMinimumStartTime();
    setStartTime(newStartTime);
    setEndTime(getDefaultEndTime(newStartTime));
    setPriority('Medium');
    setPomodoro(defaultPomodoro);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Task</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            {/* Task Title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Task Title *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter task title..."
                placeholderTextColor="#A0A0A0"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.characterCount}>{title.length}/100</Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Enter task description (optional)..."
                placeholderTextColor="#A0A0A0"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
              />
              <Text style={styles.characterCount}>{description.length}/500</Text>
            </View>

            {/* Due Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Due Date *</Text>
              <View style={styles.datePickerContainer}>
                <TouchableOpacity
                  onPress={() => handleDateChange(-1)}
                  style={styles.dateArrowButton}
                >
                  <ChevronLeft size={20} color="#FF5A5F" />
                </TouchableOpacity>

                <View style={styles.dateDisplay}>
                  <Text style={styles.dateDisplayValue}>{formatDate(selectedDate)}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDateChange(1)}
                  style={styles.dateArrowButton}
                >
                  <ChevronRight size={20} color="#FF5A5F" />
                </TouchableOpacity>
              </View>

              {isDateInPast(selectedDate) && (
                <Text style={styles.warningText}>⚠️ This date is in the past. Please select today or a future date.</Text>
              )}
            </View>

            {/* Time of Day */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Range</Text>
              <View style={styles.timeRangeContainer}>
                {/* Start Time */}
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  style={[styles.timePickerButton, showStartPicker && styles.timePickerButtonActive]}
                >
                  <Clock size={18} color={colors.primary} />
                  <Text style={styles.timePickerText}>{formatTime(startTime)}</Text>
                </TouchableOpacity>

                <Text style={styles.timeRangeSeparator}>to</Text>

                {/* End Time */}
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  style={[styles.timePickerButton, showEndPicker && styles.timePickerButtonActive]}
                >
                  <Clock size={18} color={colors.primary} />
                  <Text style={styles.timePickerText}>{formatTime(endTime)}</Text>
                </TouchableOpacity>
              </View>

              {/* Start Time Picker */}
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onStartTimeChange}
                />
              )}

              {/* End Time Picker */}
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onEndTimeChange}
                />
              )}
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority</Text>
              <View style={styles.priorityContainer}>
                {(['High', 'Medium', 'Low'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityButton,
                      priority === p && styles.priorityButtonActive,
                      {
                        backgroundColor:
                          p === 'High'
                            ? priority === p ? '#FF5A5F' : '#FFF0F0'
                            : p === 'Medium'
                            ? priority === p ? '#FFB300' : '#FFF8E1'
                            : priority === p ? '#4CAF50' : '#E8F5E9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        priority === p && styles.priorityButtonTextActive,
                        {
                          color:
                            priority === p
                              ? 'white'
                              : p === 'High'
                              ? '#FF5A5F'
                              : p === 'Medium'
                              ? '#FFB300'
                              : '#4CAF50',
                        },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pomodoro Settings */}
            <View style={styles.section}>
              <PomodoroSettings
                value={pomodoro}
                onChange={setPomodoro}
                availableMinutes={getAvailableMinutes()}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleClose}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddTask}
                style={[styles.button, styles.addButton]}
                disabled={!title.trim() || isDateInPast(selectedDate)}
              >
                <Text style={styles.addButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}


