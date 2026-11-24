import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAllowanceUsedUp } from '@/core/allowance';
import {
  attentionCopy,
  dueThisWeek,
  interpretAnswer,
  questionPrompt,
  type ExpirySource,
  type MlCart,
  type MlCartItem,
} from '@/core/grocery';
import { GuestSignInModal } from '@/features/auth';
import { useQuery } from '@/shared/api';
import { readHttpErrorMessage } from '@/shared/api/errors';
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
import { BellOnGlyph } from '@/shared/ui/icons/groceryGlyphs';

import { groceryKeys, listItems, updateItem } from '../api/grocery-api';
import {
  createScanSession,
  pollUntilSettled,
  scanApi,
  uploadCartPhoto,
  type ScanSession,
} from '../api/scan-api';
import { GroceryAppHeader, GroceryHeaderLink } from '../ui/GroceryAppHeader';
import { ExpiryDatePicker } from '../ui/GrocerySheets';
import { ScanItemCard } from '../ui/ScanItemCard';
import { VoiceBars } from '../ui/VoiceBars';

type Phase = 'capture' | 'uploading' | 'scanning' | 'review' | 'saving' | 'done' | 'error';

function statusCopy(phase: Phase, error: string | null): string | null {
  if (phase === 'uploading') return 'Uploading your photo…';
  if (phase === 'scanning') return 'Finding items in your cart…';
  if (phase === 'saving') return 'Saving to your grocery list…';
  if (phase === 'error') return error || 'Something went wrong';
  return null;
}

/**
 * The Grocery Manager's scanner (web GroceryManager.tsx): photograph the shop, the ML
 * service finds each item, and DiVA asks out loud about anything it isn't sure of (what
 * it is, when it expires, whether several are the same), listening for the answer. Then
 * the list is saved, with reminders on unless switched off. Guests scan the same way;
 * nothing is kept, so they're asked to sign up afterwards.
 */
