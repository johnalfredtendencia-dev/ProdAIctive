import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
}

export default function GradientButton({ title, onPress }: GradientButtonProps) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                // The colors for the gradient (Pink to slightly darker pink)
                colors={['#FF6B8B', Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
            >
                <Text style={styles.text}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingTop: 15,
        paddingBottom: 15, // Add a little extra padding at the bottom
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 5,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5, // Android shadow
    },
    text: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});