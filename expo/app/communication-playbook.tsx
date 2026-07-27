import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Shield,
  Clock,
  AlertTriangle,
  Heart,
  MessageCircle,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getEnhancedOutcomes } from '@/services/messages/enhancedOutcomeService';
import { generatePlaybook } from '@/services/messages/communicationProfileService';
import { PlaybookEntry } from '@/types/messageOutcome';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

const CATEGORY_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  best_style: { icon: Heart, color: Colors.brandSage, get label() { return localizedText('Best response style', 'Mejor estilo de respuesta'); } },
  before_texting: { icon: Clock, color: Colors.primary, get label() { return localizedText('Before texting when activated', 'Antes de escribir cuando estás activado/a'); } },
  regret_triggers: { icon: AlertTriangle, color: Colors.danger, get label() { return localizedText('What leads to regret', 'Lo que suele llevar al arrepentimiento'); } },
  do_not_send: { icon: Shield, color: Colors.accent, get label() { return localizedText('Best "do not send" moments', 'Mejores momentos para no enviar'); } },
  after_silence: { icon: MessageCircle, color: Colors.brandLilac, get label() { return localizedText('After relationship silence', 'Después del silencio en la relación'); } },
  after_disrespect: { icon: Shield, color: Colors.brandMist, get label() { return localizedText('After feeling disrespected', 'Después de sentirte faltado/a al respeto'); } },
  secure_style: { icon: Heart, color: Colors.brandSage, get label() { return localizedText('Best secure response style', 'Mejor estilo de respuesta segura'); } },
};

const CONFIDENCE_COLORS = {
  high: Colors.success,
  medium: Colors.accent,
  low: Colors.textMuted,
};

