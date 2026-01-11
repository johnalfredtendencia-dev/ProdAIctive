import { Bell, Camera, ChevronRight, Clock, Download, Globe, HelpCircle, Lock, LogOut, Mail, Moon, Palette, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Theme = {
    primary: '#FF5A5F',
    background: '#FAFAFA',
    white: '#FFFFFF',
    text: '#2D3436',
    grayText: '#A0A0A0',
    border: '#F0F0F0',
};

export default function SettingsScreen() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [studyReminders, setStudyReminders] = useState(true);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Manage your preferences</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>AJ</Text>
                    </View>
                    <View style={styles.cameraBadge}>
                        <Camera size={12} color="white" />
                    </View>
                </View>
                <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>Alex Johnson</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Student</Text>
                        </View>
                    </View>
                    <Text style={styles.email}>alex.johnson@student.edu</Text>
                    <Text style={styles.memberSince}>Member since September 2024</Text>
                </View>
            </View>

            {/* Appearance */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Appearance</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Moon size={20} color={Theme.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={styles.rowTitle}>Dark Mode</Text>
                            <Text style={styles.rowSub}>Toggle dark/light theme</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={setIsDarkMode}
                            trackColor={{ false: '#E0E0E0', true: Theme.primary }}
                            thumbColor="white"
                        />
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.row}>
                        <View style={styles.iconBox}>
                            <Palette size={20} color={Theme.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.rowTitle}>Theme Color</Text>
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeText}>Active</Text>
                                </View>
                            </View>
                            <Text style={styles.rowSub}>Warm gradient theme</Text>
                        </View>
                        <ChevronRight size={20} color={Theme.grayText} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notifications */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Notifications</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Bell size={20} color={Theme.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={styles.rowTitle}>Push Notifications</Text>
                            <Text style={styles.rowSub}>Receive task and event reminders</Text>
                        </View>
                        <Switch
                            value={pushEnabled}
                            onValueChange={setPushEnabled}
                            trackColor={{ false: '#E0E0E0', true: Theme.primary }}
                            thumbColor="white"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Mail size={20} color={Theme.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={styles.rowTitle}>Email Updates</Text>
                            <Text style={styles.rowSub}>Weekly progress summaries</Text>
                        </View>
                        <Switch
                            value={emailEnabled}
                            onValueChange={setEmailEnabled}
                            trackColor={{ false: '#E0E0E0', true: Theme.primary }}
                            thumbColor="white"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Clock size={20} color={Theme.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={styles.rowTitle}>Study Reminders</Text>
                            <Text style={styles.rowSub}>Intelligent study session alerts</Text>
                        </View>
                        <Switch
                            value={studyReminders}
                            onValueChange={setStudyReminders}
                            trackColor={{ false: '#E0E0E0', true: Theme.primary }}
                            thumbColor="white"
                        />
                    </View>
                </View>
            </View>

            {/* Account */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Account</Text>
                <View style={styles.card}>
                    <SettingLink icon={User} title="Edit Profile" sub="Update personal information" />
                    <View style={styles.divider} />
                    <SettingLink icon={Lock} title="Privacy & Security" sub="Manage account security" />
                    <View style={styles.divider} />
                    <SettingLink icon={Globe} title="Language & Region" sub="English (US)" />
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Quick Actions</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.actionRow}>
                        <Download size={20} color={Theme.text} />
                        <Text style={styles.actionText}>Export Data</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.actionRow}>
                        <HelpCircle size={20} color={Theme.text} />
                        <Text style={styles.actionText}>Contact Support</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.actionRow}>
                        <LogOut size={20} color="#FF5A5F" />
                        <Text style={[styles.actionText, { color: '#FF5A5F' }]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
        </SafeAreaView>
    );
}

function SettingLink({ icon: Icon, title, sub }: any) {
    return (
        <TouchableOpacity style={styles.row}>
            <View style={styles.iconBox}>
                <Icon size={20} color={Theme.grayText} />
            </View>
            <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSub}>{sub}</Text>
            </View>
            <ChevronRight size={20} color={Theme.grayText} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.background },
    content: { padding: 24, paddingBottom: 100 },
    header: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: Theme.text },
    subtitle: { fontSize: 14, color: Theme.grayText, marginTop: 4 },

    profileCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    avatarContainer: { position: 'relative', marginRight: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FBC02D', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    profileInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    name: { fontSize: 18, fontWeight: 'bold', color: Theme.text },
    badge: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeText: { color: '#F57C00', fontSize: 10, fontWeight: 'bold' },
    email: { fontSize: 14, color: Theme.grayText, marginBottom: 4 },
    memberSince: { fontSize: 12, color: '#BDBDBD' },

    section: { marginBottom: 24 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', color: Theme.text, marginBottom: 12 },
    card: { backgroundColor: 'white', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.background, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: 16, fontWeight: '600', color: Theme.text },
    rowSub: { fontSize: 12, color: Theme.grayText, marginTop: 2 },
    activeBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    activeText: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold' },

    actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    actionText: { fontSize: 16, fontWeight: '600', color: Theme.text },

    divider: { height: 1, backgroundColor: Theme.border, marginLeft: 68 },
});