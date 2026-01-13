import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorBox}>
            <Text style={styles.title}>⚠️ Something Went Wrong</Text>
            <Text style={styles.message}>{this.state.error?.message}</Text>
            <Text style={styles.stack}>
              {this.state.error?.stack}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                this.setState({ hasError: false, error: null });
              }}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#ffe0e6',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  stack: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 12,
    maxHeight: 100,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
