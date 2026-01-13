import { useRouter } from 'expo-router';
import { Bell, Camera, ChevronRight, Clock, Download, Globe, HelpCircle, Lock, LogOut, Mail, Moon, Palette, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabaseApi';

export default function SettingsScreen() {
    const router = useRouter();
    const { isDarkMode, setIsDarkMode, colors } = useTheme();
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [studyReminders, setStudyReminders] = useState(true);
    const [userName, setUserName] = useState('Loading...');
    const [userEmail, setUserEmail] = useState('Loading...');
    const [memberSinceDate, setMemberSinceDate] = useState('');
    const [avatarInitials, setAvatarInitials] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    setUserEmail(user.email || 'No email');
                    
                    // Get user profile from database
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, created_at')
                        .eq('id', user.id)
                        .single();

                    if (profile?.full_name) {
                        setUserName(profile.full_name);
                        // Generate initials from full name
                        const initials = profile.full_name
                            .split(' ')
                            .map((word: string) => word[0])
                            .join('')
                            .toUpperCase();
                        setAvatarInitials(initials);
                    } else {
                        setUserName(user.email?.split('@')[0] || 'User');
                        setAvatarInitials(user.email?.[0]?.toUpperCase() || 'U');
                    }

                    // Format the creation date
                    if (profile?.created_at) {
                        const date = new Date(profile.created_at);
                        const month = date.toLocaleString('default', { month: 'long' });
                        const year = date.getFullYear();
                        setMemberSinceDate(`Member since ${month} ${year}`);
                    } else if (user.created_at) {
                        const date = new Date(user.created_at);
                        const month = date.toLocaleString('default', { month: 'long' });
                        const year = date.getFullYear();
                        setMemberSinceDate(`Member since ${month} ${year}`);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUserName('User');
                setUserEmail('No email');
            }
        };

        fetchUserData();
    }, []);

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase.auth.signOut();
                            router.replace('/login');
                        } catch (error) {
                            console.error('Error signing out:', error);
                            Alert.alert('Error', 'Failed to sign out. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleExportData = () => {
        Alert.alert('Export Data', 'Your data export is being prepared. You will receive an email shortly.');
    };

    const handleContactSupport = () => {
        Alert.alert('Contact Support', 'Support email: support@prodaictive.com\n\nWe\'ll get back to you within 24 hours.');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                <Text style={[styles.subtitle, { color: colors.grayText }]}>Manage your preferences</Text>
            </View>

            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.cardBg }]}>
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.avatarText, { color: colors.white }]}>{avatarInitials}</Text>
                    </View>
                    <View style={styles.cameraBadge}>
                        <Camera size={12} color="white" />
                    </View>
                </View>
                <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.name, { color: colors.text }]}>{userName}</Text>
                        <View style={[styles.badge, { backgroundColor: colors.accentBlue }]}>
                            <Text style={[styles.badgeText, { color: colors.accentBlueText }]}>Student</Text>
                        </View>
                    </View>
                    <Text style={[styles.email, { color: colors.grayText }]}>{userEmail}</Text>
                    <Text style={[styles.memberSince, { color: colors.grayText }]}>{memberSinceDate}</Text>
                </View>
            </View>

            {/* Appearance */}
            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Appearance</Text>
                <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Moon size={20} color={colors.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowTitle, { color: colors.text }]}>Dark Mode</Text>
                            <Text style={[styles.rowSub, { color: colors.grayText }]}>Toggle dark/light theme</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={setIsDarkMode}
                            trackColor={{ false: '#E0E0E0', true: colors.primary }}
                            thumbColor="white"
                        />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity style={styles.row}>
                        <View style={styles.iconBox}>
                            <Palette size={20} color={colors.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.rowTitle, { color: colors.text }]}>Theme Color</Text>
                                <View style={[styles.activeBadge, { backgroundColor: colors.accentPink }]}>
                                    <Text style={[styles.activeText, { color: colors.accentPinkText }]}>Active</Text>
                                </View>
                            </View>
                            <Text style={[styles.rowSub, { color: colors.grayText }]}>Warm gradient theme</Text>
                        </View>
                        <ChevronRight size={20} color={colors.grayText} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notifications */}
            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Notifications</Text>
                <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Bell size={20} color={colors.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowTitle, { color: colors.text }]}>Push Notifications</Text>
                            <Text style={[styles.rowSub, { color: colors.grayText }]}>Receive task and event reminders</Text>
                        </View>
                        <Switch
                            value={pushEnabled}
                            onValueChange={setPushEnabled}
                            trackColor={{ false: '#E0E0E0', true: colors.primary }}
                            thumbColor="white"
                        />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Mail size={20} color={colors.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowTitle, { color: colors.text }]}>Email Updates</Text>
                            <Text style={[styles.rowSub, { color: colors.grayText }]}>Weekly progress summaries</Text>
                        </View>
                        <Switch
                            value={emailEnabled}
                            onValueChange={setEmailEnabled}
                            trackColor={{ false: '#E0E0E0', true: colors.primary }}
                            thumbColor="white"
                        />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Clock size={20} color={colors.grayText} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowTitle, { color: colors.text }]}>Study Reminders</Text>
                            <Text style={[styles.rowSub, { color: colors.grayText }]}>Intelligent study session alerts</Text>
                        </View>
                        <Switch
                            value={studyReminders}
                            onValueChange={setStudyReminders}
                            trackColor={{ false: '#E0E0E0', true: colors.primary }}
                            thumbColor="white"
                        />
                    </View>
                </View>
            </View>

            {/* Account */}
            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Account</Text>
                <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                    <SettingLink icon={User} title="Edit Profile" sub="Update personal information" colors={colors} onPress={() => Alert.alert('Edit Profile', 'Profile editing feature coming soon!')} />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SettingLink icon={Lock} title="Privacy & Security" sub="Manage account security" colors={colors} onPress={() => Alert.alert('Privacy & Security', 'Privacy settings feature coming soon!')} />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SettingLink icon={Globe} title="Language & Region" sub="English (US)" colors={colors} onPress={() => Alert.alert('Language & Region', 'Language settings feature coming soon!')} />
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Quick Actions</Text>
                <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                    <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
                        <Download size={20} color={colors.text} />
                        <Text style={[styles.actionText, { color: colors.text }]}>Export Data</Text>
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity style={styles.actionRow} onPress={handleContactSupport}>
                        <HelpCircle size={20} color={colors.text} />
                        <Text style={[styles.actionText, { color: colors.text }]}>Contact Support</Text>
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
                        <LogOut size={20} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
        </SafeAreaView>
    );
}

function SettingLink({ icon: Icon, title, sub, colors, onPress }: any) {
    return (
        <TouchableOpacity style={styles.row} onPress={onPress}>
            <View style={styles.iconBox}>
                <Icon size={20} color={colors.grayText} />
            </View>
            <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.rowSub, { color: colors.grayText }]}>{sub}</Text>
            </View>
            <ChevronRight size={20} color={colors.grayText} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 100 },
    header: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginTop: 4 },

    profileCard: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    avatarContainer: { position: 'relative', marginRight: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 24, fontWeight: 'bold' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FBC02D', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    profileInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    name: { fontSize: 18, fontWeight: 'bold' },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    email: { fontSize: 14, marginBottom: 4 },
    memberSince: { fontSize: 12 },

    section: { marginBottom: 24 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    card: { borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: 16, fontWeight: '600' },
    rowSub: { fontSize: 12, marginTop: 2 },
    activeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    activeText: { fontSize: 10, fontWeight: 'bold' },

    actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    actionText: { fontSize: 16, fontWeight: '600' },

    divider: { height: 1, marginLeft: 68 },
});