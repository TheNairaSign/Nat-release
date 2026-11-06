import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAllowanceUsedUp } from '@/core/allowance';
import { withItemNames } from '@/core/grocery';
import {
  CONDITIONS,
  CONDITION_LABELS,
  buildSnapDivertAllChat,
  guestItems,
  toTagged,
  whereFor,
  type SnapCondition,
  type SnapItem,
} from '@/core/snapdivert';
import { askDivaWith } from '@/features/ai';
import { GuestSignInModal } from '@/features/auth';
import { GroceryAppHeader, GroceryHeaderLink, VoiceBars, uploadCartPhoto } from '@/features/grocery';
import { readHttpErrorMessage } from '@/shared/api/errors';
import { useSpeechInput } from '@/shared/hooks/use-speech-input';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import {
  CameraViewfinder,
  preparePhoto,
  type CameraViewfinderHandle,
  type PreparedPhoto,
} from '@/shared/ui/CameraViewfinder';
import { TaggedPhoto } from '@/shared/ui/TaggedPhoto';
import { MapPinGlyph, PlusGlyph, XGlyph } from '@/shared/ui/icons/featherGlyphs';
import { SNAPDIVERT_SVG } from '@/shared/ui/icons/homeAppIcons';

import {
  createSnapSession,
  identify,
  removeSnapItem,
  saveSnap,
  updateSnapItem,
} from '../api/snapdivert-api';

type Phase = 'capture' | 'working' | 'results' | 'error';

/**
 * One item under the photo (prototype "Scandiverter – 3"): its number and name (tap to
 * rename), "What's the condition?" as three choices, and "Find where" for drop-offs that
 * take its material. The × takes it out when it isn't being got rid of.
 */
