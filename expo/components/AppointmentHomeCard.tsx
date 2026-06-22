import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  ChevronRight,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppointments } from '@/providers/AppointmentProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  formatAppointmentDate,
  formatAppointmentTime,
} from '@/types/appointment';

const AppointmentHomeCard = React.memo(() => {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const appointmentContext = useAppointments();
  const nextAppointment = appointmentContext?.nextAppointment ?? null;
  const upcomingAppointments = appointmentContext?.upcomingAppointments ?? [];
  const needsPostSession = appointmentContext?.needsPostSession ?? [];
  const needsPreSession = appointmentContext?.needsPreSession ?? [];

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('appointment_home_card_tapped');
    router.push('/appointments' as any);
  }, [router, trackEvent]);

  const handleDetailPress = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/appointment-detail?id=${id}` as any);
  }, [router]);

  if (upcomingAppointments.length === 0 && needsPostSession.length === 0) {
    return null;
  }

  const reflectCount = needsPostSession.length;
  const prepCount = needsPreSession.length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
      testID="appointment-home-card"
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Calendar size={18} color={Colors.primary} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Appointments</Text>
          <Text style={styles.cardSubtitle}>
            {upcomingAppointments.length > 0
              ? `${upcomingAppointments.length} upcoming`
              : 'Sessions awaiting reflection'}
          </Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      {nextAppointment && (
        <TouchableOpacity
          style={styles.nextSection}
          onPress={(e) => {
            e.stopPropagation();
            handleDetailPress(nextAppointment.id);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.nextTypeDot, { backgroundColor: APPOINTMENT_TYPE_COLORS[nextAppointment.appointmentType] }]} />
          <View style={styles.nextInfo}>
            <Text style={styles.nextName} numberOfLines={1}>{nextAppointment.providerName}</Text>
            <View style={styles.nextMeta}>
              <Text style={styles.nextTypeLabel}>
                {APPOINTMENT_TYPE_LABELS[nextAppointment.appointmentType]}
              </Text>
              <View style={styles.nextTimeBadge}>
                <Clock size={10} color={Colors.textMuted} />
                <Text style={styles.nextTimeText}>
                  {formatAppointmentDate(nextAppointment.dateTime)} · {formatAppointmentTime(nextAppointment.dateTime)}
                </Text>
              </View>
            </View>
          </View>
          {!nextAppointment.preSessionNotes && (
            <View style={styles.prepBadge}>
              <FileText size={10} color={Colors.primary} />
              <Text style={styles.prepBadgeText}>Prep</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {reflectCount > 0 && (
        <View style={styles.reflectBanner}>
          <AlertCircle size={14} color={Colors.accent} />
          <Text style={styles.reflectText}>
            {reflectCount} session{reflectCount !== 1 ? 's' : ''} awaiting reflection
          </Text>
        </View>
      )}

      {reflectCount === 0 && prepCount > 0 && !nextAppointment?.preSessionNotes && (
        <View style={styles.prepBanner}>
          <FileText size={14} color={Colors.primary} />
          <Text style={styles.prepBannerText}>
            Prepare for your upcoming session
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default AppointmentHomeCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  nextSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  nextTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  nextInfo: {
    flex: 1,
  },
  nextName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nextMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  nextTypeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  nextTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nextTimeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  prepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prepBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  reflectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  reflectText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  prepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  prepBannerText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
});
