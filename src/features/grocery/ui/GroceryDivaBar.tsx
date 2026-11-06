import { useCallback, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { withItemNames, type GroceryItem } from '@/core/grocery';
import { useSpeechInput } from '@/shared/hooks/use-speech-input';
import { useTheme } from '@/shared/theme';

import { VoiceBars } from './VoiceBars';

/**
 * The lime DiVA bar along the foot of History (prototype "Current list": 329×68,
 * #EBFEB5, 31pt off the bottom; web GroceryDivaBar.tsx): ask about the list by typing or
 * voice, and DiVA answers in the chat. "What is no 10?" goes with the item's name.
 */
export function GroceryDivaBar({
  items,
  onAsk,
}: {
  items: GroceryItem[];
  onAsk: (question: string) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const speech = useSpeechInput(useCallback((text: string) => setDraft(text), []));

  const send = () => {
    const text = draft.trim();
    if (text) onAsk(withItemNames(text, items));
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 32,
        right: 32,
        bottom: 31 + insets.bottom,
        zIndex: 20,
      }}
    >
      <View
        style={{
          height: 68,
          borderRadius: 34,
          backgroundColor: '#EBFEB5',
          paddingLeft: 11,
          paddingRight: 22,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../../../../assets/images/natcycle-ai.png')}
          style={{ width: 33, height: 33, borderRadius: 16.5, margin: 6.5 }}
        />
        <TextInput
          testID="grocery-diva-input"
          value={draft}
          onChangeText={setDraft}
          placeholder={speech.listening ? 'Listening…' : 'What is no 10?'}
          placeholderTextColor="#707070"
          accessibilityLabel="Ask DiVA about your list"
          returnKeyType="send"
          onSubmitEditing={send}
          style={{
            marginLeft: 18,
            flex: 1,
            minWidth: 0,
            paddingVertical: 6,
            fontSize: 16,
            color: '#1A3A12',
            fontFamily: theme.font.regular,
          }}
        />
        <Pressable
          testID="grocery-diva-voice"
          accessibilityLabel={speech.listening ? 'Stop listening' : 'Ask by voice'}
          accessibilityState={{ selected: speech.listening }}
          onPress={speech.toggle}
          style={{
            borderRadius: 999,
            padding: 8,
            ...(speech.listening
              ? { backgroundColor: '#D1FF52', borderWidth: 2, borderColor: '#B7E534' }
              : {}),
          }}
        >
          <VoiceBars active={speech.listening} fast={speech.listening} size="lg" />
        </Pressable>
      </View>
    </View>
  );
}
