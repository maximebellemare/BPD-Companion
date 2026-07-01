import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, Send, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { SUPPORT_REACTION_LABELS } from '@/constants/community';
import { useCircleThread } from '@/hooks/useSupportCircles';
import { CircleReply, SupportReaction } from '@/types/community';

function timeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ReactionBar({
  reactions,
  onToggle,
}: {
  reactions: SupportReaction[];
  onToggle: (type: string) => void;
}) {
  return (
    <View style={styles.reactionBar}>
      {reactions.map((reaction) => {
        const info = SUPPORT_REACTION_LABELS[reaction.type];
        if (!info) return null;
        return (
          <TouchableOpacity
            key={reaction.type}
            style={[styles.reactionButton, reaction.userReacted && styles.reactionButtonActive]}
            onPress={() => onToggle(reaction.type)}
            activeOpacity={0.75}
          >
            <Text style={styles.reactionEmoji}>{info.emoji}</Text>
            <Text style={[styles.reactionText, reaction.userReacted && styles.reactionTextActive]}>
              {reaction.count > 0 ? reaction.count : info.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ReplyCard({
  reply,
  onReact,
  onDelete,
}: {
  reply: CircleReply;
  onReact: (replyId: string, type: string) => void;
  onDelete: (replyId: string) => void;
}) {
  const isOwn = reply.author.id === 'current_user';
  return (
    <View style={styles.replyCard}>
      <View style={styles.replyHeader}>
        <Text style={styles.replyAuthor}>{reply.author.isAnonymous ? 'Anonymous' : reply.author.displayName}</Text>
        <View style={styles.replyHeaderRight}>
          <Text style={styles.replyTime}>{timeAgo(reply.createdAt)}</Text>
          {isOwn ? (
            <TouchableOpacity
              onPress={() => onDelete(reply.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID={`circle-delete-reply-${reply.id}`}
            >
              <Trash2 size={14} color={Colors.danger} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <Text style={styles.replyBody}>{reply.body}</Text>
      <ReactionBar reactions={reply.supportReactions} onToggle={(type) => onReact(reply.id, type)} />
    </View>
  );
}

export default function CircleThreadScreen() {
  const router = useRouter();
  const { circleId = '', postId = '' } = useLocalSearchParams<{ circleId?: string; postId?: string }>();
  const { post, replies, isLoading, isError, addReply, isAddingReply, deleteReply, toggleReaction } = useCircleThread(circleId, postId);
  const [replyText, setReplyText] = useState('');

  const handleSend = useCallback(() => {
    const body = replyText.trim();
    if (!body) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addReply(body);
    setReplyText('');
  }, [addReply, replyText]);

  const handleDelete = useCallback((replyId: string) => {
    Alert.alert('Delete reply?', 'Only your own replies can be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReply(replyId);
          } catch (error) {
            Alert.alert('Could not delete reply', error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
    ]);
  }, [deleteReply]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Circle discussion</Text>
            <View style={styles.backButton} />
          </View>
        </SafeAreaView>
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Loading discussion...</Text>
        </View>
      </View>
    );
  }

  if (isError || !post) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Circle discussion</Text>
            <View style={styles.backButton} />
          </View>
        </SafeAreaView>
        <View style={styles.centerState}>
          <MessageCircle size={28} color={Colors.textMuted} />
          <Text style={styles.stateTitle}>Discussion unavailable</Text>
          <Text style={styles.stateText}>This circle discussion could not be loaded.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back to circle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} testID="circle-thread-back">
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>Circle discussion</Text>
          <View style={styles.backButton} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.postAuthor}>{post.author.isAnonymous ? 'Anonymous' : post.author.displayName}</Text>
              <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
            </View>
            <Text style={styles.postBody}>{post.body}</Text>
            <ReactionBar reactions={post.supportReactions} onToggle={(type) => toggleReaction({ reactionType: type })} />
          </View>

          <View style={styles.repliesHeader}>
            <Text style={styles.repliesTitle}>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</Text>
          </View>

          {replies.length === 0 ? (
            <View style={styles.emptyReplies}>
              <Text style={styles.stateText}>Be the first to reply with support.</Text>
            </View>
          ) : replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              onReact={(replyId, type) => toggleReaction({ reactionType: type, replyId })}
              onDelete={handleDelete}
            />
          ))}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.composerSafe}>
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Write a supportive reply..."
              placeholderTextColor={Colors.textMuted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={1000}
              testID="circle-reply-input"
            />
            <TouchableOpacity
              style={[styles.sendButton, replyText.trim() && styles.sendButtonActive]}
              onPress={handleSend}
              disabled={!replyText.trim() || isAddingReply}
              testID="circle-send-reply"
            >
              {isAddingReply ? <ActivityIndicator size="small" color={Colors.white} /> : <Send size={16} color={Colors.white} />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  safeTop: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  stateTitle: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  stateText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, marginTop: 8 },
  primaryButtonText: { color: Colors.white, fontSize: 14, fontWeight: '800' as const },
  content: { padding: 16, paddingBottom: 24 },
  postCard: { backgroundColor: Colors.white, borderRadius: 18, borderWidth: 1, borderColor: Colors.borderLight, padding: 18, marginBottom: 18 },
  postTitle: { fontSize: 21, lineHeight: 27, fontWeight: '800' as const, color: Colors.text, marginBottom: 8 },
  postMeta: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  postAuthor: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' as const },
  postTime: { fontSize: 13, color: Colors.textMuted },
  postBody: { fontSize: 15, lineHeight: 23, color: Colors.text, marginBottom: 14 },
  reactionBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: Colors.borderLight },
  reactionButtonActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  reactionEmoji: { fontSize: 13 },
  reactionText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700' as const },
  reactionTextActive: { color: Colors.primary },
  repliesHeader: { marginBottom: 10 },
  repliesTitle: { fontSize: 16, fontWeight: '800' as const, color: Colors.text },
  emptyReplies: { paddingVertical: 24, alignItems: 'center' },
  replyCard: { backgroundColor: Colors.white, borderRadius: 15, borderWidth: 1, borderColor: Colors.borderLight, padding: 14, marginBottom: 10 },
  replyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  replyHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyAuthor: { fontSize: 13, fontWeight: '800' as const, color: Colors.textSecondary },
  replyTime: { fontSize: 11, color: Colors.textMuted },
  replyBody: { fontSize: 14, lineHeight: 21, color: Colors.text, marginBottom: 10 },
  composerSafe: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  input: { flex: 1, maxHeight: 110, minHeight: 42, borderRadius: 18, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 10, color: Colors.text, fontSize: 14 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sendButtonActive: { backgroundColor: Colors.primary },
});
