import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';

import {
  AI_WELCOME_CHIPS,
  formatAiLines,
  greetingName,
  groupToolsIntoActions,
  type AiAction,
  type AiMessage,
} from '@/core/ai';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';
import { MoreVerticalGlyph } from '@/shared/ui/icons/featherGlyphs';
import { PaperPlaneGlyph } from '@/shared/ui/icons/materialGlyphs';

import { TypingDots } from './TypingDots';

/** `AI_CHAT_THEME.greenDark` in client/src/pages/dashboard/ai/aiChatTheme.ts */
const AI_GREEN_DARK = '#0A5A14';

export function AiChatPanel({
  firstName,
  messages,
  draft,
  pending,
  onDraft,
  onSend,
  onChip,
  onAction,
  onOption,
  onClear,
  onBack,
}: {
  firstName?: string;
  messages: AiMessage[];
  draft: string;
  pending: boolean;
  onDraft: (value: string) => void;
  onSend: () => void;
  onChip: (prompt: string) => void;
  onAction: (action: AiAction) => void;
  onOption: (option: string) => void;
  onClear: () => void;
  /** Web puts a back chevron left of the logo in the chat header. */
  onBack?: () => void;
}) {
  const theme = useTheme();
  const name = greetingName(firstName);
  const canSend = !pending && draft.trim().length > 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Header: 36px logo, 17px "Diva" + Beta chip, subtitle beside it */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {onBack ? (
          <Pressable
            testID="ai-chat-back"
            accessibilityLabel="Back"
            onPress={onBack}
            hitSlop={8}
            style={{ padding: 6, marginLeft: -6 }}
          >
            <ChevronGlyph color="#334155" size={20} direction="left" />
          </Pressable>
        ) : null}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          <Image
            source={require('../../../../assets/images/natcycle-ai.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontSize: 17,
                fontFamily: theme.font.bold,
                color: theme.color.text,
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
                  fontSize: 9,
                  fontFamily: theme.font.medium,
                  color: theme.color.textMuted,
                  letterSpacing: 0.5,
                }}
              >
                BETA
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={{ fontSize: 13, color: theme.color.textMuted }}
          >
            {pending ? 'Typing…' : 'Your Diversion assistant'}
          </Text>
        </View>

        <Pressable
          testID="ai-clear"
          onPress={onClear}
          hitSlop={8}
          accessibilityLabel="Chat options"
          style={{ padding: 8 }}
        >
          <MoreVerticalGlyph color={theme.color.placeholder} size={18} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        contentContainerStyle={{ paddingBottom: 16, gap: 12 }}
      >
        {messages.length === 0 ? (
          // Web centres the whole welcome block and leads with a 64px logo;
          // the previous version was left-aligned with no logo.
          <View
            style={{
              alignItems: 'center',
              paddingTop: 32,
              paddingBottom: 32,
              paddingHorizontal: 8,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <Image
                source={require('../../../../assets/images/natcycle-ai.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>

            <Text
              style={{
                fontSize: 18,
                fontFamily: theme.font.bold,
                color: theme.color.text,
              }}
            >
              {name === 'there' ? 'Hi' : `Hi, ${name}`}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.color.textMuted,
                textAlign: 'center',
                marginTop: 6,
                maxWidth: 280,
                lineHeight: 21,
              }}
            >
              Ask about drop-offs, reuse, composting, and how NatCycle works.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 8,
                marginTop: 20,
              }}
            >
              {AI_WELCOME_CHIPS.map((chip) => (
                <Pressable
                  key={chip.id}
                  testID={`ai-chip-${chip.id}`}
                  onPress={() => onChip(chip.prompt)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: theme.radius.pill,
                    backgroundColor: '#F3F3F3',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: theme.font.semibold,
                      color: theme.color.text,
                    }}
                  >
                    {chip.label}
                  </Text>
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
                <View style={{ maxWidth: '88%', gap: 8 }}>
                  <View>
                    {formatAiLines(message.text).map((line, index) => (
                      <Text
                        key={index}
                        style={{
                          fontSize: 15,
                          lineHeight: 24,
                          color: line.isTitle ? '#111111' : '#333333',
                          fontFamily: line.isTitle
                            ? theme.font.bold
                            : theme.font.regular,
                          // web: `mt-4 first:mt-0` on title lines
                          marginTop: line.isTitle && index > 0 ? 16 : 0,
                        }}
                      >
                        {line.isBlank ? ' ' : line.text}
                      </Text>
                    ))}
                  </View>
                  {/* Web groups raw tool calls into one Continue button per
                      action (`groupToolsIntoActions`) and lays them out in a
                      wrapping row. */}
                  {message.tools && message.tools.length > 0 ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      {groupToolsIntoActions(message.tools).map((action) => (
                        <Pressable
                          key={`${message.id}-${action.id}`}
                          testID={`ai-tool-${action.id}`}
                          onPress={() => onAction(action)}
                          style={{
                            backgroundColor: AI_GREEN_DARK,
                            borderRadius: theme.radius.pill,
                            // web: px-5 py-2.5
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              color: '#ffffff',
                              fontFamily: theme.font.semibold,
                            }}
                          >
                            {action.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {message.options && message.options.length > 0 ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      {message.options.map((option) => (
                        <Pressable
                          key={option}
                          onPress={() => onOption(option)}
                          style={{
                            // web: px-4 py-2.5
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: theme.radius.pill,
                            backgroundColor: '#F3F3F3',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: theme.font.semibold,
                              color: theme.color.text,
                            }}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ))
        )}

        {pending ? (
          <View style={{ alignItems: 'flex-start' }}>
            <TypingDots />
          </View>
        ) : null}
      </ScrollView>

      {/* Composer: `rounded-full bg-[#F3F3F3] px-3 py-2` with a 32px logo,
          a growing textarea (36→112px) and a paper-plane send button that
          turns brand green once there is something to send. */}
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
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <Image
            source={require('../../../../assets/images/natcycle-ai.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        <TextInput
          testID="ai-draft"
          value={draft}
          onChangeText={onDraft}
          placeholder="Ask Diva questions"
          placeholderTextColor={theme.color.placeholder}
          multiline
          style={{
            flex: 1,
            color: theme.color.text,
            fontSize: 15,
            // web: min-h-[36px] max-h-28 py-1.5
            minHeight: 36,
            maxHeight: 112,
            paddingVertical: 6,
          }}
          onSubmitEditing={onSend}
          returnKeyType="send"
          blurOnSubmit
        />

        <Pressable
          testID="ai-send"
          onPress={onSend}
          disabled={canSend === false}
          accessibilityLabel="Send message"
          hitSlop={6}
          style={{ padding: 8, opacity: canSend ? 1 : 0.3 }}
        >
          <PaperPlaneGlyph
            color={canSend ? AI_GREEN_DARK : '#CBD5E1'}
            size={15}
          />
        </Pressable>
      </View>
    </View>
  );
}