export function GroceryScannerScreen({ guest = false }: { guest?: boolean }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { http, navigation, speech, camera } = usePorts();
  const viewfinder = useRef<CameraViewfinderHandle>(null);
  const session = useRef<ScanSession | null>(null);
  // Bumped on every new scan and on cancel: results from an older scan are ignored.
  const run = useRef(0);
  const lastPhoto = useRef<PreparedPhoto | null>(null);
  const stopListening = useRef<(() => void) | null>(null);

  const [phase, setPhase] = useState<Phase>('capture');
  const [cart, setCart] = useState<MlCart | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedUp, setUsedUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [heardNothing, setHeardNothing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [remindersOff, setRemindersOff] = useState<number[]>([]);
  const [picking, setPicking] = useState<MlCartItem | null>(null);
  const [removingTag, setRemovingTag] = useState<number | null>(null);
  const [signup, setSignup] = useState(false);

  // The same "due this week" count as every other Grocery Manager entry point.
  const itemsQuery = useQuery({
    queryKey: groceryKeys.items('active'),
    queryFn: () => listItems(http, 'active'),
    enabled: !guest,
  });
  const due = itemsQuery.data
    ? dueThisWeek(itemsQuery.data).reduce((sum, i) => sum + (i.quantity ?? 1), 0)
    : 0;
  const glance = guest
    ? { state: 'empty' as const }
    : itemsQuery.data === undefined
      ? { state: 'loading' as const }
      : itemsQuery.data.length === 0
        ? { state: 'empty' as const }
        : due > 0
          ? { state: 'due' as const, count: due }
          : { state: 'calm' as const };
  const attention = attentionCopy(glance);

  // Never leave the mic or a spoken prompt running behind us.
  useEffect(
    () => () => {
      stopListening.current?.();
      speech.stopSaying();
    },
    [speech],
  );

  const currentQuestion = cart?.open_questions[0];

  /** Listen once; whatever was heard is answered when listening ends. */
  async function listen() {
    stopListening.current?.();
    let heard = '';
    setHeardNothing(false);
    setListening(true);
    stopListening.current = await speech.listen({
      onText: (text) => {
        heard = text;
        setDraft(text);
      },
      onEnd: () => {
        stopListening.current = null;
        setListening(false);
        if (heard.trim()) void applyAnswerRef.current?.(heard);
        else setHeardNothing(true);
      },
      onError: () => setListening(false),
    });
  }

  /**
   * Ask out loud, then listen: nobody should have to tap anything. Our own voice first
   * (the scan service's), the phone's voice when there isn't one (web ask()).
   */
  async function ask(text: string) {
    speech.stopSaying();
    setSpeaking(true);
    const s = session.current;
    const spoken = s
      ? await speech
          .playVoice({ url: `${s.ml.baseUrl.replace(/\/$/, '')}/v1/speech`, token: s.ml.token, text })
          .catch(() => false)
      : false;
    if (!spoken) await speech.say(text).catch(() => undefined);
    setSpeaking(false);
    await listen();
  }

  /** A new cart: show it, and ask its first question aloud. */
  function showCart(next: MlCart) {
    setCart(next);
    setPhase('review');
    const q = next.open_questions[0];
    if (q) void ask(questionPrompt(q, next).text);
  }

  /** Reminder switches are flipped before the items exist; apply the "off" ones after. */
  async function applyReminderChoices(cartId: string, offTags: number[]) {
    if (offTags.length === 0) return;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await new Promise((r) => setTimeout(r, 1200));
      try {
        const saved = (await listItems(http, 'active')).filter(
          (item) => item.cartId === cartId && offTags.includes(item.tag),
        );
        if (saved.length === 0) continue;
        await Promise.all(saved.map((item) => updateItem(http, item._id, { remindersEnabled: false })));
        return;
      } catch {
        /* keep trying: reminders default to on, the safe end */
      }
    }
  }

  async function finalizeIfReady(next: MlCart) {
    const s = session.current;
    if (!s) return;
    if (next.status !== 'ready') {
      showCart(next);
      return;
    }
    setPhase('saving');
    const finalized = await scanApi.finalize(http, s, next.id);
    setCart(finalized);
    setPhase('done');
    stopListening.current?.();
    if (guest) setSignup(true);
    else void applyReminderChoices(finalized.id, remindersOff);
  }

  async function runScan(photo: PreparedPhoto) {
    const mine = ++run.current;
    const cancelled = () => run.current !== mine;
    lastPhoto.current = photo;
    setBusy(true);
    setError(null);
    setUsedUp(false);
    setCart(null);
    setPreview(photo.uri);
    setPhase('uploading');
    try {
      const s = await createScanSession(http, guest);
      if (cancelled()) return;
      session.current = s;
      const secureUrl = await uploadCartPhoto(http, s.upload, photo);
      if (cancelled()) return;
      setPreview(secureUrl);
      setPhase('scanning');
      const started = await scanApi.start(http, s, secureUrl);
      if (cancelled()) return;
      const settled = await pollUntilSettled(http, s, started.id, { cancelled });
      if (cancelled()) return;
      if (settled.status === 'ready') await finalizeIfReady(settled);
      else if (settled.status === 'awaiting_answers' && settled.open_questions.length === 0) {
        await finalizeIfReady(await scanApi.confirm(http, s, settled.id));
      } else showCart(settled);
    } catch (err) {
      if (cancelled()) return; // they cancelled: not an error
      setError(readHttpErrorMessage(err, 'Could not scan groceries'));
      setPhase('error');
      if (isAllowanceUsedUp(err)) {
        setUsedUp(true);
        if (guest) setSignup(true);
      }
    } finally {
      if (!cancelled()) setBusy(false);
    }
  }

  async function shoot() {
    const photo = await viewfinder.current?.capture();
    if (photo) {
      void runScan(photo);
      return;
    }
    // No camera (or not ready): a photo from the library instead, as web's file picker.
    const picked = await camera.pickImage();
    if (!picked) return;
    // A gallery photo comes at full camera size (often 4000px, 5–12 MB): shrunk like a
    // capture, or big carts were slow to upload and the largest failed (web shrinkPhoto).
    const prepared = await preparePhoto(picked.uri, picked.width, picked.height);
    if (prepared) void runScan(prepared);
  }

  function resetToCapture() {
    run.current += 1; // abandon any scan in flight
    stopListening.current?.();
    speech.stopSaying();
    session.current = null;
    setTyping(false);
    setListening(false);
    setSpeaking(false);
    setCart(null);
    setError(null);
    setDraft('');
    setBusy(false);
    setPreview(null);
    setPhase('capture');
  }

  async function applyAnswer(text: string) {
    const s = session.current;
    if (!s || !cart || busy || !text.trim()) return;
    const action = interpretAnswer(text, currentQuestion);
    if (action.type === 'sayAgain') {
      setNotice(action.message);
      void ask(action.message);
      return;
    }
    setBusy(true);
    setDraft('');
    try {
      const next =
        action.type === 'confirm'
          ? await scanApi.confirm(http, s, cart.id)
          : action.type === 'remove'
            ? await scanApi.removeItem(http, s, cart.id, action.tag)
            : action.type === 'update'
              ? await scanApi.updateItem(http, s, cart.id, action.tag, action.changes)
              : action.type === 'merge'
                ? await scanApi.merge(http, s, cart.id, action.tag)
                : await scanApi.keepSeparate(http, s, cart.id, action.tag);
      setTyping(false);
      setNotice(null);
      await finalizeIfReady(next);
    } catch (err) {
      setNotice(readHttpErrorMessage(err, 'Could not update item'));
    } finally {
      setBusy(false);
    }
  }
  // Voice results arrive later; they answer through the latest applyAnswer.
  const applyAnswerRef = useRef(applyAnswer);
  useEffect(() => {
    applyAnswerRef.current = applyAnswer;
  });

  /** "Save to my list": the same as answering yes to the review question. */
  async function saveList() {
    const s = session.current;
    if (!s || !cart || busy) return;
    stopListening.current?.();
    speech.stopSaying();
    setBusy(true);
    try {
      await finalizeIfReady(cart.status === 'ready' ? cart : await scanApi.confirm(http, s, cart.id));
    } catch (err) {
      setNotice(readHttpErrorMessage(err, 'Could not save your list'));
    } finally {
      setBusy(false);
    }
  }

  /** An edit on an item card: rename, separate, remove or a picked date. */
  async function edit(change: (s: ScanSession, id: string) => Promise<MlCart>, fallback: string) {
    const s = session.current;
    if (!s || !cart) return;
    setBusy(true);
    try {
      setCart(await change(s, cart.id));
    } catch (err) {
      setNotice(readHttpErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  }

  const toHistory = () => (guest ? setSignup(true) : navigation.replace('/grocery/history'));
  const displayImage = preview || cart?.image_url || null;
  const prompt = questionPrompt(currentQuestion, cart);
  const showQuestion = phase === 'review' && !!currentQuestion && !draft && !typing;
  const working = phase === 'uploading' || phase === 'scanning' || phase === 'saving';
  const rows = cart?.items.filter((i) => i.merged_into === null) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <GroceryAppHeader right={<GroceryHeaderLink label="History" onPress={toHistory} />} />

      {phase === 'capture' ? (
        <View style={{ alignItems: 'center', marginBottom: 20, paddingHorizontal: 16 }}>
          {/* The way into History, and a warning when food is about to go off. */}
          <Pressable
            testID="scanner-attention"
            onPress={toHistory}
            style={{
              marginTop: 12,
              width: '100%',
              maxWidth: 276,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: glance.state === 'due' ? '#FFEFF1' : '#F0F1F2',
            }}
          >
            <BellOnGlyph color={glance.state === 'due' ? '#4A4344' : '#64748B'} size={24} />
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: glance.state === 'due' ? theme.font.bold : theme.font.semibold,
                  color: glance.state === 'due' ? '#DC3545' : '#1A1A2E',
                }}
              >
                {attention.title}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B' }}>{attention.body}</Text>
            </View>
            <View style={{ width: 24 }} />
            {glance.state === 'due' ? (
              <View style={{ position: 'absolute', top: -14, right: 8, minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 6, backgroundColor: '#DC3545', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#ffffff' }}>
                  {glance.count > 99 ? '99+' : glance.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Text style={{ marginTop: 20, fontSize: 15, color: '#475569' }}>Hi there,</Text>
          <Text style={{ marginTop: 2, fontSize: 24, fontFamily: theme.font.bold, color: '#1A1A2E' }}>
            What did you get today?
          </Text>
        </View>
      ) : phase === 'done' ? (
        <Text style={{ textAlign: 'center', marginBottom: 8, fontSize: 13, fontFamily: theme.font.semibold, color: '#1B7A3D' }}>
          {cart?.items.length || 0} item{cart?.items.length === 1 ? '' : 's'}{' '}
          {guest ? 'found. Sign up to keep them and get reminders' : 'added to your list'}
        </Text>
      ) : null}

      <View
        testID="scanner-frame"
        style={{
          marginHorizontal: 16,
          overflow: 'hidden',
          borderRadius: 24,
          backgroundColor: '#0F172A',
          ...(phase === 'capture' ? { flex: 1 } : { height: '30%', minHeight: 144 }),
        }}
      >
        {displayImage ? (
          <TaggedPhoto
            src={displayImage}
            // Once saved, the numbers have done their job: just the photo.
            items={phase === 'done' ? [] : (cart?.items ?? [])}
            activeTag={currentQuestion?.tag ?? null}
            onTagTap={phase === 'review' && !busy ? setRemovingTag : undefined}
          />
        ) : (
          <CameraViewfinder ref={viewfinder} active={phase === 'capture'} onUnavailable={() => setCameraOff(true)} />
        )}

        {phase === 'capture' ? (
          // The viewfinder window, the rest frosted so the shutter reads over any photo.
          <View pointerEvents="none" style={{ position: 'absolute', left: 14, right: 14, top: 14, bottom: 58, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} />
        ) : null}

        {phase === 'done' || (phase === 'review' && !busy) ? (
          <Pressable
            testID="scanner-retake"
            onPress={resetToCapture}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: '#ffffff' }}>
              {phase === 'done' ? 'Scan another' : 'Retake'}
            </Text>
          </Pressable>
        ) : null}

        {working ? (
          <View accessibilityLabel="Loading" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 20, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <ActivityIndicator size="large" color="#D1FF52" />
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{statusCopy(phase, error)}</Text>
            {phase !== 'saving' ? (
              <Pressable testID="scanner-cancel" onPress={resetToCapture} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: theme.font.semibold, color: 'rgba(255,255,255,0.9)' }}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {phase === 'error' ? (
          <View accessibilityRole="alert" style={{ position: 'absolute', left: 16, right: 16, top: 16, zIndex: 20, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#B42318' }}>
              {usedUp ? 'Not enough tokens' : 'Couldn’t finish the scan'}
            </Text>
            <Text style={{ marginTop: 2, fontSize: 13, color: '#475569' }}>{statusCopy(phase, error)}</Text>
            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              {!usedUp ? (
                <Pressable
                  testID="scanner-try-again"
                  onPress={() => (lastPhoto.current ? void runScan(lastPhoto.current) : resetToCapture())}
                  style={{ flex: 1, borderRadius: 999, backgroundColor: '#D1FF52', paddingVertical: 8, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontFamily: theme.font.bold, color: '#14361B' }}>Try again</Text>
                </Pressable>
              ) : null}
              <Pressable
                testID="scanner-error-second"
                onPress={usedUp ? (guest ? () => setSignup(true) : () => navigation.navigate('/tokens')) : resetToCapture}
                style={{ flex: 1, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#ffffff', paddingVertical: 8, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>
                  {usedUp ? (guest ? 'Sign up for more' : 'Get more tokens') : 'Retake photo'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {phase === 'capture' && !displayImage ? (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 10, zIndex: 10, alignItems: 'center', gap: 6 }}>
            <Pressable
              testID="scanner-shutter"
              accessibilityLabel="Take photo"
              disabled={busy}
              onPress={() => void shoot()}
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#E53935', borderWidth: 3, borderColor: 'rgba(229,57,53,0.25)' }}
            />
            <Text style={{ borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.75)', paddingHorizontal: 10, fontSize: 12.5, lineHeight: 15, color: '#1A1A2E', overflow: 'hidden' }}>
              {cameraOff ? 'Tap the shutter to pick a photo' : 'Take a clean photo showing all your groceries'}
            </Text>
          </View>
        ) : null}
      </View>

      {phase === 'review' && cart && rows.length > 0 ? (
        <ScrollView style={{ flex: 1, marginTop: 8 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 + insets.bottom, gap: 6 }}>
          {rows.map((item) => (
            <ScanItemCard
              key={item.tag}
              tag={item.tag}
              extraTags={item.tags.slice(1)}
              name={(item.label || item.suggested_label || 'Not sure yet') + (item.quantity > 1 ? ` ×${item.quantity}` : '')}
              expiresOn={item.expiry?.expires_on}
              expirySource={item.expiry?.source as ExpirySource | undefined}
              remindersEnabled={!remindersOff.includes(item.tag)}
              onToggleReminder={() =>
                guest
                  ? setSignup(true)
                  : setRemindersOff((prev) =>
                      prev.includes(item.tag) ? prev.filter((t) => t !== item.tag) : [...prev, item.tag],
                    )
              }
              onRename={(label) => void edit((s, id) => scanApi.updateItem(http, s, id, item.tag, { label }), 'Could not rename that item')}
              onAddDate={() => setPicking(item)}
              onRemove={() => setRemovingTag(item.tag)}
              onSplit={item.quantity > 1 ? () => void edit((s, id) => scanApi.split(http, s, id, item.tag), 'Could not separate that item') : undefined}
            />
          ))}
          {/* Everything is known: offer the obvious way to finish. */}
          {currentQuestion?.kind === 'review' ? (
            <Pressable
              testID="scanner-save"
              disabled={busy}
              onPress={() => void saveList()}
              style={{ marginTop: 12, borderRadius: 999, backgroundColor: '#D1FF52', paddingVertical: 10, alignItems: 'center', opacity: busy ? 0.6 : 1 }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#14361B' }}>
                {busy ? 'Saving…' : `Save ${cart.items.length} item${cart.items.length === 1 ? '' : 's'} to my list`}
              </Text>
            </Pressable>
          ) : (
            <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#64748B' }}>
              {cart.open_questions.length} item{cart.open_questions.length === 1 ? '' : 's'} still to check
            </Text>
          )}
        </ScrollView>
      ) : phase === 'capture' ? null : (
        <View style={{ flex: 1 }} />
      )}

      {notice ? (
        <Pressable onPress={() => setNotice(null)} style={{ position: 'absolute', left: 16, right: 16, bottom: 92 + insets.bottom, borderRadius: 12, backgroundColor: '#1A1A2E', padding: 10 }}>
          <Text style={{ fontSize: 13, color: '#ffffff' }}>{notice}</Text>
        </Pressable>
      ) : null}

      {/* The question lives in the bar, and becomes a text box when they'd rather type.
          Once the scan is saved there's nothing left to answer: no bar, no mic (web). */}
      {phase === 'done' ? (
        <View style={{ height: 16 + insets.bottom }} />
      ) : (
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 + insets.bottom }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderRadius: 28,
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: showQuestion ? '#EAFFB0' : '#F2F2F2',
            borderColor: showQuestion ? '#D1FF52' : 'rgba(0,0,0,0.04)',
          }}
        >
          <Image
            source={require('../../../../assets/images/natcycle-ai.png')}
            style={{ width: 32, height: 32, borderRadius: 16, alignSelf: 'flex-start', marginTop: 2, opacity: speaking ? 0.7 : 1 }}
          />
          {showQuestion ? (
            <Pressable testID="scanner-question" onPress={() => setTyping(true)} style={{ flex: 1, minWidth: 0, paddingVertical: 2 }}>
              <Text style={{ fontSize: 15, fontFamily: theme.font.medium, color: '#1A3A12' }}>{prompt.text}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, fontFamily: theme.font.medium, color: '#4A6B39' }}>
                {speaking
                  ? 'Speaking…'
                  : listening
                    ? 'Listening — go ahead'
                    : heardNothing
                      ? "I didn't hear that — tap the mic to try again"
                      : prompt.example}
              </Text>
            </Pressable>
          ) : (
            <TextInput
              testID="scanner-input"
              autoFocus={typing}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => void applyAnswer(draft)}
              returnKeyType="send"
              placeholder={phase === 'review' ? prompt.text : 'Take a photo first'}
              placeholderTextColor="#94A3B8"
              editable={!busy && phase === 'review'}
              accessibilityLabel={prompt.text}
              style={{ flex: 1, minWidth: 0, fontSize: 15, color: '#1E293B', paddingVertical: 6 }}
            />
          )}
          <Pressable
            testID="scanner-voice"
            accessibilityLabel={listening ? 'Listening — tap to stop' : 'Answer by voice'}
            disabled={busy || phase !== 'review'}
            onPress={() => {
              if (listening) {
                stopListening.current?.();
                return;
              }
              speech.stopSaying();
              setSpeaking(false);
              void listen();
            }}
            style={{
              borderRadius: 999,
              padding: 8,
              opacity: busy || phase !== 'review' ? 0.4 : 1,
              ...(listening ? { backgroundColor: '#D1FF52', borderWidth: 2, borderColor: '#B7E534' } : {}),
            }}
          >
            <VoiceBars active={listening || speaking} fast={listening} />
          </Pressable>
        </View>
      </View>
      )}

      {removingTag !== null && cart ? (
        <BottomSheet open onClose={() => setRemovingTag(null)} testID="scanner-remove">
          <View style={{ paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: '#1A1A2E' }}>
              Remove {cart.items.find((i) => i.tag === removingTag)?.label || `Item ${removingTag}`}?
            </Text>
            <Text style={{ marginTop: 2, fontSize: 13, color: '#64748B' }}>It won&apos;t be saved to your list.</Text>
            <Pressable
              testID="scanner-remove-confirm"
              disabled={busy}
              onPress={() => {
                const tag = removingTag;
                setRemovingTag(null);
                setRemindersOff((prev) => prev.filter((t) => t !== tag));
                void edit((s, id) => scanApi.removeItem(http, s, id, tag), 'Could not remove that item');
              }}
              style={{ marginTop: 16, borderRadius: 999, backgroundColor: '#D1FF52', paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#14361B' }}>Remove it</Text>
            </Pressable>
            <Pressable onPress={() => setRemovingTag(null)} style={{ marginTop: 8, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#64748B' }}>Keep it</Text>
            </Pressable>
          </View>
        </BottomSheet>
      ) : null}

      {picking ? (
        <ExpiryDatePicker
          itemName={picking.label || picking.suggested_label || `Item ${picking.tag}`}
          value={picking.expiry?.expires_on}
          saving={busy}
          onCancel={() => setPicking(null)}
          onSave={(date) => {
            const tag = picking.tag;
            setPicking(null);
            void edit((s, id) => scanApi.updateItem(http, s, id, tag, { expires_on: date }), 'Could not save that date');
          }}
        />
      ) : null}

      <GuestSignInModal
        open={signup}
        onClose={() => setSignup(false)}
        message={
          usedUp
            ? "You've used your free tokens. Sign up to get tokens every month, and reminders before anything expires."
            : 'Sign up to keep your groceries and get a reminder before anything expires.'
        }
      />
    </View>
  );
}
