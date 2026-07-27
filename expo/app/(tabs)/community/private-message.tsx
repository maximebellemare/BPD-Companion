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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Ban, Flag, Send, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCommunityPrivateConversation } from '@/hooks/useCommunityMessages';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function PrivateMessageThreadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  useLanguage();
  const conversationId = params.id ?? '';
  const { conversation, isLoading, sendMessage, isSending, reportConversation, blockUser } = useCommunityPrivateConversation(conversationId);
  const [message, setMessage] = useState('');

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;
    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      Alert.alert(
        localizedText('Could not send', 'No se pudo enviar'),
        error instanceof Error ? error.message : localizedText('Please try again.', 'Inténtalo de nuevo.'),
      );
    }
  }, [message, sendMessage]);

  const handleReport = useCallback(() => {
    Alert.alert(localizedText('Report user?', '¿Reportar usuario?'), localizedText('We will save this report for moderation review.', 'Guardaremos este reporte para revisión de moderación.'), [
      { text: localizedText('Cancel', 'Cancelar'), style: 'cancel' },
      {
        text: localizedText('Report', 'Reportar'),
        style: 'destructive',
        onPress: async () => {
          try {
            await reportConversation('private_message');
            Alert.alert(localizedText('Report received', 'Reporte recibido'), localizedText('Thank you. You can also block this user.', 'Gracias. También puedes bloquear a este usuario.'));
          } catch (error) {
            Alert.alert(localizedText('Could not report', 'No se pudo reportar'), error instanceof Error ? error.message : localizedText('Please try again.', 'Inténtalo de nuevo.'));
          }
        },
      },
    ]);
  }, [reportConversation]);

  const handleBlock = useCallback(() => {
    Alert.alert(localizedText('Block this user?', '¿Bloquear a este usuario?'), localizedText('Blocked users cannot message or interact with you.', 'Los usuarios bloqueados no pueden enviarte mensajes ni interactuar contigo.'), [
      { text: localizedText('Cancel', 'Cancelar'), style: 'cancel' },
      {
        text: localizedText('Block', 'Bloquear'),
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser();
            Alert.alert(localizedText('User blocked', 'Usuario bloqueado'), localizedText('This conversation is now blocked.', 'Esta conversación ahora está bloqueada.'));
          } catch (error) {
            Alert.alert(localizedText('Could not block', 'No se pudo bloquear'), error instanceof Error ? error.message : localizedText('Please try again.', 'Inténtalo de nuevo.'));
          }
        },
      },
    ]);
  }, [blockUser]);

  if (isLoading || !conversation) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>{localizedText('Message', 'Mensaje')}</Text>
            <View style={styles.iconButton} />
          </View>
        </SafeAreaView>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>
            {isLoading ? localizedText('Loading conversation...', 'Cargando conversación...') : localizedText('Conversation not found.', 'Conversación no encontrada.')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>{conversation.participant.displayName}</Text>
            <Text style={styles.navSubtitle}>{localizedText('Peer support', 'Apoyo entre pares')}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={handleReport}>
            <Flag size={19} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.messagesContent}>
          <View style={styles.safetyCard}>
            <Shield size={17} color={Colors.primary} />
            <Text style={styles.safetyText}>Private messages are peer support. Do not use this for crisis support or medical advice.</Text>
          </View>
          {conversation.blocked ? (
            <View style={styles.blockedCard}>
              <Ban size={22} color={Colors.danger} />
              <Text style={styles.blockedTitle}>User blocked</Text>
              <Text style={styles.blockedText}>You cannot message or interact with this user.</Text>
            </View>
          ) : null}
          {conversation.messages.map(item => {
            const own = item.senderId === 'current_user';
            return (
              <View key={item.id} style={[styles.messageBubble, own ? styles.ownBubble : styles.theirBubble]}>
                <Text style={[styles.messageText, own ? styles.ownText : styles.theirText]}>{item.body}</Text>
                <Text style={[styles.messageTime, own ? styles.ownTime : styles.theirTime]}>{formatTime(item.createdAt)}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={conversation.blocked ? 'Blocked user' : 'Write a supportive message...'}
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            editable={!conversation.blocked}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!message.trim() || conversation.blocked || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || conversation.blocked || isSending}
          >
            <Send size={19} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.blockLink} onPress={handleBlock}>
          <Text style={styles.blockLinkText}>Block user</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  safeTop: { backgroundColor: Colors.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card },
  navCenter: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '900' as const, color: Colors.text },
  navSubtitle: { fontSize: 12, fontWeight: '700' as const, color: Colors.textMuted },
  loading: { alignItems: 'center', paddingTop: 70, gap: 10 },
  loadingText: { color: Colors.textSecondary, fontWeight: '700' as const },
  messagesContent: { padding: 18, gap: 10, paddingBottom: 22 },
  safetyCard: { flexDirection: 'row', gap: 9, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.card, borderRadius: 16, padding: 12, marginBottom: 8 },
  safetyText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '700' as const, color: Colors.textSecondary },
  blockedCard: { alignItems: 'center', gap: 7, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.card, borderRadius: 18, padding: 18 },
  blockedTitle: { fontSize: 16, fontWeight: '900' as const, color: Colors.text },
  blockedText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' as const },
  messageBubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  ownBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.borderLight },
  messageText: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const },
  ownText: { color: Colors.white },
  theirText: { color: Colors.text },
  messageTime: { marginTop: 5, fontSize: 10, fontWeight: '700' as const },
  ownTime: { color: '#FFFFFFAA' },
  theirTime: { color: Colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, backgroundColor: Colors.background },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.card, paddingHorizontal: 13, paddingVertical: 12, color: Colors.text, fontSize: 14, fontWeight: '700' as const },
  sendButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  sendButtonDisabled: { opacity: 0.45 },
  blockLink: { alignSelf: 'center', paddingVertical: 8, paddingBottom: 14 },
  blockLinkText: { fontSize: 12, fontWeight: '900' as const, color: Colors.danger },
});