export default function CommunicationPlaybookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();

  const enhancedQuery = useQuery({
    queryKey: ['enhanced-message-outcomes'],
    queryFn: getEnhancedOutcomes,
  });

  const enhancedOutcomes = useMemo(() => enhancedQuery.data ?? [], [enhancedQuery.data]);

  const playbook = useMemo<PlaybookEntry[]>(() => {
    return generatePlaybook(enhancedOutcomes);
  }, [enhancedOutcomes]);

  const hasData = playbook.length > 0;

  const groupedPlaybook = useMemo(() => {
    const groups: Record<string, PlaybookEntry[]> = {};
    playbook.forEach(entry => {
      if (!groups[entry.category]) groups[entry.category] = [];
      groups[entry.category].push(entry);
    });
    return groups;
  }, [playbook]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{localizedText('Communication Playbook', 'Manual de comunicación')}</Text>
          <Text style={styles.headerSub}>{localizedText('Personalized strategies based on your patterns', 'Estrategias personalizadas según tus patrones')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {hasData ? (
          <>
            <View style={styles.heroBanner}>
              <View style={styles.heroIconWrap}>
                <BookOpen size={22} color={Colors.white} />
              </View>
              <Text style={styles.heroTitle}>{localizedText('Your Personal Playbook', 'Tu manual personal')}</Text>
              <Text style={styles.heroDesc}>
                {localizedText(
                  'These strategies are built from your actual communication outcomes. They reflect what works best for you.',
                  'Estas estrategias se crean a partir de tus resultados reales de comunicación. Reflejan lo que mejor funciona para ti.',
                )}
              </Text>
            </View>

            {Object.entries(groupedPlaybook).map(([category, entries]) => {
              const cfg = CATEGORY_CONFIG[category];
              if (!cfg) return null;
              const CategoryIcon = cfg.icon;
              return (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIconWrap, { backgroundColor: cfg.color + '15' }]}>
                      <CategoryIcon size={16} color={cfg.color} />
                    </View>
                    <Text style={styles.categoryTitle}>{cfg.label}</Text>
                  </View>
                  {entries.map((entry) => (
                    <View key={entry.id} style={styles.entryCard}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                        <Text style={styles.entryTitle}>{entry.title}</Text>
                      </View>
                      <Text style={styles.entryDesc}>{entry.description}</Text>
                      <View style={styles.entryFooter}>
                        <View style={[styles.confidenceBadge, { backgroundColor: CONFIDENCE_COLORS[entry.confidence] + '15' }]}>
                          <View style={[styles.confidenceDot, { backgroundColor: CONFIDENCE_COLORS[entry.confidence] }]} />
                          <Text style={[styles.confidenceText, { color: CONFIDENCE_COLORS[entry.confidence] }]}>
                            {localizedText(
                              `${entry.confidence} confidence`,
                              `Confianza ${entry.confidence}`,
                            )}
                          </Text>
                        </View>
                        <Text style={styles.entryBasis}>
                          {localizedText(
                            `Based on ${entry.basedOnOutcomes} outcomes`,
                            `Basado en ${entry.basedOnOutcomes} resultado${entry.basedOnOutcomes === 1 ? '' : 's'}`,
                          )}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}

            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>{localizedText('General communication tips', 'Consejos generales de comunicación')}</Text>
              {GENERAL_TIPS.map((tip, i) => (
                <View key={i} style={styles.tipCard}>
                  <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                  <View style={styles.tipTextWrap}>
                    <Text style={styles.tipLabel}>{tip.title}</Text>
                    <Text style={styles.tipDesc}>{tip.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <BookOpen size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{localizedText('Building your playbook', 'Estamos creando tu manual')}</Text>
            <Text style={styles.emptyDesc}>
              {localizedText(
                'Use the message tool and record outcomes a few more times. The playbook will fill with personalized strategies based on what works for you.',
                'Usa la herramienta de mensajes y registra los resultados algunas veces más. Tu manual se llenará con estrategias personalizadas según lo que funciona para ti.',
              )}
            </Text>
            <View style={styles.emptyPreview}>
              <Text style={styles.emptyPreviewTitle}>{localizedText("What you'll see:", 'Lo que verás:')}</Text>
              <View style={styles.emptyPreviewItem}>
                <Heart size={14} color={Colors.brandSage} />
                <Text style={styles.emptyPreviewText}>{localizedText('Best response style for you', 'El mejor estilo de respuesta para ti')}</Text>
              </View>
              <View style={styles.emptyPreviewItem}>
                <Clock size={14} color={Colors.primary} />
                <Text style={styles.emptyPreviewText}>{localizedText('What to do before texting when activated', 'Qué hacer antes de escribir cuando estás activado/a')}</Text>
              </View>
              <View style={styles.emptyPreviewItem}>
                <AlertTriangle size={14} color={Colors.danger} />
                <Text style={styles.emptyPreviewText}>{localizedText('What usually leads to regret', 'Lo que suele llevar al arrepentimiento')}</Text>
              </View>
              <View style={styles.emptyPreviewItem}>
                <Shield size={14} color={Colors.accent} />
                <Text style={styles.emptyPreviewText}>{localizedText('Best "do not send" moments', 'Mejores momentos para no enviar')}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.privacyCard}>
          <Lock size={14} color={Colors.textMuted} />
          <Text style={styles.privacyText}>
            {localizedText(
              'Your playbook is generated locally. Nothing leaves your device.',
              'Tu manual se genera de forma local. Nada sale de tu dispositivo.',
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const GENERAL_TIPS = [
  {
    emoji: '\u23f3',
    get title() { return localizedText('Pause before reacting', 'Haz una pausa antes de reaccionar'); },
    get description() { return localizedText('Even 2 minutes can reduce emotional flooding and regret risk significantly.', 'Incluso 2 minutos pueden reducir mucho la inundación emocional y el riesgo de arrepentirte.'); },
  },
  {
    emoji: '\ud83c\udf3f',
    get title() { return localizedText('Choose secure over urgent', 'Elige seguridad antes que urgencia'); },
    get description() { return localizedText('Secure responses protect your dignity while still expressing what matters.', 'Las respuestas seguras protegen tu dignidad y aun así expresan lo que importa.'); },
  },
  {
    emoji: '\ud83d\udee1\ufe0f',
    get title() { return localizedText('Short boundaries land better', 'Los límites breves suelen llegar mejor'); },
    get description() { return localizedText('Long explanations often come from urgency. Brevity signals calm confidence.', 'Las explicaciones largas suelen venir de la urgencia. La brevedad transmite calma y seguridad.'); },
  },
  {
    emoji: '\ud83c\udf19',
    get title() { return localizedText('Be extra careful at night', 'Ten más cuidado por la noche'); },
    get description() { return localizedText('Late-night messages tend to carry more emotional intensity and higher regret risk.', 'Los mensajes tarde en la noche suelen traer más intensidad emocional y más riesgo de arrepentimiento.'); },
  },
  {
    emoji: '\ud83d\ude0c',
    get title() { return localizedText('Not sending is a valid choice', 'No enviar también es una opción válida'); },
    get description() { return localizedText('Choosing silence when activated often protects both you and the relationship.', 'Elegir silencio cuando estás activado/a muchas veces te protege a ti y a la relación.'); },
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 21,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  entryEmoji: {
    fontSize: 18,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  entryDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  entryBasis: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  tipsSection: {
    marginTop: 4,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 20,
    marginTop: 1,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  tipDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyPreview: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    width: '100%',
  },
  emptyPreviewTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  emptyPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  emptyPreviewText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
