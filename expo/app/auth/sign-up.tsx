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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, isGuest } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const name = displayName.trim();
    const trimmed = email.trim().toLowerCase();
    if (!name) {
      setError('Please enter your name.');
      return;
    }
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Please enter a valid email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ email: trimmed, password, displayName: name }, isGuest);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign up failed';
      setError(msg);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }, [displayName, email, password, signUp, isGuest]);

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

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Keep your entries safe, synced, and always with you.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Your name</Text>
            <View style={styles.inputWrap}>
              <User size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How should we call you?"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                testID="name-input"
              />
            </View>
          </View>

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
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="newPassword"
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

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.terms}>
            By creating an account you agree to our Terms and Privacy Policy.
          </Text>

          <TouchableOpacity
            style={[styles.primary, submitting && styles.primaryDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            testID="sign-up-submit"
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryText}>Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switch}
            onPress={() => router.replace('/auth/sign-in')}
            testID="switch-to-signin"
          >
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Sign in</Text>
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
  terms: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
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
