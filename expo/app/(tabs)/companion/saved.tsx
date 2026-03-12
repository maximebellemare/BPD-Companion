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
import { MessageCircle, Trash2, BookmarkX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { AIConversation } from '@/types/ai';

export default function SavedConversationsScreen() {
  const router = useRouter();
  const {
    savedConversations,
    setActiveConversationId,
    toggleSaveConversation,
    deleteConversation,
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
      'Delete conversation?',
      'This will permanently remove this conversation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
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
            {messageCount} message{messageCount !== 1 ? 's' : ''} · {formatDate(item.updatedAt)}
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

  const renderEmpty = useCallback(() => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📌</Text>
        <Text style={styles.emptyTitle}>No saved conversations</Text>
        <Text style={styles.emptySubtitle}>
          When you have a meaningful conversation, tap the bookmark icon to save it here for later.
        </Text>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Saved Conversations' }} />
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
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 14,
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
  },
});
