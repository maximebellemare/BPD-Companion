import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '@/constants/colors';

type CompanionErrorBoundaryProps = {
  children: React.ReactNode;
};

type CompanionErrorBoundaryState = {
  hasError: boolean;
};

export default class CompanionErrorBoundary extends React.Component<CompanionErrorBoundaryProps, CompanionErrorBoundaryState> {
  state: CompanionErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): CompanionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.warn('[CompanionErrorBoundary] Companion render failed:', error);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Companion is loading</Text>
          <Text style={styles.body}>Please try again. Your other tabs are still available.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
});
