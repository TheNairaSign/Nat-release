import { Pressable, View } from 'react-native';

import { tk, usd, type Allowance } from '@/core/allowance';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, Text } from '@/shared/ui';
import { CheckGlyph } from '@/shared/ui/icons/featherGlyphs';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';

import { fetchTokenOffer, tokenOfferQueryKey } from '../api/tokens-api';
import { useAllowance } from '../hooks/use-allowance';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

/** "Enough for 6 scans or 33 DiVA questions": web's stillBuys. */
export function stillBuys(allowance: Allowance): string | null {
  const scan = allowance.kinds.find((k) => k.kind === 'groceryScan')?.canAfford;
  const question = allowance.kinds.find(
    (k) => k.kind === 'divaQuestion',
  )?.canAfford;
  if (scan == null || question == null) return null;
  if (question === 0) return 'Not enough left for a DiVA question';
  const scans = `${scan} scan${scan === 1 ? '' : 's'}`;
  const questions = `${question} DiVA question${question === 1 ? '' : 's'}`;
  return scan > 0
    ? `Enough for ${scans} or ${questions}`
    : `Enough for ${questions}`;
}

function SectionTitle({ children }: { children: string }) {
  const theme = useTheme();
  // web: text-[11px] font-semibold uppercase tracking-wider text-slate-400, mb-2.5
  return (
    <Text
      style={{
        fontSize: 11,
        fontFamily: theme.font.semibold,
        color: '#94a3b8',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 10,
        paddingHorizontal: 2,
      }}
    >
      {children}
    </Text>
  );
}

const card = {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.04)',
  backgroundColor: '#ffffff',
};

/**
 * AI tokens: what's left this month, what it went on, and the tiers and top-ups.
 * Web: pages/dashboard/tokens/Tokens.tsx. Buying isn't offered in the app: the stores
 * require their own payments for digital goods, so it reads "open soon" as the live web
 * does while production has no payments.
 */
