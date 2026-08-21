import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { AI_WELCOME_CHIPS, greetingName, type AiMessage } from '@/core/ai';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

export function AiChatPanel({
  firstName,
  messages,
  draft,
  pending,
  onDraft,
  onSend,
  onChip,
  onTool,
  onOption,
  onClear,
}: {
  firstName?: string;
  messages: AiMessage[];
  draft: string;
  pending: boolean;
  onDraft: (value: string) => void;
  onSend: () => void;
  onChip: (prompt: string) => void;
  onTool: (href: string) => void;
  onOption: (option: string) => void;
  onClear: () => void;
}) {
  const theme = useTheme();
  const name = greetingName(firstName);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ fontSize: 20, fontFamily: theme.font.bold }}>
            Diva{' '}
            <Text style={{ fontSize: 12, color: theme.color.textMuted }}>
              Beta
            </Text>
          </Text>
          <Text variant="small" muted>
            {pending ? 'Typing…' : 'Your Diversion assistant'}
          </Text>
        </View>
        <Pressable testID="ai-clear" onPress={onClear}>
          <Text variant="small" style={{ fontFamily: theme.font.semibold }}>
            Clear chat
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        contentContainerStyle={{ paddingBottom: 16, gap: 12 }}
      >
        {messages.length === 0 ? (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 22, fontFamily: theme.font.bold }}>
              {name === 'there' ? 'Hi' : `Hi, ${name}`}
            </Text>
            <Text muted>
              Ask about drop-offs, reuse, composting, and how NatCycle works.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {AI_WELCOME_CHIPS.map((chip) => (
                <Pressable
                  key={chip.id}
                  testID={`ai-chip-${chip.id}`}
                  onPress={() => onChip(chip.prompt)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: theme.radius.pill,
                    backgroundColor: '#F3F3F3',
                  }}
                >
                  <Text variant="small">{chip.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={{
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {message.role === 'user' ? (
                <View
                  style={{
                    maxWidth: '88%',
                    backgroundColor: '#F3F3F3',
                    borderRadius: 22,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ fontSize: 15 }}>{message.text}</Text>
                </View>
              ) : (
                <View style={{ maxWidth: '92%', gap: 8 }}>
                  <Text style={{ fontSize: 15, color: '#333333' }}>
                    {message.text}
                  </Text>
                  {(message.tools ?? []).map((tool) => (
                    <Pressable
                      key={`${message.id}-${tool.href}`}
                      testID={`ai-tool-${tool.href}`}
                      onPress={() => onTool(tool.href)}
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#0A5A14',
                        borderRadius: theme.radius.pill,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                      }}
                    >
                      <Text
                        variant="small"
                        style={{
                          color: '#fff',
                          fontFamily: theme.font.semibold,
                        }}
                      >
                        {tool.label}
                      </Text>
                    </Pressable>
                  ))}
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                  >
                    {(message.options ?? []).map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => onOption(option)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: theme.radius.pill,
                          backgroundColor: '#F3F3F3',
                        }}
                      >
                        <Text variant="small">{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F3F3F3',
          borderRadius: theme.radius.pill,
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
        }}
      >
        <TextInput
          testID="ai-draft"
          value={draft}
          onChangeText={onDraft}
          placeholder="Ask Diva questions"
          placeholderTextColor={theme.color.placeholder}
          style={{
            flex: 1,
            color: theme.color.text,
            fontSize: 15,
            paddingVertical: 8,
          }}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <Pressable
          testID="ai-send"
          onPress={onSend}
          disabled={pending || !draft.trim()}
          style={{
            backgroundColor: theme.color.ink,
            borderRadius: theme.radius.pill,
            paddingHorizontal: 14,
            paddingVertical: 8,
            opacity: pending || !draft.trim() ? 0.5 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontFamily: theme.font.semibold }}>
            Send
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
