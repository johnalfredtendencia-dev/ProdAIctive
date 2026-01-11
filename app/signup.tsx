import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../components/GradientButton';
import InputField from '../components/InputField';
import Colors from '../constants/Colors';

export default function SignUpScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignUp = () => {
        setError(''); // Clear previous errors
        if (!fullName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        console.log("Signing up with:", fullName, email);
        // Navigate to login page with the new user's data
        router.replace({
            pathname: '/login',
            params: { email, password, fullName },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <Image
                        source={require('../assets/images/logo_P.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Your personal productivity companion</Text>
                </View>

                <View style={styles.form}>
                    <InputField
                        iconName="person-outline"
                        placeholder="Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                    <InputField
                        iconName="mail-outline"
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <InputField
                        iconName="lock-closed-outline"
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <InputField
                        iconName="shield-checkmark-outline"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <GradientButton title="Sign Up" onPress={handleSignUp} />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already a member? </Text>
                        <Link href="/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Log In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 70,
        height: 70,
        borderRadius: 35, // Half of width/height to make it a circle
        resizeMode: 'cover',
        backgroundColor: '#FF6B8B', // A fallback color matching the logo
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.grayText,
        textAlign: 'center',
    },
    form: { width: '100%' },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: Colors.grayText,
        fontSize: 14,
    },
    linkText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
});