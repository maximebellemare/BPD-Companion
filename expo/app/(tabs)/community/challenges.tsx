import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  Calendar,
  Check,
  Trophy,
  Flame,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import { useChallenges, useChallengeProgress } from '@/hooks/useSupportCircles';
import { CommunityChallenge, ChallengeProgress } from '@/types/community';

function ChallengeProgressBar({ completed, total, color }: { completed: number; total: number; color: string }) {
  useLanguage();
  const progress = total > 0 ? completed / total : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start();
  }, [progress, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBarFill, { width: animatedWidth, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressBarText}>
        {completed}/{total} {localizedText('days', 'días')}
      </Text>
    </View>
  );
}

function ParticipantRow({ participants, color }: { participants: ChallengeProgress[]; color: string }) {
  useLanguage();
  const sorted = useMemo(
    () => [...participants].sort((a, b) => b.completedDays - a.completedDays),
    [participants]
  );

  if (sorted.length === 0) return null;

  return (
    <View style={styles.participantSection}>
      <Text style={styles.participantTitle}>{localizedText('Participants', 'Participantes')}</Text>
      {sorted.map((p) => (
        <View key={p.userId} style={styles.participantRow}>
          <View style={styles.participantInfo}>
            <View style={[styles.participantAvatar, { backgroundColor: color + '20' }]}>
              <Text style={[styles.participantInitial, { color }]}>
                {p.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.participantName, p.isCurrentUser && styles.participantNameCurrent]}>
                {p.displayName}
              </Text>
              <Text style={styles.participantDays}>
                {localizedText(
                  `${p.completedDays} of ${p.totalDays} days`,
                  `${p.completedDays} de ${p.totalDays} días`,
                )}
              </Text>
            </View>
          </View>
          <ChallengeProgressBar completed={p.completedDays} total={p.totalDays} color={color} />
        </View>
      ))}
    </View>
  );
}

