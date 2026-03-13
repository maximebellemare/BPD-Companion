import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Fingerprint, Compass, BookOpen, Anchor, Shield, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useIdentityValues, useAnchorStatements } from '@/hooks/useIdentity';

interface Props {
  pinnedAnchor?: string | null;
}

const IdentityBuilderCard = React.memo(function IdentityBuilderCard({ pinnedAnchor }: Props) {
  const router = useRouter();
  const { selectedValues } = useIdentityValues();
  const { pinnedAnchors } = useAnchorStatements();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const displayAnchor = pinnedAnchor ?? pinnedAnchors[0]?.text ?? null;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  };

  const accentOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Fingerprint size={18} color="#2D8B7A" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Identity & Self-Trust</Text>
          <Text style={styles.subtitle}>Build a more stable sense of self</Text>
        </View>
      </View>

      {displayAnchor && (
        <Animated.View style={[styles.anchorBanner, { opacity: accentOpacity }]}>
          <Anchor size={14} color="#2D8B7A" />
          <Text style={styles.anchorText} numberOfLines={2}>
            {displayAnchor}
          </Text>
        </Animated.View>
      )}

      {selectedValues.length > 0 && (
        <View style={styles.valuesRow}>
          {selectedValues.slice(0, 4).map(v => (
            <View key={v.id} style={styles.valueChip}>
              <Text style={styles.valueEmoji}>{v.emoji}</Text>
              <Text style={styles.valueLabel}>{v.label}</Text>
            </View>
          ))}
          {selectedValues.length > 4 && (
            <View style={styles.valueChip}>
              <Text style={styles.valueLabel}>+{selectedValues.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => handlePress('/values-explorer')}
          activeOpacity={0.7}
          testID="identity-values-btn"
        >
          <View style={[styles.linkIcon, { backgroundColor: '#E0F5EF' }]}>
            <Compass size={16} color="#2D8B7A" />
          </View>
          <Text style={styles.linkLabel}>Values</Text>
          <ChevronRight size={14} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => handlePress('/self-trust-prompts')}
          activeOpacity={0.7}
          testID="identity-trust-btn"
        >
          <View style={[styles.linkIcon, { backgroundColor: '#F0E6FF' }]}>
            <Shield size={16} color="#8B5CF6" />
          </View>
          <Text style={styles.linkLabel}>Self-Trust</Text>
          <ChevronRight size={14} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => handlePress('/identity-journal')}
          activeOpacity={0.7}
          testID="identity-journal-btn"
        >
          <View style={[styles.linkIcon, { backgroundColor: '#E8F0FE' }]}>
            <BookOpen size={16} color="#3B82F6" />
          </View>
          <Text style={styles.linkLabel}>Journal</Text>
          <ChevronRight size={14} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => handlePress('/anchor-statements')}
          activeOpacity={0.7}
          testID="identity-anchors-btn"
        >
          <View style={[styles.linkIcon, { backgroundColor: '#FFF8F0' }]}>
            <Anchor size={16} color="#D4956A" />
          </View>
          <Text style={styles.linkLabel}>Anchors</Text>
          <ChevronRight size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.conflictBtn}
        onPress={() => handlePress('/conflict-alignment')}
        activeOpacity={0.7}
        testID="identity-conflict-btn"
      >
        <View style={styles.conflictBtnLeft}>
          <View style={styles.conflictIcon}>
            <Fingerprint size={18} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.conflictBtnTitle}>Conflict Self-Alignment</Text>
            <Text style={styles.conflictBtnDesc}>Pause. Align with your values. Respond.</Text>
          </View>
        </View>
        <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </View>
  );
});

export default IdentityBuilderCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  anchorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E0F5EF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C0E5D8',
  },
  anchorText: {
    flex: 1,
    fontSize: 13,
    color: '#2D6B5A',
    lineHeight: 19,
    fontStyle: 'italic',
    fontWeight: '500' as const,
  },
  valuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  valueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  valueEmoji: {
    fontSize: 12,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    flex: 1,
    minWidth: '45%',
  },
  linkIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  conflictBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D8B7A',
    borderRadius: 14,
    padding: 14,
  },
  conflictBtnLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conflictIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictBtnTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  conflictBtnDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
});
