import { Ionicons } from '@expo/vector-icons'; // Specific icon set
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Colors from '../constants/Colors';

// We define what props (settings) this component accepts
interface InputFieldProps extends TextInputProps {
    iconName: keyof typeof Ionicons.glyphMap; // Ensures we only use valid icon names
}

export default function InputField({ iconName, ...otherProps }: InputFieldProps) {
    return (
        <View style={styles.container}>
            <Ionicons name={iconName} size={20} color={Colors.grayText} style={styles.icon} />
            <TextInput
                style={styles.input}
                placeholderTextColor={Colors.grayText}
                {...otherProps} // Passes down all other standard text input props (like secureTextEntry)
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 15, // Soft rounded corners
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15, // Space between inputs
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
});