const ChallengeCard = React.memo(function ChallengeCard({
  challenge,
  onJoin,
  onLeave: _onLeave,
  onCheckIn,
  isJoining,
  isCheckingIn,
}: {
  challenge: CommunityChallenge;
  onJoin: () => void;
  onLeave: () => void;
  onCheckIn: () => void;
  isJoining: boolean;
  isCheckingIn: boolean;
}) {
  useLanguage();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { progress } = useChallengeProgress(challenge.id);

  const userProgress = useMemo(
    () => progress.find((p) => p.isCurrentUser),
    [progress]
  );

  const canCheckIn = useMemo(() => {
    if (!userProgress) return false;
    if (userProgress.completedDays >= challenge.durationDays) return false;
    const hoursSinceLastCheckIn = (Date.now() - userProgress.lastCheckedIn) / 3600000;
    return hoursSinceLastCheckIn >= 12;
  }, [userProgress, challenge.durationDays]);

  const isCompleted = userProgress ? userProgress.completedDays >= challenge.durationDays : false;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.challengeCard, { transform: [{ scale: scaleAnim }], borderColor: challenge.color + '30' }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`challenge-${challenge.id}`}
      >
        <View style={styles.challengeHeader}>
          <View style={[styles.challengeEmojiCircle, { backgroundColor: challenge.color + '15' }]}>
            <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
          </View>
          <View style={styles.challengeHeaderInfo}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <View style={styles.challengeMetaRow}>
              <Calendar size={12} color={Colors.textMuted} />
              <Text style={styles.challengeMetaText}>
                {challenge.durationDays} {localizedText('days', 'días')}
              </Text>
              <View style={styles.metaDot} />
              <Users size={12} color={Colors.textMuted} />
              <Text style={styles.challengeMetaText}>{challenge.participantCount}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.challengeDescription}>{challenge.description}</Text>

        {challenge.isJoined && userProgress && (
          <View style={styles.myProgressSection}>
            <View style={styles.myProgressHeader}>
              <Flame size={14} color={challenge.color} />
              <Text style={[styles.myProgressLabel, { color: challenge.color }]}>
                {localizedText('Your progress', 'Tu progreso')}
              </Text>
            </View>
            <ChallengeProgressBar
              completed={userProgress.completedDays}
              total={userProgress.totalDays}
              color={challenge.color}
            />
          </View>
        )}

        {challenge.isJoined && (
          <View style={styles.dailyPromptCard}>
            <Text style={styles.dailyPromptLabel}>{localizedText('Daily prompt', 'Pregunta diaria')}</Text>
            <Text style={styles.dailyPromptText}>{challenge.dailyPrompt}</Text>
          </View>
        )}

        {challenge.isJoined && progress.length > 1 && (
          <ParticipantRow participants={progress} color={challenge.color} />
        )}

        <View style={styles.challengeActions}>
          {!challenge.isJoined ? (
            <TouchableOpacity
              style={[styles.challengeBtn, { backgroundColor: challenge.color }]}
              onPress={onJoin}
              disabled={isJoining}
              testID={`join-challenge-${challenge.id}`}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Users size={16} color={Colors.white} />
                  <Text style={styles.challengeBtnText}>{localizedText('Join challenge', 'Unirme al reto')}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : isCompleted ? (
            <View style={[styles.challengeBtn, styles.completedBtn]}>
              <Trophy size={16} color={Colors.success} />
              <Text style={styles.completedBtnText}>{localizedText('Completed!', 'Completado')}</Text>
            </View>
          ) : (
            <View style={styles.joinedActions}>
              <TouchableOpacity
                style={[
                  styles.checkInBtn,
                  { backgroundColor: challenge.color },
                  !canCheckIn && styles.checkInBtnDisabled,
                ]}
                onPress={onCheckIn}
                disabled={!canCheckIn || isCheckingIn}
                testID={`checkin-${challenge.id}`}
              >
                {isCheckingIn ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Check size={16} color={Colors.white} />
                    <Text style={styles.checkInBtnText}>
                      {canCheckIn ? localizedText('Check in today', 'Registrar hoy') : localizedText('Checked in', 'Registrado')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ChallengesScreen() {
  const router = useRouter();
  useLanguage();
  const {
    challenges,
    isLoading,
    joinChallenge,
    leaveChallenge,
    checkInChallenge,
    isJoining,
    isCheckingIn,
  } = useChallenges();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const joinedChallenges = useMemo(
    () => challenges.filter((c) => c.isJoined),
    [challenges]
  );

  const availableChallenges = useMemo(
    () => challenges.filter((c) => !c.isJoined),
    [challenges]
  );

  const handleJoin = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    joinChallenge(id);
  }, [joinChallenge]);

  const handleLeave = useCallback((id: string) => {
    leaveChallenge(id);
  }, [leaveChallenge]);

  const handleCheckIn = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    checkInChallenge(id);
  }, [checkInChallenge]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{localizedText('Challenges', 'Retos')}</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>🎯</Text>
            <Text style={styles.introTitle}>{localizedText('Community Challenges', 'Retos de la comunidad')}</Text>
            <Text style={styles.introText}>
              {localizedText(
                'Join challenges with other members. Practice skills together, track progress, and encourage each other along the way.',
                'Únete a retos con otras personas. Practiquen habilidades juntas, registren avances y anímense en el camino.',
              )}
            </Text>
          </View>

          {isLoading && (
            <View style={styles.loadingState}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}

          {joinedChallenges.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Flame size={16} color={Colors.brandAmber} />
                <Text style={styles.sectionTitle}>{localizedText('Your active challenges', 'Tus retos activos')}</Text>
              </View>
              {joinedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={() => handleJoin(challenge.id)}
                  onLeave={() => handleLeave(challenge.id)}
                  onCheckIn={() => handleCheckIn(challenge.id)}
                  isJoining={isJoining}
                  isCheckingIn={isCheckingIn}
                />
              ))}
            </>
          )}

          {availableChallenges.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Trophy size={16} color={Colors.brandLilac} />
                <Text style={styles.sectionTitle}>{localizedText('Available challenges', 'Retos disponibles')}</Text>
              </View>
              {availableChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={() => handleJoin(challenge.id)}
                  onLeave={() => handleLeave(challenge.id)}
                  onCheckIn={() => handleCheckIn(challenge.id)}
                  isJoining={isJoining}
                  isCheckingIn={isCheckingIn}
                />
              ))}
            </>
          )}
        </Animated.View>

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
  safeTop: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  introCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  introEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  loadingState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  challengeCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  challengeEmojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeEmoji: {
    fontSize: 26,
  },
  challengeHeaderInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  challengeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  challengeMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  challengeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 14,
  },
  myProgressSection: {
    marginBottom: 14,
  },
  myProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  myProgressLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    minWidth: 50,
    textAlign: 'right',
  },
  dailyPromptCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  dailyPromptLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.brandAmber,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dailyPromptText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  participantSection: {
    marginBottom: 14,
  },
  participantTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  participantRow: {
    marginBottom: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  participantName: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  participantNameCurrent: {
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  participantDays: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  challengeActions: {
    marginTop: 2,
  },
  challengeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  challengeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  completedBtn: {
    backgroundColor: Colors.successLight,
  },
  completedBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  joinedActions: {
    gap: 8,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  checkInBtnDisabled: {
    opacity: 0.5,
  },
  checkInBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
