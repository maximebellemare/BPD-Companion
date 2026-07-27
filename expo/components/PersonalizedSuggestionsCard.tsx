import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ChevronRight, Compass } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { usePersonalization, PersonalizedRecommendation } from '@/hooks/usePersonalization';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function PersonalizedSuggestionsCard() {
  useLanguage();
  const { suggestedTools, growthSignals } = usePersonalization();

  if (suggestedTools.length === 0 && growthSignals.length === 0) return null;

  return (
    <View style={styles.container}>
      {growthSignals.length > 0 && (
        <View style={styles.growthSection}>
          <View style={styles.growthHeader}>
            <Sparkles size={13} color={Colors.success} />
            <Text style={styles.growthTitle}>{localizedText('Growth Signal', 'Señal de crecimiento')}</Text>
          </View>
          <Text style={styles.growthText}>{growthSignals[0]}</Text>
        </View>
      )}

      {suggestedTools.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>{localizedText('Suggested for you', 'Sugerido para ti')}</Text>
          {suggestedTools.slice(0, 2).map((tool) => (
            <SuggestionRow key={tool.id} tool={tool} />
          ))}
        </View>
      )}
    </View>
  );
}

function SuggestionRow({ tool }: { tool: PersonalizedRecommendation }) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push(tool.route as never);
  }, [router, tool.route]);

  return (
    <TouchableOpacity
      style={styles.suggestionRow}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        <Compass size={14} color={Colors.primary} />
      </View>
      <View style={styles.suggestionText}>
        <Text style={styles.suggestionLabel}>{tool.label}</Text>
        <Text style={styles.suggestionReason} numberOfLines={1}>{tool.reason}</Text>
      </View>
      <ChevronRight size={14} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  growthSection: {
    backgroundColor: Colors.successLight,
    padding: 14,
  },
  growthHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 6,
  },
  growthTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  growthText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  suggestionsSection: {
    padding: 14,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  suggestionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    gap: 10,
  },
  suggestionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  suggestionReason: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
