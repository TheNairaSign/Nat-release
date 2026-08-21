import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import {
  canSubmitCampaign,
  canSubmitSimple,
  dateTooOld,
  estimatedCu,
  materialLinesForSite,
  parseDropoffMode,
  quantitiesAsNumbers,
  type DropoffMode,
} from '@/core/dropoff';
import type { CapturedImage } from '@/shared/ports/camera';
import {
  fetchEventSites,
  fetchMaterialCatalog,
  fetchSimpleSites,
  submitCampaignDropoff,
  submitSimpleDropoff,
} from '../api/dropoff-api';
import {
  MaterialQuantityList,
  QuantityStepperNote,
} from '../ui/MaterialQuantityList';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';

export function LogDropoffScreen({
  mode,
  locationId,
  campaignId,
  type,
}: {
  mode?: string;
  locationId?: string;
  campaignId?: string;
  type?: string;
}) {
  const theme = useTheme();
  const { http, navigation, location, camera, clock } = usePorts();
  const [step, setStep] = useState(campaignId || locationId ? 2 : 1);
  const [dropoffMode, setDropoffMode] = useState<DropoffMode>(
    parseDropoffMode(mode ?? (campaignId ? 'campaign' : 'simple')),
  );
  const [when, setWhen] = useState<'today' | 'yesterday' | 'other'>('today');
  const [otherDate, setOtherDate] = useState('');
  const [selectedSite, setSelectedSite] = useState(locationId ?? '');
  const [selectedEvent, setSelectedEvent] = useState(campaignId ?? '');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [qty, setQty] = useState('1');
  const [photo, setPhoto] = useState<CapturedImage | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const sitesQuery = useQuery({
    queryKey: ['log', 'sites', type],
    queryFn: () => fetchSimpleSites(http, null, type),
  });
  const eventsQuery = useQuery({
    queryKey: ['log', 'events'],
    queryFn: () => fetchEventSites(http, true),
  });
  const catalogQuery = useQuery({
    queryKey: ['dropoff-material-catalog'],
    queryFn: () => fetchMaterialCatalog(http),
  });

  const site =
    (sitesQuery.data ?? []).find((item) => item.id === selectedSite) ?? null;
  const lines = site
    ? materialLinesForSite(
        site.materials,
        site.subtypes,
        catalogQuery.data ?? [],
      )
    : [];
  const qtyNumbers = quantitiesAsNumbers(quantities);

  function dropDate(): Date {
    const now = clock.now();
    if (when === 'yesterday') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d;
    }
    if (when === 'other' && otherDate) return new Date(otherDate);
    return now;
  }

  async function onSubmit() {
    const date = dropDate();
    const invalid = dateTooOld(date, clock.now());
    if (invalid) {
      setError(invalid);
      return;
    }
    const origin = await location.getCurrentPosition();
    if (!origin) {
      setError('Location is required to log a previous drop-off.');
      return;
    }
    if (!photo) {
      setError('Please capture a proof photo or video.');
      return;
    }
    setPending(true);
    const iso = date.toISOString();
    if (dropoffMode === 'simple') {
      const entries = Object.entries(qtyNumbers);
      if (!selectedSite || entries.length === 0) {
        setPending(false);
        setError('Enter a quantity for at least one material.');
        return;
      }
      for (const [materialType, materialQty] of entries) {
        const result = await submitSimpleDropoff(http, {
          locationId: selectedSite,
          materialType,
          quantity: materialQty,
          latitude: origin.latitude,
          longitude: origin.longitude,
          photo,
          dropOffDate: iso,
        });
        if (!result.ok) {
          setPending(false);
          setError('Could not log drop-off.');
          return;
        }
      }
      setPending(false);
    } else {
      const result = await submitCampaignDropoff(http, {
        campaignId: selectedEvent,
        materialType: type || 'plastic',
        quantity: Number(qty) || 1,
        latitude: origin.latitude,
        longitude: origin.longitude,
        photo,
        dropOffDate: iso,
      });
      setPending(false);
      if (!result.ok) {
        setError('Could not log drop-off.');
        return;
      }
    }
    navigation.navigate('/impact');
  }

  const quantity = Number(qty) || 0;
  const ready =
    dropoffMode === 'simple'
      ? canSubmitSimple(Boolean(photo), qtyNumbers) && Boolean(selectedSite)
      : canSubmitCampaign(Boolean(photo), quantity, Boolean(selectedEvent));

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      <Text style={{ fontSize: 22, fontFamily: theme.font.bold }}>
        Log previous drop-off
      </Text>
      {step === 1 ? (
        <>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            {(['simple', 'campaign'] as const).map((id) => (
              <Pressable
                key={id}
                onPress={() => setDropoffMode(id)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: theme.radius.lg,
                  backgroundColor:
                    dropoffMode === id ? theme.color.ink : theme.color.band,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: dropoffMode === id ? '#fff' : theme.color.text,
                  }}
                >
                  {id === 'simple' ? 'Static' : 'Event'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ marginTop: 16, fontFamily: theme.font.semibold }}>
            When?
          </Text>
          {(['today', 'yesterday', 'other'] as const).map((id) => (
            <Pressable
              key={id}
              onPress={() => setWhen(id)}
              style={{ marginTop: 8 }}
            >
              <Text
                style={{
                  fontFamily:
                    when === id ? theme.font.bold : theme.font.regular,
                }}
              >
                {id === 'today'
                  ? 'Today'
                  : id === 'yesterday'
                    ? 'Yesterday'
                    : 'Other date'}
              </Text>
            </Pressable>
          ))}
          {when === 'other' ? (
            <TextInput
              value={otherDate}
              onChangeText={setOtherDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.color.placeholder}
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderColor: theme.color.inputBorder,
                borderRadius: 12,
                padding: 12,
                color: theme.color.text,
              }}
            />
          ) : null}
          <Pressable
            testID="log-continue-1"
            onPress={() => setStep(2)}
            style={{
              marginTop: 20,
              backgroundColor: theme.color.ink,
              borderRadius: theme.radius.lg,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff' }}>Continue</Text>
          </Pressable>
        </>
      ) : null}
      {step === 2 ? (
        <>
          {(dropoffMode === 'simple'
            ? (sitesQuery.data ?? [])
            : (eventsQuery.data ?? [])
          ).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (dropoffMode === 'simple') {
                  setSelectedSite(item.id);
                  setQuantities({});
                } else setSelectedEvent(item.id);
              }}
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.color.borderSolid,
                backgroundColor:
                  item.id === selectedSite || item.id === selectedEvent
                    ? theme.color.band
                    : theme.color.surface,
              }}
            >
              <Text style={{ fontFamily: theme.font.semibold }}>
                {item.name}
              </Text>
            </Pressable>
          ))}
          <Pressable
            testID="log-continue-2"
            onPress={() => setStep(3)}
            style={{
              marginTop: 20,
              backgroundColor: theme.color.ink,
              borderRadius: theme.radius.lg,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff' }}>Continue</Text>
          </Pressable>
        </>
      ) : null}
      {step === 3 ? (
        <>
          {dropoffMode === 'simple' && site ? (
            <>
              <MaterialQuantityList
                lines={lines}
                quantities={quantities}
                loading={catalogQuery.isPending}
                onChange={(id, value) =>
                  setQuantities((prev) => ({ ...prev, [id]: value }))
                }
              />
              <QuantityStepperNote estimated={estimatedCu(lines, qtyNumbers)} />
            </>
          ) : (
            <TextInput
              testID="log-qty"
              keyboardType="number-pad"
              value={qty}
              onChangeText={setQty}
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: theme.color.inputBorder,
                borderRadius: 12,
                padding: 12,
                color: theme.color.text,
              }}
            />
          )}
          <Pressable
            testID="log-take-photo"
            onPress={async () => setPhoto(await camera.takePhoto())}
            style={{ marginTop: 12 }}
          >
            <Text>{photo ? 'Proof photo' : 'Add proof photo'}</Text>
          </Pressable>
          <Pressable
            testID="log-submit"
            disabled={!ready || pending}
            onPress={() => {
              void onSubmit();
            }}
            style={{
              marginTop: 20,
              backgroundColor: theme.color.ink,
              borderRadius: theme.radius.lg,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: !ready || pending ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#fff' }}>
              {pending ? 'Submitting…' : 'Submit drop-off'}
            </Text>
          </Pressable>
        </>
      ) : null}
      {error ? (
        <Text style={{ color: theme.color.danger, marginTop: 8 }}>{error}</Text>
      ) : null}
    </ChromeScreen>
  );
}
