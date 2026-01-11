import { BookOpen, Pause, Play, RotateCcw, SkipForward, Target } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Theme = {
    primary: '#FF5A5F',
    secondary: '#FF8FAB',
    background: '#FAFAFA',
    text: '#2D3436',
    grayText: '#A0A0A0',
    lightPink: '#FFF0F0',
    lightOrange: '#FFF8E1',
    orange: '#FFB300',
};

const { width } = Dimensions.get('window');

export default function FocusTab() {
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [timeLeft, setTimeLeft] = useState(25 * 60);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const switchMode = () => {
        setIsActive(false);
        const newMode = mode === 'focus' ? 'break' : 'focus';
        setMode(newMode);
        setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Pomodoro Timer</Text>
                        <Text style={styles.subtitle}>0 sessions completed today</Text>
                    </View>
                    <TouchableOpacity onPress={switchMode} style={styles.modeBadge}>
                        <BookOpen size={14} color={Theme.text} style={{ marginRight: 4 }} />
                        <Text style={styles.modeText}>{mode === 'focus' ? 'Focus Time' : 'Break'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.timerCard, { backgroundColor: mode === 'focus' ? Theme.lightPink : Theme.lightOrange }]}>
                    <View style={[styles.iconCircle, { backgroundColor: mode === 'focus' ? Theme.primary : Theme.orange }]}>
                        <BookOpen size={32} color="white" />
                    </View>

                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.controlButtonSmall} onPress={resetTimer}>
                            <RotateCcw size={20} color={Theme.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.controlButtonMain, { backgroundColor: mode === 'focus' ? Theme.primary : Theme.orange }]}
                            onPress={toggleTimer}
                        >
                            {isActive ? <Pause size={24} color="white" fill="white" /> : <Play size={24} color="white" fill="white" />}
                            <Text style={styles.mainButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.controlButtonSmall} onPress={switchMode}>
                            <SkipForward size={20} color={Theme.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>Today's Progress</Text>

                    <View style={styles.progressCard}>
                        <View style={styles.statRow}>
                            <View style={[styles.statIcon, { backgroundColor: Theme.lightPink }]}>
                                <BookOpen size={20} color={Theme.primary} />
                            </View>
                            <View style={styles.statInfo}>
                                <Text style={styles.statLabel}>Work Sessions</Text>
                                <Text style={styles.statSub}>0h 0m focused</Text>
                            </View>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>0</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statRow}>
                            <View style={[styles.statIcon, { backgroundColor: Theme.lightOrange }]}>
                                <Target size={20} color={Theme.orange} />
                            </View>
                            <View style={styles.statInfo}>
                                <Text style={styles.statLabel}>Current Streak</Text>
                                <Text style={styles.statSub}>0 / 4 until long break</Text>
                            </View>
                            <View style={styles.dots}>
                                <View style={[styles.dot, styles.dotActive]} />
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.background },
    content: { padding: 24, paddingBottom: 120 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { fontSize: 20, fontWeight: 'bold', color: Theme.text },
    subtitle: { fontSize: 14, color: Theme.grayText, marginTop: 4 },
    modeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },
    modeText: { fontSize: 12, fontWeight: '600', color: Theme.text },
    timerCard: { borderRadius: 32, padding: 32, alignItems: 'center', marginBottom: 24 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    timerText: { fontSize: 64, fontWeight: 'bold', color: Theme.text, fontVariant: ['tabular-nums'], marginBottom: 32 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' },
    controlButtonSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
    controlButtonMain: { height: 56, paddingHorizontal: 32, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    mainButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    progressSection: { marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.text, marginBottom: 16 },
    progressCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    statInfo: { flex: 1 },
    statLabel: { fontSize: 16, fontWeight: '600', color: Theme.text },
    statSub: { fontSize: 12, color: Theme.grayText, marginTop: 2 },
    countBadge: { backgroundColor: Theme.lightPink, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    countText: { color: Theme.primary, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },
    dots: { flexDirection: 'row', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F0F0F0' },
    dotActive: { backgroundColor: Theme.secondary },
});