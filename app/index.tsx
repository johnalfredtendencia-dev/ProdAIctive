import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../components/GradientButton';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

// Data for our onboarding slides
const SLIDES = [
    {
        id: 1,
        title: 'ProdAIctive', // We will custom render this title to make "AI" pink
        description: 'Your personal productivity companion powered by intelligence.',
        icon: 'rocket-outline' as const,
    },
    {
        id: 2,
        title: 'Track Focus',
        description: 'Stay on track with our advanced Pomodoro timer and analytics.',
        icon: 'timer-outline' as const,
    },
    {
        id: 3,
        title: 'Achieve Goals',
        description: 'Organize your tasks efficiently and reach your potential.',
        icon: 'trophy-outline' as const,
    },
];

export default function OnboardingScreen() {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const router = useRouter();
    const flatListRef = useRef<FlatList<any>>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        const nextSlideIndex = currentSlideIndex + 1;
        if (nextSlideIndex < SLIDES.length) {
            const offset = nextSlideIndex * width;
            flatListRef.current?.scrollToOffset({ offset, animated: true });
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        const lastSlideIndex = SLIDES.length - 1;
        const offset = lastSlideIndex * width;
        flatListRef.current?.scrollToOffset({ offset, animated: true });
    };

    const completeOnboarding = () => {
        // Navigate to the Login screen
        // Make sure you have the file app/login.tsx created!
        router.replace('/login');
    };

    const onViewableItemsChanged = ({ viewableItems }: any) => {
        if (viewableItems[0] !== undefined) {
            setCurrentSlideIndex(viewableItems[0].index);
        }
    };

    // Used to only trigger the viewable items change on user interaction
    const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

    const Slide = ({ item, index }: { item: (typeof SLIDES)[0], index: number }) => {
        // Calculate the opacity based on the scroll position
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0], // Fade in when it's the current slide, fade out otherwise
            extrapolate: 'clamp',
        });

        return (
            <Animated.View style={[styles.slide, { opacity }]}>
                {/* Icon Area */}
                <View style={styles.imageContainer}>
                    <Ionicons name={item.icon} size={100} color={Colors.primary} />
                </View>

                {/* Title Area - Custom logic for the Brand Name */}
                {item.id === 1 ? (
                    <View style={styles.brandTitleContainer}>
                        <Text style={styles.title}>Prod</Text>
                        <Text style={[styles.title, { color: Colors.primary }]}>AI</Text>
                        <Text style={styles.title}>ctive</Text>
                    </View>
                ) : (
                    <Text style={styles.title}>{item.title}</Text>
                )}

                <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                {/* Wrapper to group content for centering */}
                <View>
                    <Animated.FlatList
                        ref={flatListRef}
                        data={SLIDES}
                        renderItem={({ item, index }) => <Slide item={item} index={index} />}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                    />

                    {/* Footer: Dots & Buttons */}
                    <View style={styles.footer}>

                        {/* Pagination Dots */}
                        <View style={styles.pagination}>
                            {SLIDES.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        currentSlideIndex === index && styles.activeDot,
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            {currentSlideIndex < SLIDES.length - 1 ? (
                                <View style={styles.navigationButtons}>
                                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                                        <Text style={styles.skipText}>Skip</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                                        <Text style={styles.nextText}>Next</Text>
                                        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <GradientButton title="Get Started" onPress={completeOnboarding} />
                            )}
                        </View>
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
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    slide: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        width: width, // Each slide takes the full width
    },
    imageContainer: {
        width: 200,
        height: 200,
        backgroundColor: '#FFF0F3', // Very light pink background for circle
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    brandTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: Colors.grayText,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: '80%',
    },
    footer: {
        paddingHorizontal: 30,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    dot: {
        height: 8,
        width: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: Colors.primary,
        width: 20, // Make the active dot a bit longer
    },
    buttonContainer: {
        height: 60, // Fixed height to prevent jumping
        justifyContent: 'center',
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    skipButton: {
        // Add some padding to give it space from the edge
        padding: 20,
    },
    skipText: {
        fontSize: 16,
        color: Colors.grayText,
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    nextText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});