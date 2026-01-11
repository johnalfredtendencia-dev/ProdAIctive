import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../components/GradientButton';
import InputField from '../components/InputField';
import Colors from '../constants/Colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const params = useLocalSearchParams();

    const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
        clientId: '1234567890-abcdefg.apps.googleusercontent.com', // Replace with your Google OAuth Client ID
        redirectUrl: 'https://auth.expo.io/@yourusername/ProdAIctive', // Replace with your Expo redirect URL
    });

    const [facebookRequest, facebookResponse, facebookPromptAsync] = Facebook.useAuthRequest({
        clientId: '1234567890', // Replace with your Facebook App ID
        redirectUrl: 'https://auth.expo.io/@yourusername/ProdAIctive', // Replace with your Expo redirect URL
    });

    useEffect(() => {
        if (googleResponse?.type === 'success') {
            const { authentication } = googleResponse;
            // User successfully authenticated with Google
            // You can now use authentication.accessToken to get user info
            loginWithGoogle(authentication?.accessToken);
        }
    }, [googleResponse]);

    useEffect(() => {
        if (facebookResponse?.type === 'success') {
            const { authentication } = facebookResponse;
            // User successfully authenticated with Facebook
            // You can now use authentication.accessToken to get user info
            loginWithFacebook(authentication?.accessToken);
        }
    }, [facebookResponse]);

    const handleLogin = () => {
        setError(''); // Clear previous errors
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        // Simulate checking credentials passed from sign-up
        if (params.email && params.password) {
            if (email === params.email && password === params.password) {
                // On successful login, navigate to the dashboard with user's name
                router.replace({ pathname: '/(tabs)', params: { fullName: params.fullName } });
            } else {
                setError('Invalid email or password.');
            }
        } else {
            // If no params, it means user hasn't signed up in this session
            setError('Please sign up first.');
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        if (provider === 'google') {
            googlePromptAsync();
        } else if (provider === 'facebook') {
            facebookPromptAsync();
        }
    };

    const loginWithGoogle = (accessToken?: string) => {
        if (!accessToken) {
            setError('Google authentication failed. Please try again.');
            return;
        }
        // For demo purposes, navigate to dashboard
        // In a real app, you'd send this token to your backend to verify and create/update user
        router.replace({ pathname: '/(tabs)', params: { fullName: 'Google User' } });
    };

    const loginWithFacebook = (accessToken?: string) => {
        if (!accessToken) {
            setError('Facebook authentication failed. Please try again.');
            return;
        }
        // For demo purposes, navigate to dashboard
        // In a real app, you'd send this token to your backend to verify and create/update user
        router.replace({ pathname: '/(tabs)', params: { fullName: 'Facebook User' } });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/logo_P.png')}
                        style={styles.logo}
                    />
                </View>

                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Your personal productivity companion</Text>

                <View style={styles.form}>
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

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <GradientButton title="Sign In" onPress={handleLogin} />

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialLoginContainer}>
                        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('google')}>
                            <Ionicons name="logo-google" size={22} color="#DB4437" />
                            <Text style={styles.socialButtonText}>Continue with Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('facebook')}>
                            <Ionicons name="logo-facebook" size={22} color="#4267B2" />
                            <Text style={styles.socialButtonText}>Continue with Facebook</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>New here? </Text>
                        {/* Link to the Sign Up page */}
                        <Link href="/signup" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        // paddingBottom: 40, // This was pushing content up, removing for true center
        paddingHorizontal: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 70,
        height: 70,
        borderRadius: 35, // Half of width/height to make it a circle
        resizeMode: 'cover',
        backgroundColor: '#FF6B8B', // A fallback color matching the logo
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
        marginBottom: 40,
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8E8E8',
    },
    dividerText: {
        marginHorizontal: 10,
        color: Colors.grayText,
        fontWeight: '600',
    },
    socialLoginContainer: {
        width: '100%',
    },
    socialButton: {
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    socialButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12, // Space for an icon
    },
});