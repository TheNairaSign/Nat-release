import { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import {
  AI_CAPABILITIES,
  aiLandingTitle,
  resolveActionTarget,
  type AiMessage,
  type ParsedAiReply,
} from '@/core/ai';
import { isAllowanceUsedUp } from '@/core/allowance';
import { isAuthenticated } from '@/core/session';
import {
  askAi,
  clearChatHistory,
  fetchAiPageSuggestions,
  fetchChatHistory,
  persistChatMessage,
  aiHistoryQueryKey,
  aiSuggestionsQueryKey,
} from '../api/ai-api';
import { AiChatPanel } from '../ui/AiChatPanel';
import { useSession } from '@/features/auth';
import { allowanceQueryKey } from '@/features/tokens';
import { useQuery, useQueryClient } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, Text } from '@/shared/ui';
import {
  CalendarGlyph,
  MapPinGlyph,
  TrendingUpGlyph,
} from '@/shared/ui/icons/featherGlyphs';

const CARD_COLORS = ['#D6EBFF', '#FFE4C4', '#E8F5E9', '#F3E5F5'];

/**
 * Web AiPage.tsx `SHOW_DIVA_LANDING = false` (Oct 14): every way in opens the chat
 * straight away. The landing below stays for when it's switched back on.
 */
const SHOW_DIVA_LANDING = false;

const CONNECTION_TROUBLE =
  "I'm having trouble connecting right now. Give it another try in a moment.";

/** A reply, or what DiVA says when there was none (`failed`), e.g. out of tokens. */
type Reply = ParsedAiReply & { outOfTokens?: boolean; failed?: boolean };

/** A reply as a chat message, with everything it carries (web AiChat.tsx sendMessage). */
function assistantFrom(id: string, reply: ParsedAiReply): AiMessage {
  return {
    id,
    role: 'assistant',
    text: reply.text,
    timestamp: new Date().toISOString(),
    tools: reply.tools,
    options: reply.options,
    ...(reply.context ? { context: reply.context } : {}),
    ...(reply.guidance ? { guidance: reply.guidance } : {}),
    ...(reply.recipe ? { recipe: reply.recipe } : {}),
    ...(reply.images ? { images: reply.images } : {}),
    ...(reply.tokenCost ? { tokenCost: reply.tokenCost } : {}),
  };
}

/** Web: w-[72%] of the viewport. */
const cardWidth = Math.round(Dimensions.get('window').width * 0.72);

const CAPABILITY_GLYPHS = {
  recycling: MapPinGlyph,
  events: CalendarGlyph,
  impact: TrendingUpGlyph,
} as const;

