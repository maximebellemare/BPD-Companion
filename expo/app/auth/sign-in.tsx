import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email: trimmed, password });
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign in failed';
      setError(msg);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }, [email, password, signIn]);

  const handleForgot = useCallback(() => {
    const trimmed = email.trim().toLowerCase();
    const msg = trimmed
      ? `We'll send reset instructions to ${trimmed}. (Coming soon)`
      : 'Enter your email above, then tap Forgot password again. (Coming soon)';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert('Reset password', msg);
    }
  }, [email]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="back">
            <ArrowLeft size={22} color={Colors.brandNavy} />
          </TouchableOpacity>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to sync your journey across devices.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                testID="email-input"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                testID="password-input"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={18} color={Colors.textMuted} />
                ) : (
                  <Eye size={18} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleForgot} style={styles.forgot} testID="forgot">
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primary, submitting && styles.primaryDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            testID="sign-in-submit"
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switch}
            onPress={() => router.replace('/auth/sign-up')}
            testID="switch-to-signup"
          >
            <Text style={styles.switchText}>
              New here? <Text style={styles.switchLink}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 22,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.brandNavy,
    paddingVertical: Platform.OS === 'ios' ? 0 : 8,
  },
  forgot: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: {
    color: Colors.brandTeal,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.dangerDark,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  primary: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.7 },
  primaryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  switch: { alignItems: 'center', paddingVertical: 20 },
  switchText: { color: Colors.textSecondary, fontSize: 14 },
  switchLink: { color: Colors.brandTeal, fontWeight: '600' as const },
});
