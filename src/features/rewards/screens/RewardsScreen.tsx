import { useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';

import {
  filterRewards,
  pointsNeeded,
  rewardShareText,
  rewardShareUrl,
  type RewardFilter,
  type RewardItem,
  type RewardSharePlatform,
} from '@/core/rewards';
import { fetchProfileUser, profileUserQueryKey } from '@/features/profile';
import {
  fetchRewards,
  redeemReward,
  rewardsQueryKey,
} from '../api/rewards-api';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';
import { GiftGlyph } from '@/shared/ui/icons/glyphs';

export function RewardsScreen() {
  const theme = useTheme();
  const { http, navigation, clipboard, linking, share } = usePorts();
  const [filter, setFilter] = useState<RewardFilter>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [redeemPending, setRedeemPending] = useState(false);
  const [success, setSuccess] = useState<{
    reward: RewardItem;
    code: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const profileQuery = useQuery({
    queryKey: profileUserQueryKey,
    queryFn: () => fetchProfileUser(http),
  });
  const rewardsQuery = useQuery({
    queryKey: rewardsQueryKey,
    queryFn: () => fetchRewards(http),
  });
  const points = Math.floor(profileQuery.data?.pointsEarned ?? 0);
  const grouped = filterRewards(rewardsQuery.data ?? [], filter, points);
  const confirmReward =
    (rewardsQuery.data ?? []).find((item) => item.id === confirmId) ?? null;

  async function confirm() {
    if (!confirmId || !confirmReward || redeemPending) return;
    setRedeemPending(true);
    const result = await redeemReward(http, confirmId);
    setRedeemPending(false);
    setConfirmId(null);
    if (!result.ok) {
      if (result.message?.toLowerCase().includes('email'))
        navigation.navigate('/verify-email');
      return;
    }
    setCopied(false);
    setSuccess({ reward: confirmReward, code: result.code ?? '' });
    await rewardsQuery.refetch();
    await profileQuery.refetch();
  }

  async function openShare(platform: RewardSharePlatform) {
    if (!success) return;
    await linking.openUrl(rewardShareUrl(platform, success.reward.name));
  }

  if (rewardsQuery.isPending) {
    return (
      <ChromeScreen>
        <Text>Loading rewards...</Text>
      </ChromeScreen>
    );
  }

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      <Text
        style={{
          fontSize: 22,
          fontFamily: theme.font.bold,
          color: theme.color.label,
        }}
      >
        Rewards
      </Text>
      <Text style={{ marginTop: 8 }}>Your NatPoints: {points}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {(['all', 'available', 'redeemed'] as const).map((id) => (
          <Pressable
            key={id}
            onPress={() => setFilter(id)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: theme.radius.sm,
              backgroundColor: filter === id ? theme.color.ink : '#e5e7eb',
            }}
          >
            <Text
              style={{
                color: filter === id ? '#fff' : theme.color.text,
                textTransform: 'capitalize',
              }}
            >
              {id === 'all'
                ? 'All Rewards'
                : id === 'available'
                  ? 'Available'
                  : 'Redeemed'}
            </Text>
          </Pressable>
        ))}
      </View>
      {grouped.affordable.length === 0 &&
      grouped.keepCollecting.length === 0 ? (
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <Text style={{ fontFamily: theme.font.bold }}>
            {grouped.emptyTitle}
          </Text>
          <Text muted>{grouped.emptyBody}</Text>
        </View>
      ) : (
        <>
          {grouped.affordable.map((item) => (
            <RewardRow
              key={item.id}
              item={item}
              points={points}
              onClaim={() => setConfirmId(item.id)}
            />
          ))}
          {grouped.keepCollecting.length > 0 ? (
            <Text style={{ marginTop: 16, fontFamily: theme.font.semibold }}>
              Keep Collecting ({grouped.keepCollecting.length})
            </Text>
          ) : null}
          {grouped.keepCollecting.map((item) => (
            <RewardRow
              key={item.id}
              item={item}
              points={points}
              onClaim={() => undefined}
            />
          ))}
        </>
      )}
      <Modal visible={Boolean(confirmId)} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 20,
              position: 'relative',
            }}
          >
            <Pressable
              testID="redeem-confirm-close"
              disabled={redeemPending}
              onPress={() => setConfirmId(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 1,
                padding: 4,
              }}
            >
              <Text muted style={{ fontSize: 18 }}>
                ✕
              </Text>
            </Pressable>
            <View
              style={{ alignItems: 'center', marginBottom: 16, paddingTop: 4 }}
            >
              <Text style={{ fontFamily: theme.font.bold, fontSize: 20 }}>
                Redeem Reward?
              </Text>
              <Text muted style={{ marginTop: 4, fontSize: 14 }}>
                {confirmReward
                  ? `${confirmReward.pointsRequired} NatPoints will be deducted`
                  : 'NatPoints will be deducted'}
              </Text>
            </View>
            {confirmReward ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20,
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                }}
              >
                {confirmReward.imageUrl ? (
                  <Image
                    source={{ uri: confirmReward.imageUrl }}
                    style={{ width: 48, height: 48, borderRadius: 8 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: '#dcfce7',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GiftGlyph color="#16a34a" size={22} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{ fontFamily: theme.font.semibold, fontSize: 14 }}
                    numberOfLines={1}
                  >
                    {confirmReward.name}
                  </Text>
                  <Text muted style={{ fontSize: 12, marginTop: 2 }}>
                    {confirmReward.pointsRequired} pts
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                disabled={redeemPending}
                onPress={() => setConfirmId(null)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderRadius: theme.radius.pill,
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  opacity: redeemPending ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.font.semibold,
                    fontSize: 14,
                    color: '#374151',
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                testID="redeem-confirm"
                disabled={redeemPending}
                onPress={() => void confirm()}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderRadius: theme.radius.pill,
                  backgroundColor: '#000',
                  opacity: redeemPending ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.font.semibold,
                    fontSize: 14,
                    color: '#fff',
                  }}
                >
                  {redeemPending ? 'Processing…' : 'Confirm'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(success)} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 24,
              overflow: 'hidden',
            }}
          >
            <Pressable
              testID="reward-success-close"
              onPress={() => setSuccess(null)}
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
            >
              <Text muted>✕</Text>
            </Pressable>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: '#22c55e',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 28,
                    fontFamily: theme.font.bold,
                  }}
                >
                  ✓
                </Text>
              </View>
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 22,
                  fontFamily: theme.font.bold,
                }}
              >
                Reward Redeemed!
              </Text>
            </View>
            {success?.code ? (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Pressable
                  testID="reward-copy-code"
                  onPress={() => {
                    void clipboard.copy(success.code);
                    setCopied(true);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#000',
                    borderRadius: theme.radius.pill,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontFamily: theme.font.bold,
                      letterSpacing: 1,
                    }}
                  >
                    {success.code}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 12 }}>⧉</Text>
                </Pressable>
                <Text variant="small" muted>
                  {copied ? '✓ Copied' : 'Tap to copy code'}
                </Text>
              </View>
            ) : null}
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text
                style={{ fontFamily: theme.font.semibold, textAlign: 'center' }}
              >
                Reward Name: {success?.reward.name}
              </Text>
              <Text variant="small" muted style={{ marginTop: 4 }}>
                Points Exchanged: {success?.reward.pointsRequired} NatPoints
              </Text>
            </View>
            <Text
              variant="small"
              muted
              style={{ textAlign: 'center', lineHeight: 18 }}
            >
              Present this code to{' '}
              <Text
                variant="small"
                style={{
                  fontFamily: theme.font.semibold,
                  color: theme.color.text,
                }}
              >
                {success?.reward.sponsorName || 'the sponsor'}
              </Text>{' '}
              to claim your reward.
            </Text>
            <Text
              variant="small"
              muted
              style={{ textAlign: 'center', marginTop: 6, fontSize: 10 }}
            >
              You&apos;ll receive an email within 2-3 business days
            </Text>
            <Text
              variant="small"
              muted
              style={{
                textAlign: 'center',
                marginTop: 16,
                marginBottom: 10,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontFamily: theme.font.medium,
              }}
            >
              Share your achievement
            </Text>
            <View
              style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              {(
                [
                  ['twitter', 'X'],
                  ['facebook', 'f'],
                  ['whatsapp', 'W'],
                  ['linkedin', 'in'],
                ] as const
              ).map(([platform, label]) => (
                <Pressable
                  key={platform}
                  testID={`reward-share-${platform}`}
                  onPress={() => void openShare(platform)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#000',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 11,
                      fontFamily: theme.font.bold,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              testID="reward-share-native"
              onPress={() => {
                if (!success) return;
                void share.share(
                  `${rewardShareText(success.reward.name)} https://natcycle.app`,
                );
              }}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Text variant="small" style={{ fontFamily: theme.font.semibold }}>
                More share options
              </Text>
            </Pressable>
            <Pressable
              testID="reward-success-done"
              onPress={() => setSuccess(null)}
              style={{
                marginTop: 16,
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: theme.font.semibold }}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ChromeScreen>
  );
}

function RewardRow({
  item,
  points,
  onClaim,
}: {
  item: RewardItem;
  points: number;
  onClaim: () => void;
}) {
  const theme = useTheme();
  const need = pointsNeeded(item.pointsRequired, points);
  const can = !item.redeemed && need === 0;
  const cta = item.redeemed
    ? '✓ Redeemed'
    : can
      ? 'Redeem Now'
      : 'Not Enough Points';
  return (
    <View
      style={{
        marginTop: 12,
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.color.borderSolid,
        opacity: item.redeemed ? 0.7 : 1,
      }}
    >
      <View
        style={{
          position: 'relative',
          height: 160,
          backgroundColor: '#dcfce7',
        }}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ height: 160, width: '100%' }}
          />
        ) : null}
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#000',
            borderRadius: theme.radius.pill,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{ color: '#fff', fontSize: 12, fontFamily: theme.font.bold }}
          >
            {item.pointsRequired} pts
          </Text>
        </View>
        {item.redeemed ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: '#4b5563',
              borderRadius: theme.radius.pill,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 12,
                fontFamily: theme.font.medium,
              }}
            >
              Redeemed
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ fontFamily: theme.font.bold }}>{item.name}</Text>
        {item.description ? (
          <Text variant="small" muted>
            {item.description}
          </Text>
        ) : null}
        <Text variant="small">
          Sponsored by {item.sponsorName ?? 'the sponsor'}
        </Text>
        {!item.redeemed ? (
          <Pressable
            testID={`claim-${item.id}`}
            disabled={!can}
            onPress={onClaim}
            style={{
              marginTop: 8,
              backgroundColor: can ? '#000' : '#e5e7eb',
              borderRadius: theme.radius.pill,
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: can ? '#fff' : '#9ca3af',
                fontFamily: theme.font.semibold,
                fontSize: 12,
              }}
            >
              {cta}
            </Text>
          </Pressable>
        ) : (
          <Text
            testID={`claim-${item.id}`}
            style={{
              marginTop: 8,
              textAlign: 'center',
              fontFamily: theme.font.semibold,
              color: '#16a34a',
            }}
          >
            ✓ Redeemed
          </Text>
        )}
      </View>
    </View>
  );
}
