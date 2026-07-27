import React, { Component, ErrorInfo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { RefreshCw, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { localizedText } from '@/lib/i18n/staticText';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error.message);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconWrap}>
              <AlertTriangle size={36} color={Colors.accent} />
            </View>

            <Text style={styles.title}>{localizedText('Something went wrong', 'Algo salió mal')}</Text>
            <Text style={styles.description}>
              {localizedText(
                "An unexpected error occurred. This has been noted and we'll look into it.",
                'Ocurrió un error inesperado. Lo registramos y lo revisaremos.',
              )}
            </Text>

            {this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorLabel}>{localizedText('Error Details', 'Detalles del error')}</Text>
                <Text style={styles.errorText} numberOfLines={4}>
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={this.handleRetry}
              activeOpacity={0.8}
              testID="error-retry-btn"
            >
              <RefreshCw size={18} color={Colors.white} />
              <Text style={styles.retryBtnText}>{localizedText('Try Again', 'Intentar de nuevo')}</Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              {localizedText(
                'If this keeps happening, try restarting the app or contact support.',
                'Si esto sigue ocurriendo, intenta reiniciar la app o contacta a soporte.',
              )}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 36,
    paddingVertical: 60,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.3,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  errorBox: {
    width: '100%' as unknown as number,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 18,
    fontFamily: undefined,
  },
  retryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.brandTeal,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  helpText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 19,
  },
});
