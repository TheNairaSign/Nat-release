import { useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { ThingsMatchGlyph } from '@/shared/ui/icons/thingsMatchGlyph';

import { recipeFeedbackRef } from '../api/recipe-feedback-api';
import { DiversionGuidanceCard } from './DiversionGuidanceCard';
import { LocationPrompt } from './LocationPrompt';
import { RecipeCard } from './RecipeCard';
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
  onTokens,
  onLocated,
}: {
  firstName?: string;
  messages: AiMessage[];
  draft: string;
  pending: boolean;
  onDraft: (value: string) => void;
  onSend: () => void;
  onChip: (prompt: string) => void;
  onAction: (action: AiAction) => void;
  /** A picked option, with the message it came from (its context goes back with it). */
  onOption: (option: string, message: AiMessage) => void;
  onClear: () => void;
  /** Out of tokens: the link under DiVA's message opens the tokens page. */
  onTokens?: () => void;
  /** Location was turned on from a reply's prompt: ask that question again with it. */
  onLocated?: (
    message: AiMessage,
    position: { latitude: number; longitude: number },
  ) => void;
  /** Web puts a back chevron left of the logo in the chat header. */
  onBack?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const name = greetingName(firstName);
  const canSend = !pending && draft.trim().length > 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Header: 36px logo, 17px "Diva" + Beta chip, subtitle beside it.
          Web pads each section itself (`px-4 py-3`, and
          `pt-[max(0.75rem,env(safe-area-inset-top))]`) rather than putting one
          gutter around the whole panel — which is why the header and composer
          used to sit flush against the top and bottom edges. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: Math.max(12, insets.top),
          paddingBottom: 12,
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
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
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
                  {/* web: `mt-1.5 text-[11px] leading-none text-slate-400 tabular-nums` */}
                  {message.tokenCost ? (
                    <Text
                      testID={`ai-cost-${message.id}`}
                      style={{
                        marginTop: -2,
                        fontSize: 11,
                        lineHeight: 13,
                        color: '#94a3b8',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      −{message.tokenCost} TK
                    </Text>
                  ) : null}
                  {message.guidance ? (
                    <DiversionGuidanceCard guidance={message.guidance} />
                  ) : null}
                  {message.recipe ? (
                    <RecipeCard
                      recipe={message.recipe}
                      feedbackRef={recipeFeedbackRef(message.timestamp, message.recipe.title)}
                    />
                  ) : null}
                  {message.locationAsk && onLocated ? (
                    <LocationPrompt
                      initial={message.locationAsk.access}
                      onLocated={(position) => onLocated(message, position)}
                    />
                  ) : null}
                  {/* web: one per row for a single image, two across otherwise; 4:3,
                      rounded 18, caption under it; a broken image hides itself. */}
                  {message.images && message.images.length > 0 ? (
                    <View
                      style={{
                        marginTop: 16,
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      {message.images.map((image, index) => (
                        <AiReplyImage
                          key={`${image.url}-${index}`}
                          url={image.url}
                          caption={image.caption}
                          alt={image.alt}
                          half={message.images!.length > 1}
                        />
                      ))}
                    </View>
                  ) : null}
                  {/* Web shows a toast, "See your tokens and tiers", that opens
                      /tokens; mobile has no toasts, so the link sits here. */}
                  {message.outOfTokens && onTokens ? (
                    <Pressable testID="ai-see-tokens" onPress={onTokens}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: theme.font.semibold,
                          color: AI_GREEN_DARK,
                          textDecorationLine: 'underline',
                        }}
                      >
                        See your tokens and tiers
                      </Text>
                    </Pressable>
                  ) : null}
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
                            // web: px-5 py-2.5, inline-flex items-center gap-2
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {/* Web marks a ThingsMatch hand-off with the TM logo
                              in white before the label. */}
                          {action.isTm ? (
                            <ThingsMatchGlyph color="#ffffff" />
                          ) : null}
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
                          onPress={() => onOption(option, message)}
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
          paddingHorizontal: 16,
          paddingTop: 8,
          // Web floors this at 0.75rem so the composer never touches the screen
          // edge on a device that reports no bottom inset.
          paddingBottom: Math.max(12, insets.bottom),
          backgroundColor: theme.color.surface,
        }}
      >
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
    </View>
  );
}

function AiReplyImage({
  url,
  caption,
  alt,
  half,
}: {
  url: string;
  caption?: string;
  alt?: string;
  half: boolean;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <View style={{ width: half ? '48%' : '100%' }}>
      <Image
        source={{ uri: url }}
        accessibilityLabel={alt || caption || ''}
        onError={() => setBroken(true)}
        style={{
          width: '100%',
          aspectRatio: 4 / 3,
          borderRadius: 18,
          backgroundColor: '#f1f5f9',
        }}
        resizeMode="cover"
      />
      {caption ? (
        <Text style={{ marginTop: 6, paddingHorizontal: 4, fontSize: 12, lineHeight: 16, color: '#64748b' }}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