export function AiScreen({
  initialQuestion,
  suggestionId,
}: {
  initialQuestion?: string;
  suggestionId?: string;
}) {
  const theme = useTheme();
  const { http, navigation, uuid, linking, guestId } = usePorts();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const signedIn = isAuthenticated(session);
  const [chatOpen, setChatOpen] = useState(
    !SHOW_DIVA_LANDING || Boolean(initialQuestion),
  );
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<AiMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [activeSuggestionId, setActiveSuggestionId] = useState(suggestionId);

  const profileQuery = useQuery({
    queryKey: ['ai', 'profile'],
    queryFn: async () => {
      const response = await http.request({ path: '/profile', method: 'GET' });
      if (
        response.status >= 300 ||
        !response.body ||
        typeof response.body !== 'object'
      ) {
        return { firstName: undefined as string | undefined };
      }
      const raw = response.body as Record<string, unknown>;
      const data =
        raw.data && typeof raw.data === 'object'
          ? (raw.data as Record<string, unknown>)
          : raw;
      return {
        firstName:
          typeof data.firstName === 'string' ? data.firstName : undefined,
      };
    },
  });
  const suggestionsQuery = useQuery({
    queryKey: aiSuggestionsQueryKey,
    queryFn: () => fetchAiPageSuggestions(http),
  });
  const historyQuery = useQuery({
    queryKey: aiHistoryQueryKey,
    queryFn: () => fetchChatHistory(http),
    enabled: chatOpen && localMessages.length === 0 && !initialQuestion,
  });
  const seedQuery = useQuery({
    queryKey: ['ai', 'seed', initialQuestion, suggestionId],
    enabled: Boolean(initialQuestion),
    queryFn: async (): Promise<Reply> => {
      const question = initialQuestion ?? '';
      void persistChatMessage(http, {
        id: uuid.v4(),
        role: 'user',
        text: question,
      });
      try {
        return await askAi(http, {
          question,
          userId: session?.userId,
          firstName: undefined,
          suggestionId,
          history: [{ id: 'seed-user', role: 'user', text: question }],
          guestId: signedIn ? undefined : await guestId(),
        });
      } catch (error) {
        return failureReply(error);
      } finally {
        void queryClient.invalidateQueries({ queryKey: allowanceQueryKey });
      }
    },
  });

  const firstName = profileQuery.data?.firstName;
  const thread = useMemo(() => {
    if (localMessages.length > 0) return localMessages;
    if (initialQuestion) {
      const seeded: AiMessage[] = [
        { id: 'seed-user', role: 'user', text: initialQuestion },
      ];
      if (seedQuery.data) {
        seeded.push({
          ...assistantFrom('seed-assistant', seedQuery.data),
          ...(seedQuery.data.outOfTokens ? { outOfTokens: true } : {}),
        });
      }
      return seeded;
    }
    return historyQuery.data ?? [];
  }, [localMessages, initialQuestion, seedQuery.data, historyQuery.data]);

  const waiting =
    pending ||
    (Boolean(initialQuestion) &&
      seedQuery.isPending &&
      localMessages.length === 0);

  /** What DiVA says when it couldn't answer; out of tokens, in the server's words. */
  function failureReply(error: unknown): Reply {
    if (isAllowanceUsedUp(error)) {
      return {
        text: error.message,
        tools: [],
        options: [],
        outOfTokens: signedIn,
        failed: true,
      };
    }
    return { text: CONNECTION_TROUBLE, tools: [], options: [], failed: true };
  }

  async function send(
    question: string,
    fromSuggestionId?: string,
    context?: Record<string, unknown>,
  ) {
    const trimmed = question.trim();
    if (!trimmed || waiting) return;
    setChatOpen(true);
    setDraft('');
    const userMessage: AiMessage = {
      id: uuid.v4(),
      role: 'user',
      text: trimmed,
    };
    const nextHistory = [...thread, userMessage];
    setLocalMessages(nextHistory);
    setPending(true);
    void persistChatMessage(http, userMessage);
    let reply: Reply;
    try {
      reply = await askAi(http, {
        question: trimmed,
        userId: session?.userId,
        firstName,
        suggestionId: fromSuggestionId ?? activeSuggestionId,
        history: nextHistory,
        guestId: signedIn ? undefined : await guestId(),
        context,
      });
    } catch (error) {
      reply = failureReply(error);
    }
    // The question may have spent tokens: the profile and tokens page re-read them.
    void queryClient.invalidateQueries({ queryKey: allowanceQueryKey });
    setActiveSuggestionId(undefined);
    const assistantMessage: AiMessage = {
      ...assistantFrom(uuid.v4(), reply),
      ...(reply.outOfTokens ? { outOfTokens: true } : {}),
    };
    // Web saves the assistant message too, so its Continue buttons survive a
    // reload. An error isn't saved (web doesn't either).
    if (!reply.failed) {
      void persistChatMessage(http, assistantMessage);
    }
    setLocalMessages([...nextHistory, assistantMessage]);
    setPending(false);
  }

  async function onClear(clearMemory: boolean) {
    setClearOpen(false);
    await clearChatHistory(http, clearMemory);
    setLocalMessages([]);
    await historyQuery.refetch();
  }

  if (chatOpen) {
    // Web renders AiChat as `fixed inset-0 z-[60]` — a full-bleed surface over
    // the whole app, bottom nav included. A Modal is the native equivalent;
    // rendering it inline left the tab bar floating on top of the thread.
    return (
      <Modal
        visible
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setChatOpen(false)}
      >
        {/* Web's chat is `fixed inset-0` and full-bleed: each section inside
            pads itself and floors its own safe-area inset. A SafeAreaView plus
            one 16px gutter here collapsed that into a single flat frame with no
            vertical breathing room at all. */}
        <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
          {/* The browser scrolls web's composer clear of the keyboard; native
              will happily leave it underneath. Same behaviour as AuthPage. */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <AiChatPanel
              // With no landing to go back to, back goes wherever they came from.
              onBack={() =>
                SHOW_DIVA_LANDING && !initialQuestion
                  ? setChatOpen(false)
                  : navigation.back()
              }
              onTokens={() => navigation.navigate('/tokens')}
              firstName={firstName}
              messages={thread}
              draft={draft}
              pending={waiting}
              onDraft={setDraft}
              onSend={() => {
                void send(draft);
              }}
              onChip={(prompt) => {
                void send(prompt);
              }}
              onAction={(action) => {
                const target = resolveActionTarget(action);
                if (!target) return;
                if (target.kind === 'external') {
                  void linking.openUrl(target.url);
                } else {
                  navigation.navigate(target.href);
                }
              }}
              onOption={(option, message) => {
                void send(option, undefined, message.context);
              }}
              onClear={() => setClearOpen(true)}
            />
          </KeyboardAvoidingView>
          <ClearModal
            open={clearOpen}
            onClose={() => setClearOpen(false)}
            onClear={onClear}
          />
        </View>
      </Modal>
    );
  }

  return (
    <ChromeScreen fill>
      {/* Header — 68px logo, "Diva" 1.85rem bold, Beta chip */}
      <View style={{ alignItems: 'center', marginBottom: 20, paddingTop: 4 }}>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            overflow: 'hidden',
            marginBottom: 10,
          }}
        >
          <Image
            source={require('../../../../assets/images/natcycle-ai.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontSize: 30,
              fontFamily: theme.font.bold,
              color: theme.color.text,
              letterSpacing: -0.5,
            }}
          >
            Diva
          </Text>
          <View
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: theme.radius.sm,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.font.medium,
                color: theme.color.textMuted,
                letterSpacing: 0.5,
              }}
            >
              BETA
            </Text>
          </View>
        </View>
      </View>

      {/* Capability tiles — dashed, icon above label */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {AI_CAPABILITIES.map((item) => {
          const Glyph = CAPABILITY_GLYPHS[item.id];
          return (
            <Pressable
              key={item.id}
              testID={`ai-cap-${item.id}`}
              onPress={() => {
                void send(item.prompt);
              }}
              style={{
                flex: 1,
                minHeight: 92,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#CBD5E1',
                borderRadius: theme.radius.lg,
                backgroundColor: 'rgba(255,255,255,0.6)',
                paddingHorizontal: 8,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Glyph color="#64748B" size={22} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: theme.font.medium,
                  color: '#1E293B',
                  textAlign: 'center',
                }}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Suggestion carousel — no section heading on web; "Quick knowledge"
          is the footer inside each card. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
        style={{ marginBottom: 24 }}
      >
        {suggestionsQuery.isPending
          ? [0, 1].map((i) => (
              <View
                key={i}
                style={{
                  width: cardWidth,
                  height: 112,
                  borderRadius: theme.radius.lg,
                  backgroundColor: '#F1F5F9',
                }}
              />
            ))
          : (suggestionsQuery.data ?? []).map((item, index) => (
              <Pressable
                key={item.id}
                testID={`ai-suggestion-${item.id}`}
                onPress={() => {
                  setActiveSuggestionId(item.id);
                  void send(item.text, item.id);
                }}
                style={{
                  width: cardWidth,
                  minHeight: 116,
                  borderRadius: theme.radius.lg,
                  backgroundColor: CARD_COLORS[index % CARD_COLORS.length],
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  numberOfLines={3}
                  style={{
                    fontSize: 15,
                    fontFamily: theme.font.semibold,
                    color: '#1E293B',
                    lineHeight: 20,
                  }}
                >
                  {item.text}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.color.textMuted,
                    marginTop: 12,
                  }}
                >
                  Quick knowledge
                </Text>
              </Pressable>
            ))}
      </ScrollView>

      {/* Greeting + chat history sit directly above the composer on web,
          which pins the composer near the bottom of the viewport. */}
      <View
        style={{ alignItems: 'center', marginBottom: 12, marginTop: 'auto' }}
      >
        <Text
          style={{
            fontSize: 25,
            fontFamily: theme.font.bold,
            color: theme.color.text,
            textAlign: 'center',
            letterSpacing: -0.4,
            lineHeight: 30,
          }}
        >
          {aiLandingTitle(firstName)}
        </Text>
        <Pressable
          testID="ai-open-history"
          onPress={() => setChatOpen(true)}
          style={{ marginTop: 10 }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: theme.font.semibold,
              color: '#2E7D32',
            }}
          >
            Chat history ›
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F3F3F3',
          borderRadius: theme.radius.pill,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <TextInput
          testID="ai-landing-draft"
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask Diva questions"
          placeholderTextColor={theme.color.placeholder}
          style={{
            flex: 1,
            color: theme.color.text,
            fontSize: 15,
            paddingVertical: 8,
          }}
          onSubmitEditing={() => {
            void send(draft);
          }}
        />
        <Pressable
          testID="ai-landing-send"
          onPress={() => {
            void send(draft);
          }}
        >
          <Text style={{ fontFamily: theme.font.semibold }}>Send</Text>
        </Pressable>
      </View>
      <ClearModal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onClear={onClear}
      />
    </ChromeScreen>
  );
}

function ClearModal({
  open,
  onClose,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  onClear: (clearMemory: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: theme.color.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontFamily: theme.font.bold }}>
            Clear chat
          </Text>
          <Text muted style={{ marginTop: 4 }}>
            What would you like to reset?
          </Text>
          <Pressable
            testID="ai-clear-session"
            onPress={() => onClear(false)}
            style={{ marginTop: 16 }}
          >
            <Text style={{ fontFamily: theme.font.semibold }}>
              This conversation only
            </Text>
            <Text variant="small" muted>
              Clear messages here. Your name and past topics are kept.
            </Text>
          </Pressable>
          <Pressable
            testID="ai-clear-memory"
            onPress={() => onClear(true)}
            style={{ marginTop: 16 }}
          >
            <Text style={{ fontFamily: theme.font.semibold }}>
              Conversation + AI memory
            </Text>
            <Text variant="small" muted>
              Remove this chat and everything NatCycle AI remembers.
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            style={{ marginTop: 20, alignItems: 'center' }}
          >
            <Text>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
