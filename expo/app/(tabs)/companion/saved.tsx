import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MessageCircle, Trash2, BookmarkX, Sparkles, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { AIConversation } from '@/types/ai';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function SavedConversationsScreen() {
  const router = useRouter();
  useLanguage();
  const {
    savedConversations,
    setActiveConversationId,
    toggleSaveConversation,
    deleteConversation,
    startNewConversation,
  } = useAICompanion();

  const handleOpen = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    router.push('/companion/chat' as never);
  }, [setActiveConversationId, router]);

  const handleUnsave = useCallback((conversationId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleSaveConversation(conversationId);
  }, [toggleSaveConversation]);

  const handleDelete = useCallback((conversationId: string) => {
    Alert.alert(
      localizedText('Delete conversation?', '¿Eliminar conversación?'),
      localizedText('This will permanently remove this conversation.', 'Esto eliminará la conversación de forma permanente.'),
      [
        { text: localizedText('Cancel', 'Cancelar'), style: 'cancel' },
        {
          text: localizedText('Delete', 'Eliminar'),
          style: 'destructive',
          onPress: () => deleteConversation(conversationId),
        },
      ]
    );
  }, [deleteConversation]);

  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return localizedText('Today', 'Hoy');
    if (diffDays === 1) return localizedText('Yesterday', 'Ayer');
    if (diffDays < 7) return localizedText(`${diffDays} days ago`, `Hace ${diffDays} días`);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  const renderItem = useCallback(({ item }: { item: AIConversation }) => {
    const messageCount = item.messages.length;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOpen(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardIconWrap}>
          <MessageCircle size={18} color={Colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            {localizedText(
              `${messageCount} message${messageCount !== 1 ? 's' : ''}`,
              `${messageCount} mensaje${messageCount === 1 ? '' : 's'}`,
            )} · {formatDate(item.updatedAt)}
          </Text>
          {item.preview ? (
            <Text style={styles.cardPreview} numberOfLines={2}>{item.preview}</Text>
          ) : null}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagRow}>
              {item.tags.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleUnsave(item.id)}
            style={styles.cardActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <BookmarkX size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.cardActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [handleOpen, handleUnsave, handleDelete, formatDate]);

  const keyExtractor = useCallback((item: AIConversation) => item.id, []);

  const handleNewChat = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    startNewConversation();
    router.push('/companion/chat' as never);
  }, [startNewConversation, router]);

  const renderEmpty = useCallback(() => {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Sparkles size={32} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{localizedText('No saved conversations yet', 'Aún no hay conversaciones guardadas')}</Text>
        <Text style={styles.emptySubtitle}>
          {localizedText(
            'Your conversations will show up here as you use AI Companion. Tap the bookmark icon during a chat to save it.',
            'Tus conversaciones aparecerán aquí mientras uses AI Companion. Toca el ícono de marcador durante un chat para guardarla.',
          )}
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleNewChat}
          activeOpacity={0.8}
          testID="saved-empty-start-btn"
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.emptyButtonText}>{localizedText('Start a conversation', 'Iniciar conversación')}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [handleNewChat]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: localizedText('Saved Conversations', 'Conversaciones guardadas') }} />
      <FlatList
        data={savedConversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          savedConversations.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center' as const,
  },
  card: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  cardMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  cardPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  tagRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 5,
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.primaryDark,
  },
  cardActions: {
    gap: 12,
    paddingLeft: 8,
    paddingTop: 2,
  },
  cardActionBtn: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
