import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Sparkles, MessageSquare, Compass, Leaf } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { JournalConnectionSuggestion } from '@/services/crossLoop/crossLoopBridgeService';

interface CrossLoopSuggestionsProps {
  suggestions: JournalConnectionSuggestion[];
  context?: 'journal' | 'messages';
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'discuss_with_companion': <Sparkles size={14} color={Colors.primary} />,
  'use_message_tool': <MessageSquare size={14} color="#3B82F6" />,
  'try_skill': <Compass size={14} color={Colors.brandSage} />,
  'write_reflection': <Leaf size={14} color={Colors.accent} />,
};

export default function CrossLoopSuggestions({ suggestions, context = 'journal' }: CrossLoopSuggestionsProps) {
  const router = useRouter();

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {context === 'journal' ? 'What you can do next' : 'Continue your process'}
      </Text>
      {suggestions.map((suggestion) => (
        <TouchableOpacity
          key={suggestion.type}
          style={styles.card}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (suggestion.params) {
              const query = Object.entries(suggestion.params)
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join('&');
              router.push(`${suggestion.route}?${query}` as never);
            } else {
              router.push(suggestion.route as never);
            }
          }}
          activeOpacity={0.7}
          testID={`cross-loop-${suggestion.type}`}
        >
          <View style={styles.iconWrap}>
            {ICON_MAP[suggestion.type] ?? <Compass size={14} color={Colors.primary} />}
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>{suggestion.label}</Text>
          </View>
          <ChevronRight size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});
