import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { AI_CAPABILITIES, aiLandingTitle, type AiMessage } from '@/core/ai';
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
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';

const CARD_COLORS = ['#D6EBFF', '#FFE4C4', '#E8F5E9', '#F3E5F5'];

export function AiScreen({
  initialQuestion,
  suggestionId,
}: {
  initialQuestion?: string;
  suggestionId?: string;
}) {
  const theme = useTheme();
  const { http, navigation, uuid } = usePorts();
  const { session } = useSession();
  const [chatOpen, setChatOpen] = useState(Boolean(initialQuestion));
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
    queryFn: async () => {
      const question = initialQuestion ?? '';
      void persistChatMessage(http, question);
      return askAi(http, {
        question,
        userId: session?.userId,
        firstName: undefined,
        suggestionId,
        history: [{ id: 'seed-user', role: 'user', text: question }],
      });
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
          id: 'seed-assistant',
          role: 'assistant',
          text: seedQuery.data.text,
          tools: seedQuery.data.tools,
          options: seedQuery.data.options,
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

  async function send(question: string, fromSuggestionId?: string) {
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
    void persistChatMessage(http, trimmed);
    const reply = await askAi(http, {
      question: trimmed,
      userId: session?.userId,
      firstName,
      suggestionId: fromSuggestionId ?? activeSuggestionId,
      history: nextHistory,
    });
    setActiveSuggestionId(undefined);
    setLocalMessages([
      ...nextHistory,
      {
        id: uuid.v4(),
        role: 'assistant',
        text: reply.text,
        tools: reply.tools,
        options: reply.options,
      },
    ]);
    setPending(false);
  }

  async function onClear(clearMemory: boolean) {
    setClearOpen(false);
    await clearChatHistory(http, clearMemory);
    setLocalMessages([]);
    await historyQuery.refetch();
  }

  if (chatOpen) {
    return (
      <ChromeScreen>
        <ScreenBack onPress={() => setChatOpen(false)} />
        <View style={{ minHeight: 560 }}>
          <AiChatPanel
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
            onTool={(href) => navigation.navigate(href)}
            onOption={(option) => {
              void send(option);
            }}
            onClear={() => setClearOpen(true)}
          />
        </View>
        <ClearModal
          open={clearOpen}
          onClose={() => setClearOpen(false)}
          onClear={onClear}
        />
      </ChromeScreen>
    );
  }

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: theme.color.lime,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: theme.font.bold }}>Diva</Text>
        </View>
        <Text style={{ marginTop: 8, fontFamily: theme.font.semibold }}>
          Diva <Text style={{ color: theme.color.textMuted }}>Beta</Text>
        </Text>
      </View>
      <Text
        style={{
          fontSize: 20,
          fontFamily: theme.font.semibold,
          textAlign: 'center',
        }}
      >
        {aiLandingTitle(firstName)}
      </Text>
      <Pressable
        testID="ai-open-history"
        onPress={() => setChatOpen(true)}
        style={{ marginTop: 8 }}
      >
        <Text style={{ textAlign: 'center', textDecorationLine: 'underline' }}>
          Chat history ›
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
        {AI_CAPABILITIES.map((item) => (
          <Pressable
            key={item.id}
            testID={`ai-cap-${item.id}`}
            onPress={() => {
              void send(item.prompt);
            }}
            style={{
              flex: 1,
              minHeight: 88,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme.color.borderSolid,
              borderRadius: theme.radius.lg,
              backgroundColor: 'rgba(255,255,255,0.6)',
              padding: 10,
              justifyContent: 'center',
            }}
          >
            <Text
              variant="small"
              style={{ fontFamily: theme.font.semibold, textAlign: 'center' }}
            >
              {item.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ marginTop: 20, fontFamily: theme.font.medium }}>
        Quick knowledge
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
      >
        {(suggestionsQuery.data ?? []).map((item, index) => (
          <Pressable
            key={item.id}
            testID={`ai-suggestion-${item.id}`}
            onPress={() => {
              setActiveSuggestionId(item.id);
              void send(item.text, item.id);
            }}
            style={{
              width: 230,
              borderRadius: theme.radius.lg,
              backgroundColor: CARD_COLORS[index % CARD_COLORS.length],
              padding: 16,
            }}
          >
            <Text numberOfLines={4}>{item.text}</Text>
            <Text variant="small" muted style={{ marginTop: 12 }}>
              Quick knowledge
            </Text>
          </Pressable>
        ))}
      </ScrollView>

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
