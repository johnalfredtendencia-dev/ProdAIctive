import { Ionicons } from '@expo/vector-icons';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import { Link, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';
import GradientButton from '../components/GradientButton';
import InputField from '../components/InputField';
import Colors from '../constants/Colors';
import { supabase } from '../services/supabaseApi';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
        clientId: '1234567890-abcdefg.apps.googleusercontent.com', // Replace with your Google OAuth Client ID
        redirectUri: 'https://auth.expo.io/@yourusername/ProdAIctive', // Replace with your Expo redirect URL
    });

    const [facebookRequest, facebookResponse, facebookPromptAsync] = Facebook.useAuthRequest({
        clientId: '1234567890', // Replace with your Facebook App ID
        redirectUri: 'https://auth.expo.io/@yourusername/ProdAIctive', // Replace with your Expo redirect URL
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

        handleSignIn();
    };

    const handleSignIn = async () => {
        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);
        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }

            if (data.user && data.session) {
                // Save auth token and user info to secure storage
                await SecureStore.setItemAsync('authToken', data.session.access_token);
                await SecureStore.setItemAsync('userId', data.user.id);
                await SecureStore.setItemAsync('userEmail', data.user.email || '');

                // Navigate to dashboard
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred during login.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        if (provider === 'google') {
            googlePromptAsync();
        } else if (provider === 'facebook') {
            facebookPromptAsync();
        }
    };

    const loginWithGoogle = async (accessToken?: string) => {
        if (!accessToken) {
            setError('Google authentication failed. Please try again.');
            return;
        }
        setLoading(true);
        try {
            // TODO: Implement Google OAuth with Supabase
            // This requires additional Supabase configuration
            setError('Google authentication is not yet configured. Please use email/password.');
        } finally {
            setLoading(false);
        }
    };

    const loginWithFacebook = async (accessToken?: string) => {
        if (!accessToken) {
            setError('Facebook authentication failed. Please try again.');
            return;
        }
        setLoading(true);
        try {
            // TODO: Implement Facebook OAuth with Supabase
            // This requires additional Supabase configuration
            setError('Facebook authentication is not yet configured. Please use email/password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ErrorBoundary>
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

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loadingText}>Signing in...</Text>
                        </View>
                    ) : (
                        <GradientButton title="Sign In" onPress={handleLogin} />
                    )}

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
        </ErrorBoundary>
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
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    loadingText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '500',
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