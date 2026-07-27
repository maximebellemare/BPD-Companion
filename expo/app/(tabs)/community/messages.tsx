import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return localizedText(`${Math.max(1, minutes)}m ago`, `hace ${Math.max(1, minutes)} min`);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return localizedText(`${hours}h ago`, `hace ${hours} h`);
  return localizedText(`${Math.floor(hours / 24)}d ago`, `hace ${Math.floor(hours / 24)} d`);
}

export default function CommunityMessagesScreen() {
  const router = useRouter();
  const { conversations, isLoading } = useCommunityMessages();
  useLanguage();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{localizedText('Private messages', 'Mensajes privados')}</Text>
          <View style={styles.iconButton} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.safetyCard}>
          <Shield size={18} color={Colors.primary} />
          <Text style={styles.safetyText}>
            {localizedText(
              'Private messages are peer support, not crisis support or medical advice. Report or block anyone who feels unsafe.',
              'Los mensajes privados son apoyo entre pares, no apoyo de crisis ni consejo médico. Reporta o bloquea a cualquier persona que se sienta insegura.',
            )}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>{localizedText('Loading messages...', 'Cargando mensajes...')}</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyCard}>
            <MessageCircle size={34} color={Colors.primary} />
            <Text style={styles.emptyTitle}>{localizedText('No private messages yet', 'Aún no hay mensajes privados')}</Text>
            <Text style={styles.emptyBody}>{localizedText('Open a community post and tap Message user to start a supportive conversation.', 'Abre una publicación de la comunidad y toca Enviar mensaje para iniciar una conversación de apoyo.')}</Text>
          </View>
        ) : (
          conversations.map(conversation => {
            const last = conversation.messages[conversation.messages.length - 1];
            return (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationRow}
                onPress={() => router.push(`/community/private-message?id=${conversation.id}` as never)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatar, { backgroundColor: conversation.participant.avatarColor || Colors.primary }]}>
                  <Text style={styles.avatarText}>{conversation.participant.displayName.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.rowText}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle}>{conversation.participant.displayName}</Text>
                    <Text style={styles.rowTime}>{timeAgo(conversation.updatedAt)}</Text>
                  </View>
                  <Text style={styles.rowPreview} numberOfLines={1}>
                    {conversation.blocked ? localizedText('Blocked', 'Bloqueado') : last?.body || localizedText('Conversation started', 'Conversación iniciada')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card },
  navTitle: { fontSize: 18, fontWeight: '900' as const, color: Colors.text },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  safetyCard: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.card, borderRadius: 18, padding: 14 },
  safetyText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '700' as const, color: Colors.textSecondary },
  loading: { alignItems: 'center', paddingTop: 48, gap: 10 },
  loadingText: { color: Colors.textSecondary, fontWeight: '700' as const },
  emptyCard: { alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.card, borderRadius: 20, padding: 24, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '900' as const, color: Colors.text },
  emptyBody: { textAlign: 'center', fontSize: 14, lineHeight: 20, color: Colors.textSecondary, fontWeight: '700' as const },
  conversationRow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.card, borderRadius: 18, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: '900' as const },
  rowText: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '900' as const, color: Colors.text },
  rowTime: { fontSize: 12, fontWeight: '700' as const, color: Colors.textMuted },
  rowPreview: { fontSize: 13, fontWeight: '700' as const, color: Colors.textSecondary },
});
