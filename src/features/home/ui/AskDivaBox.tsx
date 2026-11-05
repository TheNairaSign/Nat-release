import { useCallback, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useSpeechInput } from '@/shared/hooks/use-speech-input';
import type { SpeechError } from '@/shared/ports/speech';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { MicGlyph } from '@/shared/ui/icons/featherGlyphs';

/** The prototype's send arrow: a short, heavy arrow, #010B02. */
function SendArrow() {
  return (
    <Svg width={16} height={11} viewBox="0 0 16 11">
      <Path
        d="M1.5 5.5h12M9.5 1.5l4 4-4 4"
        stroke="#010B02"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Web SPEECH_HINT, in the app's words (it's the phone's settings, not a browser's). */
const SPEECH_HINT: Record<SpeechError, string> = {
  unsupported: "Voice input isn't available in this version of the app. Type your question instead.",
  denied: 'Allow the microphone and speech recognition for NatCycle in Settings, then try again.',
  'no-speech': "Didn't catch that. Tap the mic and try again.",
  failed: 'Voice input stopped. Tap the mic to try again.',
};

/**
 * "ask Diva" at the foot of Home (prototype Flow 3, Nov 2; web AskDivaBox.tsx): the DiVA
 * mark and "ask Diva" on their own line, then a white 68pt pill with the mic, the
 * question and the lime send button. The mic turns speech into text in the box for
 * them to check before sending.
 */
export function AskDivaBox({ onAsk }: { onAsk: (question: string) => void }) {
  const theme = useTheme();
  const [question, setQuestion] = useState('');
  const speech = useSpeechInput(useCallback((text: string) => setQuestion(text), []));

  return (
    <View testID="home-ask-diva-box" style={{ marginTop: 30 }}>
      <View style={{ height: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('../../../../assets/images/natcycle-ai.png')}
          style={{ width: 25, height: 25, borderRadius: 12.5 }}
        />
        <Text
          style={{
            marginLeft: 4.5,
            width: 103,
            fontSize: 16,
            lineHeight: 25,
            fontFamily: theme.font.bold,
            color: '#0A5A14',
          }}
        >
          ask Diva
        </Text>
      </View>

      <View
        style={{
          marginTop: 22,
          height: 68,
          borderRadius: 34,
          backgroundColor: '#ffffff',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          testID="home-ask-mic"
          accessibilityLabel={speech.listening ? 'Stop listening' : 'Speak your question'}
          accessibilityState={{ selected: speech.listening }}
          onPress={speech.toggle}
          style={{ marginLeft: 17, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
        >
          <MicGlyph
            color={speech.listening ? '#0A5A14' : 'rgba(87,195,112,0.435)'}
            size={28}
            strokeWidth={1.8}
          />
        </Pressable>
        <TextInput
          testID="home-ask-input"
          value={question}
          onChangeText={setQuestion}
          placeholder={speech.listening ? 'Listening…' : 'waste related questions'}
          placeholderTextColor="rgba(189,193,167,0.6)"
          accessibilityLabel="Ask DiVA a waste related question"
          returnKeyType="send"
          onSubmitEditing={() => onAsk(question.trim())}
          style={{
            marginLeft: 18,
            flex: 1,
            minWidth: 0,
            fontSize: 16,
            lineHeight: 24,
            color: '#1E0D2A',
            fontFamily: theme.font.regular,
          }}
        />
        <Pressable
          testID="home-ask-send"
          accessibilityLabel="Ask DiVA"
          onPress={() => onAsk(question.trim())}
          style={{
            marginHorizontal: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#D3FD5D',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SendArrow />
        </Pressable>
      </View>
      {speech.error ? (
        <Text style={{ marginTop: 6, paddingHorizontal: 20, fontSize: 11, color: '#AC0056' }}>
          {SPEECH_HINT[speech.error]}
        </Text>
      ) : null}
    </View>
  );
}
