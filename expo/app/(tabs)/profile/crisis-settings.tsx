import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Phone, Shield, AlertCircle, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';

export default function CrisisSettingsScreen() {
  const { t } = useTranslation('profile');
  const router = useRouter();
  const { profile, updateCrisisSupport } = useProfile();

  const [emergencyContact, setEmergencyContact] = useState(profile.crisisSupport.emergencyContact);
  const [crisisLine, setCrisisLine] = useState(profile.crisisSupport.preferredCrisisLine);
  const [threshold, setThreshold] = useState(profile.crisisSupport.autoSafetyModeThreshold);
  const [showReminder, setShowReminder] = useState(profile.crisisSupport.showSafetyModeReminder);

  const handleSave = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    updateCrisisSupport({
      emergencyContact,
      preferredCrisisLine: crisisLine,
      autoSafetyModeThreshold: threshold,
      showSafetyModeReminder: showReminder,
    });
    router.back();
  }, [emergencyContact, crisisLine, threshold, showReminder, updateCrisisSupport, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('crisisSettings.title'),
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} testID="save-crisis-btn">
              <Text style={styles.saveButton}>{t('crisisSettings.save')}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Shield size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            {t('crisisSettings.intro')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('crisisSettings.emergencyContact')}</Text>
          <View style={styles.inputCard}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.dangerLight }]}>
              <Phone size={18} color={Colors.danger} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>{t('crisisSettings.phoneOrName')}</Text>
              <TextInput
                style={styles.textInput}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder={t('crisisSettings.phonePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                testID="emergency-contact-input"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('crisisSettings.crisisLine')}</Text>
          <View style={styles.inputCard}>
            <View style={[styles.inputIcon, { backgroundColor: '#FFFFFF' }]}>
              <AlertCircle size={18} color="#3B82F6" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>{t('crisisSettings.preferredLine')}</Text>
              <TextInput
                style={styles.textInput}
                value={crisisLine}
                onChangeText={setCrisisLine}
                placeholder={t('crisisSettings.linePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                testID="crisis-line-input"
              />
            </View>
          </View>
          <Text style={styles.helperText}>
            {t('crisisSettings.lineHelper')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('crisisSettings.threshold')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('crisisSettings.thresholdDescription')}
          </Text>
          <View style={styles.thresholdRow}>
            {[6, 7, 8, 9, 10].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.thresholdChip, threshold === val && styles.thresholdChipActive]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setThreshold(val);
                }}
              >
                <Text style={[styles.thresholdText, threshold === val && styles.thresholdTextActive]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>{t('crisisSettings.reminder')}</Text>
              <Text style={styles.toggleDesc}>
                {t('crisisSettings.reminderDescription')}
              </Text>
            </View>
            <Switch
              value={showReminder}
              onValueChange={setShowReminder}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={showReminder ? Colors.primary : Colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.gentleNote}>
          <Heart size={14} color={Colors.textMuted} />
          <Text style={styles.gentleNoteText}>
            {t('crisisSettings.note')}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  infoCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  textInput: {
    fontSize: 16,
    color: Colors.text,
    padding: 0,
    fontWeight: '500' as const,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    marginLeft: 4,
  },
  thresholdRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  thresholdChip: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  thresholdChipActive: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  thresholdText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  thresholdTextActive: {
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleContent: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  gentleNote: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 20,
  },
  gentleNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 18,
    maxWidth: 280,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 40,
  },
});
