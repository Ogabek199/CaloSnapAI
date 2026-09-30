import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MessageCircle, Send, Trash2, RefreshCw } from 'lucide-react-native';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { useChatStore, type ChatMessage } from '../../src/store/useChatStore';
import { useToastStore } from '../../src/store/useToastStore';
import { ApiClient, type ChatTurn } from '../../src/shared/api/api-client';
import { getTodayContext } from '../../src/features/assistant/day-context';
import { isPremiumRequiredError } from '../../src/features/assistant/pro-gate';
import { CustomModal } from '../../src/shared/ui/CustomModal';
import { FontSize, Radius, Spacing, androidTextFix } from '../../src/shared/theme/spacing';

const MAX_INPUT_CHARS = 1000;
const HISTORY_TURNS = 20;

export default function AssistantChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = usePalette();
  const strings = useStrings();
  const language = useAppStore((s) => s.language);
  const userId = useAppStore((s) => s.user.id);
  const isPremium = useAppStore((s) => !!s.user.isPremium);
  const showToast = useToastStore((s) => s.showToast);

  const messages = useChatStore((s) => s.messages);
  const ensureOwner = useChatStore((s) => s.ensureOwner);
  const addMessage = useChatStore((s) => s.addMessage);
  const markFailed = useChatStore((s) => s.markFailed);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const clearChat = useChatStore((s) => s.clear);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    ensureOwner(userId);
  }, [userId, ensureOwner]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const reversed = useMemo(() => [...messages].reverse(), [messages]);
  const suggestions = [strings.chatSuggestion1, strings.chatSuggestion2, strings.chatSuggestion3, strings.chatSuggestion4];

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, MAX_INPUT_CHARS);
    if (!text || sendingRef.current) return;
    if (!isPremium) {
      router.push('/paywall');
      return;
    }
    sendingRef.current = true;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Failed turns never reached the model, so they are left out of the history it sees.
    const history: ChatTurn[] = useChatStore
      .getState()
      .messages.filter((m) => !m.failed)
      .slice(-(HISTORY_TURNS - 1))
      .map((m) => ({ role: m.role, text: m.text }));
    const userMessage = addMessage({ role: 'user', text });
    setInput('');

    try {
      const { reply } = await ApiClient.assistantChat(
        [...history, { role: 'user', text }],
        language,
        getTodayContext(),
      );
      addMessage({ role: 'model', text: reply });
    } catch (e: any) {
      markFailed(userMessage.id, true);
      if (isPremiumRequiredError(e)) {
        router.push('/paywall');
      } else if (mountedRef.current) {
        showToast(e?.message || strings.errGeneric, 'error');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      sendingRef.current = false;
      if (mountedRef.current) setSending(false);
    }
  };

  const retry = (message: ChatMessage) => {
    if (sendingRef.current) return;
    removeMessage(message.id);
    void send(message.text);
  };

  const confirmClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearChat();
    setClearOpen(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.role === 'user';
    const bubble = (
      <View
        style={[
          styles.bubble,
          mine
            ? [styles.bubbleMine, { backgroundColor: item.failed ? c.dangerBg : c.primary }]
            : [styles.bubbleTheirs, { backgroundColor: c.card, borderColor: c.border }],
        ]}
      >
        <Text
          selectable
          style={[styles.bubbleText, { color: mine ? (item.failed ? c.danger : c.onPrimary) : c.text }]}
        >
          {item.text}
        </Text>
      </View>
    );
    return (
      <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowTheirs]}>
        {item.failed ? (
          <Pressable onPress={() => retry(item)} accessibilityRole="button" accessibilityLabel={strings.retryBtn}>
            {bubble}
            <View style={styles.failedRow}>
              <RefreshCw size={12} color={c.danger} />
              <Text style={[styles.failedText, { color: c.danger }]}>{strings.chatFailed}</Text>
            </View>
          </Pressable>
        ) : (
          bubble
        )}
      </View>
    );
  };

  const canSend = input.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
          accessibilityRole="button"
        >
          <ChevronLeft color={c.text} size={20} />
        </Pressable>
        <View style={[styles.headerAvatar, { backgroundColor: c.purpleBg }]}>
          <MessageCircle size={18} color={c.purple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
            {strings.aiChatTitle}
          </Text>
          <Text style={[styles.headerSub, { color: sending ? c.primary : c.textMuted }]} numberOfLines={1}>
            {sending ? strings.chatThinking : strings.chatDisclaimer}
          </Text>
        </View>
        {messages.length > 0 ? (
          <Pressable
            onPress={() => setClearOpen(true)}
            hitSlop={8}
            disabled={sending}
            style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border, opacity: sending ? 0.5 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={strings.chatClear}
          >
            <Trash2 color={c.textSecondary} size={18} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {messages.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.welcome}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={[styles.welcomeIcon, { backgroundColor: c.purpleBg }]}>
              <MessageCircle size={30} color={c.purple} />
            </View>
            <Text style={[styles.welcomeTitle, { color: c.text }]}>{strings.chatWelcomeTitle}</Text>
            <Text style={[styles.welcomeText, { color: c.textSecondary }]}>{strings.chatWelcomeText}</Text>
            <View style={styles.suggestions}>
              {suggestions.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  disabled={sending}
                  style={({ pressed }) => [
                    styles.suggestion,
                    { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: c.text }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.disclaimer, { color: c.textMuted }]}>{strings.healthDisclaimer}</Text>
          </ScrollView>
        ) : (
          <FlatList
            data={reversed}
            inverted
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListHeaderComponent={
              sending ? (
                <View style={[styles.msgRow, styles.msgRowTheirs]}>
                  <View style={[styles.bubble, styles.bubbleTheirs, styles.typing, { backgroundColor: c.card, borderColor: c.border }]}>
                    <ActivityIndicator size="small" color={c.primary} />
                    <Text style={[styles.typingText, { color: c.textMuted }]}>{strings.chatThinking}</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <View
          style={[
            styles.inputBar,
            { borderTopColor: c.border, backgroundColor: c.background, paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}
        >
          <View style={[styles.inputWrap, { backgroundColor: c.card, borderColor: c.border }]}>
            <TextInput
              style={[styles.input, { color: c.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={strings.chatPlaceholder}
              placeholderTextColor={c.textMuted}
              multiline
              maxLength={MAX_INPUT_CHARS}
              editable={!sending}
            />
          </View>
          <Pressable
            onPress={() => send(input)}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: canSend ? c.primary : c.cardHover, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
          >
            <Send size={18} color={canSend ? c.onPrimary : c.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <CustomModal visible={clearOpen} onClose={() => setClearOpen(false)} hideHeader>
        <View style={styles.confirmBody}>
          <View style={[styles.confirmIcon, { backgroundColor: c.dangerBg }]}>
            <Trash2 color={c.danger} size={24} />
          </View>
          <Text style={[styles.confirmTitle, { color: c.text }]}>{strings.chatClearConfirmTitle}</Text>
          <Text style={[styles.confirmMsg, { color: c.textSecondary }]}>{strings.chatClearConfirmMsg}</Text>
          <View style={styles.confirmActions}>
            <Pressable
              onPress={() => setClearOpen(false)}
              style={[styles.confirmBtn, { backgroundColor: c.cardHover }]}
            >
              <Text style={[styles.confirmBtnText, { color: c.text }]}>{strings.cancelBtn}</Text>
            </Pressable>
            <Pressable onPress={confirmClear} style={[styles.confirmBtn, { backgroundColor: c.danger }]}>
              <Text style={[styles.confirmBtnText, { color: '#FFFFFF' }]}>{strings.chatClearBtn}</Text>
            </Pressable>
          </View>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.md + 1, fontWeight: '700', ...androidTextFix },
  headerSub: { fontSize: 11, marginTop: 1, ...androidTextFix },

  list: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  msgRow: { flexDirection: 'row' },
  msgRowMine: { justifyContent: 'flex-end' },
  msgRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { borderBottomRightRadius: 6 },
  bubbleTheirs: { borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  bubbleText: { fontSize: FontSize.md, lineHeight: 21, ...androidTextFix },
  failedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 4 },
  failedText: { fontSize: 11, fontWeight: '600', ...androidTextFix },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: FontSize.sm, ...androidTextFix },

  welcome: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  welcomeIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontSize: FontSize.lg + 2, fontWeight: '800', textAlign: 'center', ...androidTextFix },
  welcomeText: { fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center', ...androidTextFix },
  suggestions: { alignSelf: 'stretch', gap: Spacing.sm, marginTop: Spacing.sm },
  suggestion: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: { fontSize: FontSize.sm, fontWeight: '600', ...androidTextFix },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: Spacing.sm, ...androidTextFix },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: { fontSize: FontSize.md, maxHeight: 120, padding: 0, ...androidTextFix },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  confirmBody: { alignItems: 'center', paddingTop: Spacing.sm },
  confirmIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  confirmTitle: { fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center', ...androidTextFix },
  confirmMsg: { fontSize: FontSize.sm, lineHeight: 19, textAlign: 'center', marginTop: 6, ...androidTextFix },
  confirmActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl, alignSelf: 'stretch' },
  confirmBtn: { flex: 1, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: FontSize.md, fontWeight: '700', ...androidTextFix },
});