export function TokensScreen() {
  const theme = useTheme();
  const { http, navigation } = usePorts();
  const { allowance, settled } = useAllowance();
  const offer = useQuery({
    queryKey: tokenOfferQueryKey,
    queryFn: () => fetchTokenOffer(http),
  });

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 4,
        paddingBottom: 16,
      }}
    >
      <Pressable
        testID="tokens-back"
        accessibilityLabel="Back"
        onPress={() => navigation.back()}
        style={{
          marginLeft: -8,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronGlyph color="#111111" size={18} direction="left" />
      </Pressable>
      <Text style={{ fontSize: 18, fontFamily: theme.font.bold, color: '#111111' }}>
        AI tokens
      </Text>
    </View>
  );

  if (!allowance) {
    return (
      <ChromeScreen>
        {header}
        {settled ? (
          <View style={{ ...card, paddingHorizontal: 16, paddingVertical: 24 }}>
            <Text style={{ textAlign: 'center', fontSize: 14, color: '#64748b' }}>
              Couldn&apos;t load your tokens.
            </Text>
          </View>
        ) : (
          <View testID="tokens-loading">
            <View style={{ height: 168, borderRadius: 16, backgroundColor: '#ffffff' }} />
            <View
              style={{ marginTop: 24, height: 220, borderRadius: 16, backgroundColor: '#ffffff' }}
            />
          </View>
        )}
      </ChromeScreen>
    );
  }

  const { used, total, left, extra } = allowance.tokens;
  const share = total ? Math.min(1, used / total) : 0;
  const buys = stillBuys(allowance);
  const packs = (offer.data?.topUps ?? []).filter((p) => p.active);
  const tiers = offer.data?.tiers ?? [];
  // Members only: a guest has no account to keep bought tokens on.
  const showTopUps = allowance.billing !== null && packs.length > 0;

  return (
    <ChromeScreen>
      {header}

      {/* What's left — web: rounded-2xl bg-[#111111] px-5 pb-5 pt-4 */}
      <View
        style={{
          borderRadius: 16,
          backgroundColor: '#111111',
          paddingHorizontal: 20,
          paddingBottom: 20,
          paddingTop: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            {extra > 0 ? 'Left to use' : 'Left this month'}
          </Text>
          <View
            style={{
              borderRadius: 999,
              backgroundColor: '#D1FF52',
              paddingHorizontal: 10,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: theme.font.semibold, color: '#14361B' }}>
              {allowance.tierName}
            </Text>
          </View>
        </View>
        <Text
          testID="tokens-left"
          style={{
            marginTop: 8,
            fontSize: 40,
            lineHeight: 44,
            fontFamily: theme.font.bold,
            color: '#ffffff',
            fontVariant: ['tabular-nums'],
          }}
        >
          {tk(left)}
          <Text style={{ fontSize: 16, fontFamily: theme.font.semibold, color: 'rgba(255,255,255,0.5)' }}>
            {' '}TK
          </Text>
        </Text>
        <View
          style={{
            marginTop: 16,
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <View
            style={{ height: 8, borderRadius: 4, backgroundColor: '#D1FF52', width: `${share * 100}%` }}
          />
        </View>
        <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {tk(used)} of {tk(total)} used
          </Text>
          {allowance.resetsOn ? (
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Back to {tk(total)} on {day(allowance.resetsOn)}
            </Text>
          ) : null}
        </View>
        {extra > 0 ? (
          <Text style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Includes {tk(extra)} TK you bought, used after the month&apos;s run out
          </Text>
        ) : null}
        {buys ? (
          <Text style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{buys}</Text>
        ) : null}
      </View>

      {showTopUps ? (
        <View style={{ marginTop: 24 }}>
          <SectionTitle>Top up</SectionTitle>
          <View style={{ ...card, paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>
              Ran out before the 1st? Buy tokens once. They don&apos;t expire, and are used
              only after your monthly ones.
            </Text>
            <Text style={{ marginTop: 12, fontSize: 13, fontFamily: theme.font.medium, color: '#64748b' }}>
              Top-ups open soon
            </Text>
          </View>
        </View>
      ) : null}

      {/* Where they went */}
      <View style={{ marginTop: 24 }}>
        <SectionTitle>Where they went</SectionTitle>
        <View style={card}>
          {allowance.kinds.map((kind, i) => (
            <View
              key={kind.kind}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: 'rgba(0,0,0,0.05)',
              }}
            >
              <View style={{ flexShrink: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#111111' }}>
                  {kind.label}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>
                  {tk(kind.cost)} TK each
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#111111' }}>
                  {tk(kind.tokens)} TK
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>
                  {kind.used} used
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Tiers */}
      {tiers.length > 0 ? (
        <View style={{ marginTop: 24 }}>
          <SectionTitle>Tiers</SectionTitle>
          <View style={{ gap: 10 }}>
            {tiers.map((tier) => {
              const current = tier.key === allowance.tier;
              const paid = tier.priceCents > 0;
              const better = paid && tier.tokens > total;
              return (
                <View
                  key={tier.key}
                  testID={`tier-${tier.key}`}
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderColor: current ? '#B8E83A' : 'rgba(0,0,0,0.04)',
                    backgroundColor: current ? '#F6FFE0' : '#ffffff',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flexShrink: 1 }}>
                      <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: '#111111' }}>
                        {tier.name}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: 13, color: '#64748b' }}>
                        {tk(tier.tokens)} TK a month{tier.blurb ? ` · ${tier.blurb}` : ''}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: '#111111' }}>
                      {paid ? usd(tier.priceCents) : 'Free'}
                      {paid ? (
                        <Text style={{ fontSize: 12, fontFamily: theme.font.medium, color: '#94a3b8' }}>
                          /mo
                        </Text>
                      ) : null}
                    </Text>
                  </View>
                  {current ? (
                    <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckGlyph color="#1A6C24" size={15} strokeWidth={3} />
                      <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#1A6C24' }}>
                        Your tier
                      </Text>
                    </View>
                  ) : better ? (
                    <Text style={{ marginTop: 12, fontSize: 13, fontFamily: theme.font.medium, color: '#64748b' }}>
                      Upgrades open soon
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </ChromeScreen>
  );
}