function SnapItemCard({
  item,
  showTag,
  onCondition,
  onRename,
  onRemove,
  onFindWhere,
}: {
  item: SnapItem;
  showTag: boolean;
  onCondition: (condition: SnapCondition) => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  onFindWhere: () => void;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const finish = () => {
    const next = draft?.trim();
    setDraft(null);
    if (next && next !== item.name) onRename(next);
  };
  return (
    <View
      testID={`snap-item-${item.tag}`}
      style={{ borderRadius: 24, borderWidth: 1, borderColor: '#E6E6E6', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}
    >
      <Pressable
        accessibilityLabel={`Remove ${item.name}`}
        onPress={onRemove}
        style={{ position: 'absolute', right: 10, top: 10, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
      >
        <XGlyph color="#94A3B8" size={16} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingRight: 24 }}>
        {showTag ? (
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#D3FF5D', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, fontFamily: theme.font.bold, color: '#14361B' }}>{item.tag}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {draft === null ? (
            <Pressable accessibilityLabel={`Rename ${item.name}`} onPress={() => setDraft(item.name)}>
              <Text style={{ fontSize: 14, lineHeight: 18, fontFamily: theme.font.semibold, color: '#010B02', textTransform: 'capitalize' }}>
                {item.name}
              </Text>
            </Pressable>
          ) : (
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              onBlur={finish}
              onSubmitEditing={finish}
              maxLength={120}
              accessibilityLabel="Item name"
              style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#010B02', borderWidth: 1, borderColor: '#1B7A3D', borderRadius: 6, paddingHorizontal: 4 }}
            />
          )}
          <Text style={{ marginTop: 6, fontSize: 14, color: '#1E0D2A' }}>What&apos;s the condition?</Text>
          <View
            accessibilityRole="radiogroup"
            style={{ marginTop: 6, alignSelf: 'flex-start', flexDirection: 'row', borderRadius: 999, borderWidth: 1, borderColor: '#E6E6E6', padding: 3 }}
          >
            {CONDITIONS.map((condition) => {
              const picked = item.condition === condition;
              return (
                <Pressable
                  key={condition}
                  testID={`snap-condition-${item.tag}-${condition}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: picked }}
                  onPress={() => onCondition(condition)}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderColor: picked ? '#1A6C24' : 'transparent',
                    backgroundColor: picked ? '#D3FF5D' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 12, color: picked ? '#14361B' : '#1E0D2A' }}>{CONDITION_LABELS[condition]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={onFindWhere} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPinGlyph color="#198754" size={14} />
            <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#198754' }}>Find where</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * The DiVA bar at the foot (prototype; web SnapDivaBar.tsx): grey with "Tell me what is
 * there" before a photo, lime with "What is no 3?" once there are numbered items.
 */
function SnapDivaBar({
  items,
  onAsk,
}: {
  items: { tag: number; name: string }[];
  onAsk: (question: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const speech = useSpeechInput(useCallback((text: string) => setDraft(text), []));
  const lime = items.length > 0;
  const send = () => {
    const text = draft.trim();
    if (text) onAsk(withItemNames(text, items));
  };
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 + insets.bottom, zIndex: 20 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: 28,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderColor: lime ? '#D1FF52' : 'rgba(0,0,0,0.04)',
          backgroundColor: lime ? '#EBFEB5' : '#F2F2F2',
        }}
      >
        <Image source={require('../../../../assets/images/natcycle-ai.png')} style={{ width: 32, height: 32, borderRadius: 16 }} />
        <TextInput
          testID="snap-diva-input"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          returnKeyType="send"
          placeholder={speech.listening ? 'Listening…' : lime ? `What is no ${items.length}?` : 'Tell me what is there'}
          placeholderTextColor="#64748B"
          accessibilityLabel="Ask DiVA"
          style={{ flex: 1, minWidth: 0, paddingVertical: 6, fontSize: 15, color: '#1A3A12' }}
        />
        <Pressable
          accessibilityLabel={speech.listening ? 'Stop listening' : 'Ask by voice'}
          onPress={speech.toggle}
          style={{
            borderRadius: 999,
            padding: 8,
            ...(speech.listening ? { backgroundColor: '#D1FF52', borderWidth: 2, borderColor: '#B7E534' } : {}),
          }}
        >
          <VoiceBars active={speech.listening} fast={speech.listening} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * SnapDivert (web pages/snapdivert/SnapDivert.tsx): photograph what you're getting rid
 * of, see each thing named and numbered, say what condition it's in, and ask DiVA where
 * it should go. Photo → signed Cloudinary upload → the ML service names the items → our
 * server keeps them (a guest's stay on screen only).
 */
export function SnapDivertScreen({ guest = false }: { guest?: boolean }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { http, navigation, camera, location } = usePorts();
  const viewfinder = useRef<CameraViewfinderHandle>(null);
  const run = useRef(0);
  const lastPhoto = useRef<PreparedPhoto | null>(null);

  const [phase, setPhase] = useState<Phase>('capture');
  const [step, setStep] = useState<'upload' | 'look'>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [items, setItems] = useState<SnapItem[]>([]);
  /** Numbers come off the photo once they've moved on to diverting. */
  const [tagsHidden, setTagsHidden] = useState(false);
  const [removing, setRemoving] = useState<SnapItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedUp, setUsedUp] = useState(false);
  const [signup, setSignup] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  /** A photo was sent, so a failure can be tried again without re-shooting. */
  const [canRetry, setCanRetry] = useState(false);

  /** Members ask DiVA; the app has no guest chat yet, so a guest is asked to sign up. */
  const askDiva = (question: string, context?: Record<string, unknown>) => {
    if (guest) {
      setSignup(true);
      return;
    }
    askDivaWith(question, context);
    navigation.navigate('/ai');
  };

  async function identifyPhoto(photo: PreparedPhoto) {
    const mine = ++run.current;
    lastPhoto.current = photo;
    setCanRetry(true);
    setPreview(photo.uri);
    setPhase('working');
    setStep('upload');
    setError(null);
    setUsedUp(false);
    try {
      const session = await createSnapSession(http, guest);
      const url = await uploadCartPhoto(http, session.upload, photo);
      if (mine !== run.current) return;
      setStep('look');
      const found = await identify(http, session, url);
      if (mine !== run.current) return;
      if (found.length === 0) {
        throw new Error("We couldn't find anything to divert in this photo. Try another angle.");
      }
      const kept = guest ? guestItems(url, found) : await saveSnap(http, url, found);
      if (mine !== run.current) return;
      setPhotoUrl(url);
      setItems(kept);
      setTagsHidden(false);
      setPhase('results');
    } catch (err) {
      if (mine !== run.current) return;
      setError(readHttpErrorMessage(err, 'Something went wrong. Try again.'));
      setPhase('error');
      if (isAllowanceUsedUp(err)) {
        setUsedUp(true);
        if (guest) setSignup(true);
      }
    }
  }

  async function shoot() {
    const photo = await viewfinder.current?.capture();
    if (photo) {
      void identifyPhoto(photo);
      return;
    }
    // No camera: a photo from the library instead.
    const picked = await camera.pickImage();
    if (!picked) return;
    const prepared = await preparePhoto(picked.uri);
    if (prepared) void identifyPhoto(prepared);
  }

  function retake() {
    run.current += 1; // abandon anything in flight
    setItems([]);
    setPhotoUrl(null);
    setPreview(null);
    setError(null);
    setTagsHidden(false);
    setPhase('capture');
  }

  const patch = (id: string, changes: Partial<SnapItem>) =>
    setItems((list) => list.map((i) => (i._id === id ? { ...i, ...changes } : i)));

  async function setCondition(item: SnapItem, condition: SnapCondition) {
    const next = item.condition === condition ? null : condition; // tap again to clear
    patch(item._id, { condition: next });
    if (guest) return;
    try {
      await updateSnapItem(http, item._id, { condition: next });
    } catch {
      patch(item._id, { condition: item.condition });
    }
  }

  async function rename(item: SnapItem, name: string) {
    patch(item._id, { name });
    if (guest) return;
    try {
      await updateSnapItem(http, item._id, { name });
    } catch {
      patch(item._id, { name: item.name });
    }
  }

  async function remove(item: SnapItem) {
    setRemoving(null);
    setItems((list) => list.filter((i) => i._id !== item._id));
    if (guest) return;
    try {
      await removeSnapItem(http, item._id);
    } catch {
      setItems((list) => [...list, item].sort((a, b) => a.tag - b.tag));
    }
  }

  /** One question to DiVA for everything on the photo, with where they are if allowed. */
  async function divertAll() {
    setTagsHidden(true);
    const here = await location.getCurrentPosition().catch(() => null);
    const chat = buildSnapDivertAllChat(items, here);
    askDiva(chat.question, chat.context);
  }

  const shown = photoUrl ?? preview;
  const tagsShown = phase === 'results' && !tagsHidden;
  const go = (path: string) => navigation.navigate(guest ? `/guest${path}` : path);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <GroceryAppHeader
        title="ScanDiverter"
        right={
          <GroceryHeaderLink label="History" onPress={() => (guest ? setSignup(true) : navigation.replace('/snapdivert/history'))} />
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 + insets.bottom, flexGrow: 1 }}>
        {phase !== 'results' ? (
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#D1E1FF', alignItems: 'center', justifyContent: 'center' }}>
              <SvgXml xml={SNAPDIVERT_SVG} width={32} height={26} />
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#1E0D2A', alignItems: 'center', justifyContent: 'center' }}>
                <PlusGlyph color="#ffffff" size={12} />
              </View>
            </View>
            <Text style={{ marginTop: 8, fontSize: 16, color: '#1E0D2A' }}>Hi there,</Text>
            <Text style={{ maxWidth: 300, textAlign: 'center', fontSize: 24, lineHeight: 30, fontFamily: theme.font.bold, color: '#1E0D2A' }}>
              Show what you are disposing
            </Text>
          </View>
        ) : null}

        <View
          testID="snap-frame"
          style={{
            marginTop: 16,
            overflow: 'hidden',
            borderRadius: 24,
            backgroundColor: '#0F172A',
            ...(phase === 'results' ? { height: 235 } : { minHeight: 340, flex: 1 }),
          }}
        >
          {shown ? (
            <TaggedPhoto
              src={shown}
              items={tagsShown ? items.map(toTagged) : []}
              // A number on something that isn't being got rid of: tap to take it out.
              onTagTap={tagsShown ? (tag) => setRemoving(items.find((i) => i.tag === tag) ?? null) : undefined}
            />
          ) : (
            <CameraViewfinder ref={viewfinder} active={phase === 'capture'} onUnavailable={() => setCameraOff(true)} />
          )}

          {phase === 'capture' ? (
            <>
              <View pointerEvents="none" style={{ position: 'absolute', left: 14, right: 14, top: 14, bottom: 58, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 10, zIndex: 10, alignItems: 'center', gap: 6 }}>
                <Pressable
                  testID="snap-shutter"
                  accessibilityLabel="Take photo"
                  onPress={() => void shoot()}
                  style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#E53935', borderWidth: 3, borderColor: 'rgba(229,57,53,0.25)' }}
                />
                <Text style={{ borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.75)', paddingHorizontal: 10, fontSize: 12.5, lineHeight: 15, color: '#1A1A2E', overflow: 'hidden' }}>
                  {cameraOff ? 'Tap the shutter to pick a photo' : 'take a clean photo, showing what you are getting rid of'}
                </Text>
              </View>
            </>
          ) : null}

          {phase === 'working' ? (
            <View accessibilityRole="progressbar" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <ActivityIndicator size="large" color="#D1FF52" />
              <Text style={{ fontSize: 14, fontFamily: theme.font.medium, color: '#ffffff' }}>
                {step === 'upload' ? 'Sending your photo…' : "Looking at what's there…"}
              </Text>
              <Pressable onPress={retake}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textDecorationLine: 'underline' }}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          {phase === 'results' ? (
            <Pressable
              onPress={retake}
              style={{ position: 'absolute', right: 12, top: 12, zIndex: 20, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: '#ffffff' }}>Retake</Text>
            </Pressable>
          ) : null}

          {phase === 'error' ? (
            <View accessibilityRole="alert" style={{ position: 'absolute', left: 16, right: 16, top: 16, zIndex: 20, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#B42318' }}>
                {usedUp ? 'Not enough tokens' : "Couldn't finish"}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 13, color: '#475569' }}>{error}</Text>
              <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
                {canRetry && !usedUp ? (
                  <Pressable
                    onPress={() => lastPhoto.current && void identifyPhoto(lastPhoto.current)}
                    style={{ flex: 1, borderRadius: 999, backgroundColor: '#D1FF52', paddingVertical: 8, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontFamily: theme.font.bold, color: '#14361B' }}>Try again</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  testID="snap-error-second"
                  onPress={usedUp ? (guest ? () => setSignup(true) : () => navigation.navigate('/tokens')) : retake}
                  style={{ flex: 1, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#ffffff', paddingVertical: 8, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>
                    {usedUp ? (guest ? 'Sign up for more' : 'Get more tokens') : 'Retake photo'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        {phase === 'results' ? (
          <>
            <View style={{ marginTop: 16, gap: 12 }}>
              {items.map((item) => (
                <SnapItemCard
                  key={item._id}
                  item={item}
                  showTag={tagsShown}
                  onCondition={(condition) => void setCondition(item, condition)}
                  onRename={(name) => void rename(item, name)}
                  onRemove={() => setRemoving(item)}
                  onFindWhere={() => go(whereFor(item.material))}
                />
              ))}
            </View>
            {items.length > 0 ? (
              <Pressable
                testID="snap-divert-all"
                onPress={() => void divertAll()}
                style={{ marginTop: 16, borderRadius: 999, backgroundColor: '#1C0F28', paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontFamily: theme.font.semibold, color: '#FAFFEF' }}>
                  {items.length === 1 ? 'How to divert it?' : `How to divert these ${items.length}?`}
                </Text>
              </Pressable>
            ) : (
              <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 14, color: '#64748B' }}>Nothing left from this photo. </Text>
                <Pressable onPress={retake}>
                  <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#198754', textDecorationLine: 'underline' }}>Snap another</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      {removing ? (
        <BottomSheet open onClose={() => setRemoving(null)} testID="snap-remove">
          <View style={{ paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: '#1A1A2E' }}>Remove {removing.name}?</Text>
            <Text style={{ marginTop: 2, fontSize: 13, color: '#64748B' }}>It won&apos;t be saved to your list.</Text>
            <Pressable
              testID="snap-remove-confirm"
              onPress={() => void remove(removing)}
              style={{ marginTop: 16, borderRadius: 999, backgroundColor: '#D1FF52', paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#14361B' }}>Remove it</Text>
            </Pressable>
            <Pressable onPress={() => setRemoving(null)} style={{ marginTop: 8, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#64748B' }}>Keep it</Text>
            </Pressable>
          </View>
        </BottomSheet>
      ) : null}

      <SnapDivaBar items={phase === 'results' ? items : []} onAsk={(question) => askDiva(question)} />

      <GuestSignInModal
        open={signup}
        onClose={() => setSignup(false)}
        message={
          usedUp
            ? "You've used your free tokens. Sign up to get tokens every month and keep what you snap."
            : 'Sign up to keep what you snap and see it in your History.'
        }
      />
    </View>
  );
}
