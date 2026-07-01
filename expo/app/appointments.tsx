import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  ChevronRight,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppointments } from '@/providers/AppointmentProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  Appointment,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  LOCATION_TYPE_LABELS,
  formatAppointmentDate,
  formatAppointmentTime,
  isAppointmentPast,
} from '@/types/appointment';

const LocationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'telehealth': return <Video size={13} color={Colors.textMuted} />;
    case 'phone': return <Phone size={13} color={Colors.textMuted} />;
    default: return <MapPin size={13} color={Colors.textMuted} />;
  }
};

function AppointmentCard({ appointment, onPress }: { appointment: Appointment; onPress: () => void }) {
  const isPast = isAppointmentPast(appointment);
  const typeColor = APPOINTMENT_TYPE_COLORS[appointment.appointmentType];
  const needsPostSession = isPast && !appointment.completed && !appointment.postSessionNotes;

  return (
    <TouchableOpacity
      style={[styles.appointmentCard, isPast && !appointment.completed && styles.appointmentCardPast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
      <View style={styles.appointmentContent}>
        <View style={styles.appointmentTopRow}>
          <Text style={styles.providerName} numberOfLines={1}>{appointment.providerName}</Text>
          {appointment.completed && (
            <CheckCircle2 size={16} color={Colors.success} />
          )}
          {needsPostSession && (
            <View style={styles.reflectBadge}>
              <Text style={styles.reflectBadgeText}>Reflect</Text>
            </View>
          )}
        </View>
        <Text style={styles.typeLabel}>
          {APPOINTMENT_TYPE_LABELS[appointment.appointmentType]}
        </Text>
        <View style={styles.appointmentMeta}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatAppointmentDate(appointment.dateTime)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatAppointmentTime(appointment.dateTime)}</Text>
          </View>
          <View style={styles.metaItem}>
            <LocationIcon type={appointment.locationType} />
            <Text style={styles.metaText}>{LOCATION_TYPE_LABELS[appointment.locationType]}</Text>
          </View>
        </View>
        {appointment.topicsToDiscuss.length > 0 && (
          <View style={styles.topicsRow}>
            <FileText size={11} color={Colors.primary} />
            <Text style={styles.topicsText}>
              {appointment.topicsToDiscuss.length} topic{appointment.topicsToDiscuss.length !== 1 ? 's' : ''} to discuss
            </Text>
          </View>
        )}
      </View>
      <ChevronRight size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const appointmentContext = useAppointments();
  const upcomingAppointments = appointmentContext?.upcomingAppointments ?? [];
  const pastAppointments = appointmentContext?.pastAppointments ?? [];
  const needsPostSession = appointmentContext?.needsPostSession ?? [];

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'appointments' });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, trackEvent]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleAdd = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/appointment-add' as any);
  }, [router]);

  const handleDetail = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/appointment-detail?id=${id}` as any);
  }, [router]);

  const hasReflections = needsPostSession.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} testID="close-appointments">
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Appointments</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn} testID="add-appointment">
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {hasReflections && (
            <View style={styles.reflectionBanner}>
              <View style={styles.reflectionBannerIcon}>
                <AlertCircle size={18} color={Colors.accent} />
              </View>
              <View style={styles.reflectionBannerContent}>
                <Text style={styles.reflectionBannerTitle}>
                  {needsPostSession.length} session{needsPostSession.length !== 1 ? 's' : ''} awaiting reflection
                </Text>
                <Text style={styles.reflectionBannerText}>
                  Capture your takeaways while they're fresh
                </Text>
              </View>
            </View>
          )}

          {upcomingAppointments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {upcomingAppointments.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onPress={() => handleDetail(appt.id)}
                />
              ))}
            </View>
          )}

          {needsPostSession.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Needs Reflection</Text>
              {needsPostSession.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onPress={() => handleDetail(appt.id)}
                />
              ))}
            </View>
          )}

          {pastAppointments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past</Text>
              {pastAppointments.filter(a => a.completed).map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onPress={() => handleDetail(appt.id)}
                />
              ))}
            </View>
          )}

          {upcomingAppointments.length === 0 && pastAppointments.length === 0 && needsPostSession.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Calendar size={40} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Appointments Yet</Text>
              <Text style={styles.emptyText}>
                Track your therapy, psychiatry, and support appointments to stay organized and prepared.
              </Text>
              <TouchableOpacity style={styles.emptyAction} onPress={handleAdd} activeOpacity={0.7}>
                <Plus size={18} color={Colors.white} />
                <Text style={styles.emptyActionText}>Add Your First Appointment</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  topTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  reflectionBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.accentLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  reflectionBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionBannerContent: {
    flex: 1,
  },
  reflectionBannerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  reflectionBannerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 2,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  appointmentCardPast: {
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  typeIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 14,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  typeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  appointmentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  topicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: Colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topicsText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  reflectBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reflectBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
