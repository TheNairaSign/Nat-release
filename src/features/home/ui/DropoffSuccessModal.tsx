import { Modal, Pressable, View } from 'react-native';

import { successShareText, type DropoffSuccessPayload } from '@/core/dropoff';
import { rewardShareUrl, type RewardSharePlatform } from '@/core/rewards';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

const SHARE_URL = 'https://natcycle.app';

export function DropoffSuccessModal({
  payload,
  onClose,
}: {
  payload: DropoffSuccessPayload | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { share, linking, clipboard } = usePorts();
  if (!payload) return null;
  const cu = payload.carbonUnits.toFixed(2);
  const text = successShareText(payload.carbonUnits);

  async function openShare(platform: RewardSharePlatform | 'copy') {
    if (platform === 'copy') {
      await clipboard.copy(`${text} ${SHARE_URL}`);
      return;
    }
    // Reuse reward URL builders with drop-off share text via twitter/whatsapp patterns
    if (platform === 'twitter') {
      await linking.openUrl(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SHARE_URL)}`,
      );
      return;
    }
    if (platform === 'whatsapp') {
      await linking.openUrl(
        `https://wa.me/?text=${encodeURIComponent(`${text} ${SHARE_URL}`)}`,
      );
      return;
    }
    if (platform === 'facebook') {
      await linking.openUrl(
        `https://www.facebook.com/dialog/share?app_id=966242223397117&href=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent(text)}&hashtag=%23NatCycle&display=popup`,
      );
      return;
    }
    await linking.openUrl(rewardShareUrl('linkedin', text));
  }

  return (
    <Modal visible transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            maxWidth: 390,
            alignSelf: 'center',
            width: '100%',
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: theme.font.bold,
              textAlign: 'center',
              color: '#111827',
            }}
          >
            🎉 Drop-off Successful!
          </Text>
          <Text
            muted
            style={{ marginTop: 8, textAlign: 'center', fontSize: 14 }}
          >
            Amazing! You earned {cu} Carbon Units and made a positive impact!
          </Text>
          <View
            style={{
              marginTop: 24,
              marginBottom: 24,
              backgroundColor: '#f9fafb',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Text variant="small" style={{ color: '#1f2937', lineHeight: 20 }}>
              {text}
            </Text>
            <Text
              variant="caption"
              style={{ color: '#2563eb', marginTop: 8 }}
              numberOfLines={1}
            >
              {SHARE_URL}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 16,
            }}
          >
            {(
              [
                ['twitter', 'X'],
                ['whatsapp', 'Wa'],
                ['linkedin', 'in'],
                ['facebook', 'f'],
                ['copy', '⧉'],
              ] as const
            ).map(([platform, label]) => (
              <Pressable
                key={platform}
                testID={`dropoff-share-${platform}`}
                onPress={() => void openShare(platform)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#111111',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontFamily: theme.font.bold,
                    fontSize: 12,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            testID="share-dropoff-success"
            onPress={() => {
              void share.share(`${text} ${SHARE_URL}`);
            }}
            style={{ alignItems: 'center', marginBottom: 8 }}
          >
            <Text style={{ fontFamily: theme.font.semibold }}>
              More share options
            </Text>
          </Pressable>
          <Pressable
            testID="dropoff-success-later"
            onPress={onClose}
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <Text muted style={{ fontFamily: theme.font.medium }}>
              Maybe Later
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
