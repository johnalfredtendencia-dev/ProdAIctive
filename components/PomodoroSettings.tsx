import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export interface PomodoroConfig {
  focusTime: number; // in minutes
  breakTime: number; // in minutes
  sessionsCount: number;
}

interface PomodoroSettingsProps {
  value: PomodoroConfig;
  onChange: (config: PomodoroConfig) => void;
  availableMinutes?: number; // Total available time in minutes
}

export default function PomodoroSettings({ value, onChange, availableMinutes }: PomodoroSettingsProps) {
  const [focusTime, setFocusTime] = useState(value.focusTime.toString());
  const [breakTime, setBreakTime] = useState(value.breakTime.toString());
  const [sessionsCount, setSessionsCount] = useState(value.sessionsCount.toString());
  const [autoMode, setAutoMode] = useState(true); // Auto-calculate break time and sessions

  // Auto-calculate break time and sessions when focus time changes
  useEffect(() => {
    if (autoMode && focusTime && parseInt(focusTime) > 0) {
      const newFocusTime = parseInt(focusTime);
      // Break time = Focus time ÷ 5 (standard Pomodoro ratio)
      const newBreakTime = Math.max(1, Math.ceil(newFocusTime / 5));
      
      // Calculate sessions based on available time (no arbitrary cap)
      let newSessions = 4; // default
      if (availableMinutes && availableMinutes > 0) {
        const cycleTime = newFocusTime + newBreakTime;
        newSessions = Math.max(1, Math.floor(availableMinutes / cycleTime));
      }
      
      setBreakTime(newBreakTime.toString());
      setSessionsCount(newSessions.toString());
      onChange({
        focusTime: newFocusTime,
        breakTime: newBreakTime,
        sessionsCount: newSessions,
      });
    }
  }, [focusTime, autoMode, availableMinutes]);

  // Sync external value changes
  useEffect(() => {
    if (value.focusTime.toString() !== focusTime) {
      setFocusTime(value.focusTime.toString());
    }
    if (value.breakTime.toString() !== breakTime) {
      setBreakTime(value.breakTime.toString());
    }
    if (value.sessionsCount.toString() !== sessionsCount) {
      setSessionsCount(value.sessionsCount.toString());
    }
  }, [value]);

  // Manual update when fields change
  const handleFocusTimeChange = (text: string) => {
    setFocusTime(text);
    const newFocusTime = parseInt(text) || 0;
    
    if (autoMode && newFocusTime > 0) {
      // Auto-calculate break time and sessions
      const newBreakTime = Math.max(1, Math.ceil(newFocusTime / 5));
      let newSessions = 4;
      if (availableMinutes && availableMinutes > 0) {
        const cycleTime = newFocusTime + newBreakTime;
        newSessions = Math.max(1, Math.floor(availableMinutes / cycleTime));
      }
      setBreakTime(newBreakTime.toString());
      setSessionsCount(newSessions.toString());
      onChange({
        focusTime: newFocusTime,
        breakTime: newBreakTime,
        sessionsCount: newSessions,
      });
    } else {
      onChange({
        focusTime: newFocusTime,
        breakTime: parseInt(breakTime) || 0,
        sessionsCount: parseInt(sessionsCount) || 1,
      });
    }
  };

  const handleBreakTimeChange = (text: string) => {
    setBreakTime(text);
    const newBreakTime = parseInt(text) || 0;
    
    // Recalculate sessions if in auto mode
    if (autoMode && availableMinutes && availableMinutes > 0) {
      const cycleTime = (parseInt(focusTime) || 0) + newBreakTime;
      const newSessions = Math.max(1, Math.floor(availableMinutes / cycleTime));
      setSessionsCount(newSessions.toString());
      onChange({
        focusTime: parseInt(focusTime) || 0,
        breakTime: newBreakTime,
        sessionsCount: newSessions,
      });
    } else {
      onChange({
        focusTime: parseInt(focusTime) || 0,
        breakTime: newBreakTime,
        sessionsCount: parseInt(sessionsCount) || 1,
      });
    }
  };

  const handleSessionsChange = (text: string) => {
    setSessionsCount(text);
    onChange({
      focusTime: parseInt(focusTime) || 0,
      breakTime: parseInt(breakTime) || 0,
      sessionsCount: parseInt(text) || 1,
    });
  };

  const incrementValue = (type: 'focus' | 'break' | 'sessions', step: number = 1) => {
    if (type === 'focus') {
      const newValue = Math.max(1, (parseInt(focusTime) || 0) + step);
      handleFocusTimeChange(newValue.toString());
    } else if (type === 'break') {
      const newValue = Math.max(1, (parseInt(breakTime) || 0) + step);
      handleBreakTimeChange(newValue.toString());
    } else if (type === 'sessions') {
      const newValue = Math.max(1, (parseInt(sessionsCount) || 1) + step);
      handleSessionsChange(newValue.toString());
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>⏱️ Pomodoro Timer Setup</Text>
        <TouchableOpacity
          onPress={() => setAutoMode(!autoMode)}
          style={[styles.autoModeButton, autoMode && styles.autoModeButtonActive]}
        >
          <Text style={[styles.autoModeText, autoMode && styles.autoModeTextActive]}>
            {autoMode ? '✓ Auto' : 'Manual'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {autoMode && (
        <Text style={styles.autoHint}>
          Break time and sessions auto-adjust based on focus time
        </Text>
      )}

      {/* Focus Time */}
      <View style={styles.section}>
        <Text style={styles.label}>Focus Time (minutes)</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="25"
            keyboardType="number-pad"
            value={focusTime}
            onChangeText={handleFocusTimeChange}
          />
          <View style={styles.buttonGroup}>
            <TouchableOpacity onPress={() => incrementValue('focus', 1)} style={styles.smallButton}>
              <ChevronUp size={16} color="#FF5A5F" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => incrementValue('focus', -1)} style={styles.smallButton}>
              <ChevronDown size={16} color="#FF5A5F" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Break Time */}
      <View style={styles.section}>
        <Text style={styles.label}>Break Time (minutes)</Text>
        {autoMode && (
          <Text style={styles.hint}>Auto: Focus time ÷ 5</Text>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, autoMode && styles.disabledInput]}
            placeholder="5"
            keyboardType="number-pad"
            value={breakTime}
            onChangeText={handleBreakTimeChange}
            editable={!autoMode}
          />
          {!autoMode && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={() => incrementValue('break', 1)} style={styles.smallButton}>
                <ChevronUp size={16} color="#FF5A5F" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => incrementValue('break', -1)} style={styles.smallButton}>
                <ChevronDown size={16} color="#FF5A5F" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Sessions Count */}
      <View style={styles.section}>
        <Text style={styles.label}>Number of Sessions</Text>
        {autoMode && availableMinutes && availableMinutes > 0 && (
          <Text style={styles.hint}>Auto: {availableMinutes} min available ÷ {(parseInt(focusTime) || 0) + (parseInt(breakTime) || 0)} min/cycle</Text>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, autoMode && styles.disabledInput]}
            placeholder="4"
            keyboardType="number-pad"
            value={sessionsCount}
            onChangeText={handleSessionsChange}
            editable={!autoMode}
          />
          {!autoMode && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={() => incrementValue('sessions', 1)} style={styles.smallButton}>
                <ChevronUp size={16} color="#FF5A5F" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => incrementValue('sessions', -1)} style={styles.smallButton}>
                <ChevronDown size={16} color="#FF5A5F" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>📊 Summary</Text>
        {availableMinutes && availableMinutes > 0 && (
          <Text style={styles.summaryHighlight}>
            Available Time: {Math.floor(availableMinutes / 60)}h {availableMinutes % 60}m ({availableMinutes} minutes)
          </Text>
        )}
        <Text style={styles.summaryText}>
          {focusTime || 0} min focus + {breakTime || 0} min break = {((parseInt(focusTime) || 0) + (parseInt(breakTime) || 0))} min per cycle
        </Text>
        <Text style={styles.summaryText}>
          Total Work Time: {(parseInt(focusTime) || 0) * (parseInt(sessionsCount) || 1)} minutes ({(parseInt(sessionsCount) || 1)} sessions)
        </Text>
        <Text style={styles.summaryText}>
          Total with Breaks: {((parseInt(focusTime) || 0) + (parseInt(breakTime) || 0)) * (parseInt(sessionsCount) || 1)} minutes
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  autoModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  autoModeButtonActive: {
    backgroundColor: '#FF5A5F',
    borderColor: '#FF5A5F',
  },
  autoModeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  autoModeTextActive: {
    color: 'white',
  },
  autoHint: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  breakTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  autoButtonActive: {
    backgroundColor: '#FF5A5F',
    borderColor: '#FF5A5F',
  },
  autoButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  autoButtonTextActive: {
    color: 'white',
  },
  hint: {
    fontSize: 12,
    color: '#A0A0A0',
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#A0A0A0',
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: 4,
  },
  smallButton: {
    width: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#F9F9F9',
  },
  summaryBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5A5F',
    gap: 6,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF5A5F',
    marginBottom: 4,
  },
  summaryHighlight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryText: {
    fontSize: 12,
    color: '#2D3436',
    lineHeight: 18,
  },
});
