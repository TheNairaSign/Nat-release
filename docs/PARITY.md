# Web parity audit

The mobile app is a rebuild of the web consumer product. Where it drifted, it
drifted because screens were written from memory instead of read off the web
source. This document is the method and the running tally.

## Method — per page, per function

For every screen, before writing any code:

1. **Read the web page on `main`** — not the working tree. `client/` currently
   sits on `feat/waste-ed-set-of-changes`, which is ~3,784 lines ahead across 28
   files including large rewrites of `WhereMapbox.tsx` and
   `DashboardActionCarousel.tsx`. Reading it gives the wrong UI.

   ```bash
   git -C ../../client worktree add --detach <dir> 964a78a
   ```

2. **Follow the imports.** A page is rarely self-contained. `WhereMapbox.tsx`
   pulls in six components *and* `services/IconEngine.tsx`, which is where all
   the marker artwork actually lives.

3. **Trace the interactions, not just the layout** — every tap, filter change,
   selection, loading state, empty state and error state.

4. **Diff the data flow.** Check which API fields the web page actually reads
   and what it derives from them, then confirm mobile reads the same ones.

5. **Write, quoting the source.** Any non-obvious constant gets the originating
   web class or line next to it.

A number in a component with no web reference beside it is a review failure.

Reference pinned at `main` @ `964a78a` (Nov 5, 2026). Earlier entries below were
written against `b627d0a`.

## Fixed

### Where — marker icons never rendered  ✅

**Symptom:** every map marker drew as a plain coloured square or circle. No
material icons anywhere on the page.

**Root cause:** the web draws markers through `services/IconEngine.tsx` — a
material registry mapping ~20 materials to a FontAwesome glyph, a colour, a
ring and a glow, with shape driven by `platformClass`. Mobile had reimplemented
only the colour half of it (`markerColorForPlace`), and `MapMarkerPin` rendered
an empty `<View>`. The app contained **no material glyphs at all** —
`shared/ui/icons/glyphs.tsx` had 18 UI icons (home, bell, search…) and not one
material icon.

**Fix:**
- `scripts/gen-material-glyphs.mjs` generates `shared/ui/icons/materialGlyphs.tsx`
  from the **exact FontAwesome 6 path data the web imports**, read out of
  `client/node_modules/react-icons`. The glyphs are not redrawn by hand — that
  is how they drifted in the first place. Re-run it if the web icon set changes.
- The four materials with no FontAwesome equivalent (tire, paint, biohazard,
  drug) ship as the same PNGs the web uses, copied to
  `assets/images/whereicon/`. Web recolours the black artwork white with a CSS
  filter; native uses `tintColor`. Biohazard deliberately keeps its black glyph,
  matching the web's `invert={false}`, because it sits on brand yellow.
- `core/where/marker-engine.ts` ports `IconEngine`'s logic: the full 20-material
  keyword table with web-exact hexes, the electronics-wins rule, platform→shape
  mapping, platform colour overrides, event variants and the inactive state.
- `MapMarkerPin` now renders the whole spec — glyph, shape, ring, glow, and the
  secondary-material badge.

**Gaps this also closed:**
- Shape came from `place.kind` (3 shapes); web derives it from `platformClass`
  (5 shapes — `pill` for mobile units and `hexagon` were both missing).
- Mobile-unit and education platform colour overrides were absent.
- The secondary-material badge was absent entirely.
- Campaign pins showed a plain colour; web shows a calendar glyph with the
  campaign's first material as the badge.
- The material keyword table was missing furniture, tire, paint, drug, hazardous
  and shoes.
- `upcoming` / `ended` event colours and the 0.55 ended-opacity were absent.

Locked by 24 tests in `core/where/__tests__/marker-engine.test.ts`.

### Dashboard — Carbon Units always read 0  ✅

**Symptom:** no CU on the dashboard. Also an empty greeting name and a
spurious verify-email prompt.

**Root cause:** `GET /profile` answers `{ data: { ...user } }`. Web unwraps
twice — axios `response.data`, then `res.data` in `Dashboard.tsx:66-67`.
`home-api.ts` parsed the **envelope** instead of its contents. Because every
field in `profileSchema` is `.optional()` and the schema is `.passthrough()`,
the parse *succeeded* with every field `undefined`, so:

- `carbonUnits` → `Number(undefined ?? 0) || 0` → **0**
- `firstName` → `undefined` → greeting rendered with no name
- `isEmailVerified` → `=== true` on `undefined` → **false** → false prompt
- `ready: true` — the failure reported success, so nothing surfaced it

`profile-api.ts` and `impact-api.ts` both unwrap correctly via
`unwrapDataObject`; only the dashboard's own module didn't. That is why CU
worked on Impact and Profile but not Home.

**Fix:** `home-api.ts` now unwraps with the same shared `unwrapDataObject`
helper. Locked by 5 tests in `features/home/__tests__/home-api.test.ts`.

### Impact — breakdown cards had no icons and wrong alignment  ✅

**Symptom:** breakdown cards looked flat and misaligned against web.

**Root cause:** the inline card in `ImpactScreen.tsx` omitted three things from
`client/src/pages/dashboard/components/ImpactBreakdownCard.tsx`:

- **no material icon** — web shows a 20px slate-600 glyph top-right, with
  amber `#B45309` for biohazard and pink `#FF9A9A` for capsules
- **no `justify-between`** on the card, so content bunched at the top instead
  of spreading over the 100px min-height
- the **CU pill sat on its own line, left-aligned**; web puts it at the *right
  end of the quantity row* (`flex items-end justify-between`)
- label was semibold; web is `text-sm font-normal`
- quantity was one plain string; web is 18px bold + a 14px slate-700 unit

**Fix:** extracted `features/impact/ui/ImpactBreakdownCard.tsx` as a faithful
port. Its icon table is `breakdownIcon()` in `core/impact`, transcribed from
`getMaterialIcon` — deliberately **separate** from the Where marker table,
because web picks different glyphs there (FaBox vs FaBoxOpen for aluminium).
Locked by 22 tests.

**Layout note that matters for every remaining page:** `Impact.tsx` ships two
layouts — `lg:hidden` (lines 142-279) is the **mobile** one and `hidden
lg:block` (280+) is desktop. Compare against the `lg:hidden` block. The desktop
block uses different copy for the same tiles ("Drop-offs"/"Events"/"Carbon
Units" vs mobile's "drop-off"/"events"/"CU"), so reading the wrong branch
silently produces the wrong UI.

### Impact — Green Commits card was missing most of its controls  ✅

Compared against `ImpactGreenCommitsCard.tsx`. The inline version had the right
heat colours (`#B8F27A` / `#7BC94A` / `#1B5E20`) but was missing:

- the **month/year view toggle** and the **‹ › period stepper**, with `goNext`
  clamped so you cannot page past the current month/year
- the **"CU Goal" caption** and the **0 / 365 axis labels**
- the **active-day count rendered inside the progress fill** (11px bold white,
  right-aligned), plus web's `min-w-[2rem]` and 8% minimum fill width
- a real **7-row week grid**. The old grid used `flexWrap`, which reflowed the
  year into an arbitrary block instead of GitHub-style week columns.
- the **tap tooltip** showing the full date and drop-off count

`yearHeatRows` / `monthHeatWeeks` / `canGoNext` now live in `core/impact`,
replicating web's padding algorithm (pad back to Sunday, forward to a whole
week, deal with `rows[index % 7]`). Locked by 11 tests.

### AI landing — wrong section order, no icons, no logo  ✅

Compared against `ai/AiPage.tsx`:

- **Section order was wrong.** Mobile put the greeting and "Chat history" near
  the top; web places them at the **bottom, directly above the composer**,
  after the capability tiles and suggestion carousel.
- **A stray "Quick knowledge" section heading.** Web has no such heading —
  "Quick knowledge" is only the footer *inside* each suggestion card, so it was
  being shown twice.
- **Capability tiles had no icons.** Web renders Feather `FiMapPin` /
  `FiCalendar` / `FiTrendingUp` at 22px slate-500 above each label. Added as
  `shared/ui/icons/featherGlyphs.tsx`, geometry taken from `react-icons/fi`
  rather than redrawn.
- **No AI logo.** Web shows `natcycleAI.png` in a 68px circle; mobile drew a
  lime circle with the text "Diva" in it. Real asset now copied in.
- **No Beta chip.** Web has a 10px uppercase slate-500-on-slate-100 rounded
  badge beside a 1.85rem bold "Diva"; mobile had plain muted text at body size.
- Suggestion cards were a fixed 230px; web is `w-[72%]` of the viewport with a
  116px min-height, 15px semibold text clamped to 3 lines. Loading skeletons
  (2 pulsing cards) were absent.

### AI chat — assistant replies lost their structure  ✅

Web runs replies through `formatAiText` (`AiChat.tsx:714-735`), which splits on
newlines and bolds heading lines — those matching `/^method\s*\d+/i` or ending
in "(default option)" / "(only if safe)" — in `#111111` with `mt-4`, body lines
in `#333333`, and emits `&nbsp;` for blank lines so paragraph spacing survives.

Mobile rendered the entire reply as one flat `#333333` string, so every heading
and blank line disappeared. Added `formatAiLines` in `core/ai`, locked by 5
tests. Also corrected the assistant bubble width from 92% to web's 88%.

### Impact — Action Map drew every site as the same dot  ✅

Compared against `ImpactActionMapCard.tsx`:

- **Circles were a fixed 16px.** Web scales them 12→52px on a sqrt curve
  against the busiest point (`circleSize`), so a site with 40 drop-offs read
  identically to one with a single drop-off.
- **No aggregation.** Web collapses activities onto a shared coordinate
  (rounded to 4dp) and sums their quantity; mobile emitted one marker per
  activity, so repeat visits overprinted as identical dots.
- **The caption was pinned bottom-left as bare text.** Web centres it in a
  translucent white pill (`bottom-4 left-0 right-0 text-center`,
  `bg-white/80 rounded-full px-3 py-1`).
- **Caption logic was wrong.** Web shows the site's own name when there is
  exactly one point, "Your activity" for several, and "Loading…" while
  fetching. Mobile only ever said "Your activity" or "No drops yet".
- Marker styling lacked web's `opacity-90`, 2px white border and shadow; the
  card lacked its `border-slate-200/80`; the user-location dot was disabled.
- View was hard-pinned to zoom 10 on the first marker. Web fits the bounding
  box, so `actionMapZoom` now ports its span ladder.

Logic lives in `core/impact` (`actionMapPoints`, `actionMapCircleSize`,
`actionMapZoom`, `actionMapLabel`). Locked by 11 tests.

### AI chat — header, welcome state and typing indicator  ✅

- **Header had no AI logo.** Web shows `natcycleAI.png` at 36px. "Diva" was
  20px; web is 17px. Beta was plain muted text; web is a 9px uppercase
  slate-500-on-slate-100 chip. The subtitle sat *below* the title; web places
  it beside on a baseline row.
- **"Clear chat" was a text button**; web uses a `MoreVertical` icon button
  (geometry taken from lucide-react, not redrawn).
- **The welcome block was left-aligned and had no logo.** Web centres the whole
  thing behind a 64px logo, with an 18px heading, a 280px-max slate-500 blurb
  and centre-justified chips at `text-sm font-semibold`.
- **No typing indicator in the thread.** Web bounces three slate-300 dots
  (`AiChat.tsx:966-971`) *as well as* flipping the header subtitle; mobile only
  did the latter, so a pending reply was nearly invisible. Added `TypingDots`.

Two notes for whoever picks this up: `TypingDots` deliberately uses RN's
`Animated` rather than Reanimated, because Reanimated's worklets runtime is not
available under Jest and importing it breaks the chat tests. And the React
Compiler lint (enabled via `experiments.reactCompiler`) rejects reading
`ref.current` during render — use a lazy `useState` to hold an `Animated.Value`.

### AI chat — composer and in-message buttons  ✅

- **Composer had no AI logo.** Web puts a 32px `natcycleAI.png` inside the
  `rounded-full bg-[#F3F3F3]` pill.
- **Send was a dark "Send" pill.** Web is a **paper-plane icon button** that is
  slate-300 at 30% opacity while empty and brand green (`#0A5A14`,
  `AI_CHAT_THEME.greenDark`) once there is something to send.
- **Input was single-line.** Web is a growing textarea, 36px → 112px
  (`min-h-[36px] max-h-28`).
- **Tool buttons stacked one per line.** Web lays them out in a wrapping row
  (`flex flex-wrap gap-2.5`) and pads them `px-5 py-2.5` at `text-sm
  font-semibold`; mobile used 14/8 with small text.
- Option chips were 12/8 with small text; web is `px-4 py-2.5 text-sm
  font-semibold` with `mt-3`.

**Not ported — needs a model change first.** Web tracks
`msg.completedActionIds` and renders a finished action as plain text with a
small green dot instead of a button, and flags ThingsMatch actions
(`action.isTm`) with an inverted TM logo. `AiTool` on mobile is only
`{ label, href }` and `AiMessage` has no completed-action list, so neither can
be represented yet.

### Where — top panel carousel did not snap or fit  ✅

Compared against `MapTopPanel.tsx` + `SnapCardCarousel.tsx`:

- **The two cards were different fixed widths** — 320px for Points, 280px for
  Events. Web makes both `w-[92%]` of the container, so on mobile they lined up
  with neither each other nor the screen edge, and the fixed sizes drifted
  further off on wider phones.
- **No snapping.** Web is `snap-x snap-mandatory snap-center`; the mobile
  ScrollView free-scrolled, so it could rest half-way between the two cards.
- **No inactive scaling.** Web shrinks the non-active card to `scale-[0.92]`.
- **No left padding / peek.** Web pads `pl-[3%]` and `pr-[3%]` so the next card
  peeks; mobile had `paddingRight: 12` only.
- The carousel did not follow `focus` when it changed from elsewhere in the
  screen; web drives it from `activeIndex`.

### Where — location sheet had no branch selection  ✅

Compared against the sheet in `WhereMapbox.tsx:2515-2710`:

- **Branches were a flat list of muted text.** Web renders a collapsible
  "Branches (N)" toggle whose rows are **tappable**: choosing one re-centres the
  map on that branch and swaps the sheet's address / phone / who-can-drop-off
  to it (`selectedExtraLocationIndex`). Selected rows are
  `bg-[#D1FF52]/45 border-[#B8E83A]`; unavailable branches grey out with an
  "Unavailable" tag. None of that existed — a multi-branch location was
  effectively unusable on mobile.
- **No image thumbnails.** Web shows up to three 48px tiles plus a `+N`
  overflow tile. Mobile only rendered a header image, and only for campaigns.
- **Title size varied by kind** (18 or 20px). Web is a constant
  `text-[1.35rem]` (~22px) with `leading-tight` for every kind.
- **Chip colours were wrong** — white-70% with the legacy border, against web's
  `bg-slate-100` / `border-slate-200/80` / `text-slate-700`.

Branch focus is plumbed through `WhereScreen` as `branchFocus`, which takes
priority over the selected place when deriving the camera, and is cleared
whenever a different place is picked.

**Known gap:** web prefers the *selected branch's own* images for the
thumbnail strip. `WhereBranch` in `core/where` carries no `images` field, so
the API mapping needs extending before that can be honoured; the sheet falls
back to the location's images.

### Where — search results showed the raw `kind` enum  ✅

Compared against `LocationSearchBar.tsx` (`LocationSearchPanel`):

- **`place.tag ?? place.kind` rendered the enum straight into the UI**, so
  results literally read "regular" / "simple" / "campaign". Web maps these
  through `getLocationTypeLabel`: regular → "Center", campaign → "Event",
  simple → its display tag or "Drop-off". Ported as `searchTypeLabel` in
  `core/where` and locked by tests that assert the raw enum can never surface.
- **No distance on results.** Web shows `formatDistance(result.distanceKm)`
  right-aligned in the title row. `formatDistanceKm` and `haversineKm` already
  existed in `core/where` — the map origin just was not threaded through, so
  it now flows `WhereScreen → MapTopPanel → MapSearchPanel`.
- **Rows were two lines of plain text.** Web has a 32px slate-100 avatar with a
  pin glyph, the name, a `text-[10px]` type chip, the distance, and an address
  row with its own small pin icon.

**Not ported:** web also groups matches into **Organizations** (with a
"{N} locations" subtitle) and **Materials** sections above the results. Mobile's
search returns a flat `WherePlace[]` from `searchPlaces`, with no org/material
aggregation, so those sections need a data change first.

### Where — campaign card phase treatment  ✅

Web renders campaigns through a *separate* component (`CampaignDetailsCard`),
not the location sheet — which is why the two look different:

- **The phase badge belongs on the image.** Web pins it bottom-left over a
  `from-black/45` scrim, coloured per phase (emerald-600 / `#F5D74D` /
  gray-500). Mobile always showed the phase as an eyebrow above the title; web
  only does that when the campaign has **no** image.
- **No scrim over the header image**, so light photos washed out any overlay.
- **Ended campaigns** dim the image to 80% and drop the title to `text-gray-600`.
- **Title size**: `CampaignDetailsCard` uses `text-base` (16px) while the
  simple/regular sheet uses `text-[1.35rem]` (~22px). An earlier pass in this
  audit set a single 22px for both — corrected here.

The full `PHASE_UI` table (card wash, badge, title colour per phase) is now
transcribed rather than partially guessed.

### Home — audited, and the CU fix repaired two stuck banners

`Dashboard.tsx` also splits mobile (`lg:hidden`, lines 245-314) from desktop
(`hidden lg:grid`, 315+). Audited against the **mobile** block.

Home turned out to be the most faithful screen in the app — every measurement
below was already exact, so nothing was changed:

- Green Impact card: `rounded-[24px]`, 14/14/16 padding, 120px watermark, the
  28px meter with 8.61×14 segments, `#D4FF4F` track / `#B8E83A` ticks, and the
  24px `CountUp` with its underlined "Carbon Units" label.
- Dispose card: `mb-14` spacing with the half-width "Find where" button
  overhanging the card bottom (`bottom-0 translate-y-1/2`, 28px shift),
  right-aligned, `opacity-50` when no material is chosen.
- Chips: `py-2.5 px-5`, 14px bold, `#1A1A1A` active on `#BDE047`/70 idle, with
  the same `["Food", "Plastic bottle", "Fabrics"]` fallback.
- AiDash: the divider row, "Open chat" pill, 230px cards on
  `#E3F2FD` / `#FFECB3` / green-50 / purple-50 with matching 100-level borders,
  and the 10px uppercase "Quick knowledge" footer.
- Greeting, and both notice banners' copy and action labels.

**Worth knowing:** the `home-api` envelope bug fixed earlier also had both
notice banners permanently stuck open. With the profile parsing the envelope,
`isEmailVerified` resolved to `false` and `phoneNumber` to `null` while
`ready` still reported `true` — so **every user saw "Verify your email" and
"Complete your profile" regardless of their actual account state**. One
one-line fix, three symptoms.

### Profile — audited, one size drift  ✅

Single layout on web (no `lg:` split). Activity rows, subtitles, hrefs and
highlight flags all matched, as did the NatPoints derivation
(`pointsEarned || point`), `cuSaved` to 1dp, the `#B8E83A` 22px tile icons, and
the logout row's red-50 well / red-500 text / red-300 chevron.

Only fix: the two stat tiles rendered at 22px where web uses `text-2xl` (24px).

**Deliberate mobile addition, worth confirming:** RN adds a **Notifications**
row under Account Settings. Web's Profile has only "Update Profile" and
"Logout" there. Push settings have no web equivalent, so this looks intentional
rather than drift — flagging rather than removing.

### Campaigns — cards were missing most of their content  ✅

RN was 103 lines against web's 449. Compared against `CampaignsPage.tsx`
(mobile branches — the page splits at lines 262/282/285/293/336):

- **No material icon on the card.** Web overlays one at `top-2 left-2` on a
  white disc. This is the **fourth** distinct place icons were missing, and a
  **third distinct material→icon table**: it uses `MdForest` for paper and
  `FaWineBottle` for glass, where the Where markers use `FaFile`/`FaGlassWater`
  and the Impact breakdown uses yet another set. Ported as
  `campaignMaterialIcon` and kept deliberately separate; a test asserts the
  divergence so nobody "helpfully" merges them.
- **"Urgent" was plain red text in the card body.** Web is a `bg-red-100 /
  text-red-800` pill overlaid at `top-2 right-2` on the image.
- **No material chip** beside the title (`bg-gray-100` rounded pill).
- **No "Progress / N%" caption row** above the progress bar.
- **Ends-date and "View →" were stacked**; web puts them on one
  `justify-between` row.
- Title had no size or line clamp; web is `text-lg leading-snug line-clamp-2`.
- Bar colours were theme tokens rather than web's `#E5E7EB` track / `#204C27`
  fill.
- **The material filter row did not exist at all**, nor the "Clear filters"
  action in the empty state — even though `filterCampaigns` was already sitting
  in `core/campaigns`, unused. Both are now wired, with the chip list derived
  from the material types actually present.

Two Material Design glyphs (`MdCheckroom`, `MdForest`) needed care: react-icons
ships them with a leading `fill="none"` bounding-box path, which paints a solid
square if you fill it blindly. The generator skips those.

## Verified correct (no change needed)

- Where filter set — `all` / `static` / `simple` / `mobile` with labels
  "All locations", "Facilities", "Static drop-offs", "Waste events" matches
  `MapTopPanel.tsx:135-138` exactly.
- Impact stat pill — values, the "drop-off"/"events"/"CU" labels and the
  `/dropoff/all` + `/campaigns` links match the mobile block exactly; CU is
  correctly non-tappable.
- `impactStats` counting — campaign vs location drop-offs matches
  `Impact.tsx:110-119`.
- Impact CU value — sourced through `impact-api`, which unwraps the envelope
  correctly; unaffected by the dashboard bug above.
- Green Commits heat colours and the 0 / 1 / 2-3 / 4+ level thresholds.
- AI capability prompts and the suggestion card palette
  (`#D6EBFF` / `#FFE4C4` / `#E8F5E9` / `#F3E5F5`).
- AI chat user bubble: `#F3F3F3`, 22px radius, 15px text.
- AI chat subtitle copy — "Your Diversion assistant" / "Typing…" matches
  `AiChat.tsx:771`.
- Impact Action Map dot colour `#1B5E20` and the 440px card height.
- Where top-panel copy and palette — "Diversion Points" / "Where to drop-off,
  recycle and more" / "Diversion Events" / "Campaigns and pop-up collections",
  and the `#E8F9E4` / `#D6E6FF` card washes, all match.
- Where search and filter buttons — 36px circles, `#1A1A1A` active state,
  14px glyphs.
- `eventsLabel` pluralisation matches `MapTopPanel.tsx:527-529`.
- Where search bar chrome — pill input, "Search…" placeholder, Cancel button,
  the helper sentence, and the "Results (N)" / "Nearby (closest first)"
  headings all match.
- Campaign phase labels and card washes — "Diversion event" / "Upcoming event"
  / "Ended event" on `#E8F9E4` / `#FFF9E8` / `#F3F4F6`.

### Campaign details, Contributions, Log drop-off  ✅

**Campaign details** — the progress block was rearranged: web puts "Campaign
Progress" and the percentage on one `justify-between` row *above* an `h-3` bar,
with a **Goal / Current row beneath it** that mobile did not have at all. The
percentage was rendered under the bar instead. The **"About this Campaign"
heading was missing** entirely, and section headings were body-sized where web
uses `text-lg`.

**Material contributions** — header and "Your Contributions" were 22px / body
where web's mobile branch uses `text-lg` (18px) bold, and the empty state used
curly quotes where web emits `&quot;` (straight).

**Log drop-off** — the flow and steps were all present but **none of the step
headings were**. Added web's `SectionTitle` equivalent: "What kind of
drop-off?", "Choose a location" / "Choose an event" with their hints
("Search or pick from the list" / "Includes ended events you can still log"),
and the **"Selected location" confirmation card** with its clear action. Also
added the **"No events found."** empty state and its "log a static drop-off
instead" escape, which web offers when a user picks Events and there are none.

**Create drop-off** — added the "Photo added. Retake or upload another." hint
that appears once proof is captured.

### Verified faithful, no change needed

- **Notifications** — title, card layout, `toDateString()` formatting and the
  "No notifications" empty state all match.
- **Rewards** — "Keep Collecting (N)", the three distinct empty-state titles and
  bodies, and the affordable / keep-collecting grouping are all correctly in
  `core/rewards`.

### Auth screens — the best-ported area  ✅

All five audited. Copy lives in `shared/i18n/en.ts` and matches web **word for
word**: "Welcome back", "Email *" / "Password *", "Forgot password?",
"Browse as Guest", "Signing in…", "Don't have an account?",
"Open ThingsMatch App", and every Signup validation message
("First name can only contain letters", "Password must contain uppercase,
lowercase, and number", "You must be at least 13 years old to create an
account", …).

Layout constants are exact too: 152px logo (`w-[9.5rem]`), illustration at
`min(24vh, 128)`, 28px illustration margin (`mb-7`), and the 0.15 top ratio
(`paddingTop: 15vh`).

**One real gap, fixed:** an invalid or expired reset link **redirected silently**.
Web toasts "Invalid reset link" / "Invalid or expired reset link" before
navigating to forgot-password. Mobile has no toast port, so the reason now
travels as `?notice=` and forgot-password seeds it into its existing inline
message. The existing test asserting the bare redirect was updated to the new
contract.

### Drop-off history — status was invisible  ✅

Web colour-codes a `Status: {status}` line on every row
(`UserDropOffs.tsx:409-418`): Approved/Verified green-600, Pending orange-500,
everything else red-500. **Mobile rendered no status at all**, so a rejected
drop-off looked identical to an approved one. Added via `dropoffStatusColor`
in `core/dropoff`, locked by 4 tests including the case-sensitivity web relies
on.

Month navigation, the empty state and the share action were already correct.

### Guest mode — verified faithful

Both guest routes exist (`/guest/dashboard`, `/guest/where`), matching web's
`/guest/*` namespace, and the guest sign-in prompt copy is identical.

## Create drop-off — the earlier "divergence" was wrong

An earlier pass in this audit flagged Create drop-off as structurally divergent,
on the basis that web's `RegularDropoffContainer` leads with an item-type
selector. **That was a mistake.** `RegularDropoffContainer` is dead code — it is
only re-exported from `components/containers/index.ts` and never rendered.

Web's live flow is `CreateDropOff.tsx` → `CreateDropOffRefactored`:

    DropoffModeSelector (Static drop-off | Event)
      → location / campaign list
      → quantity section
      → CameraMediaSection + SubmitButton   (once something is selected)

which is the same shape mobile already had. The mode selector matches too:
`bg-gray-50` container with a `border-gray-200` hairline, `px-3 py-1.5
rounded-md text-xs font-medium` buttons, and the description line beneath
("Bins, boxes & partner sites" / "Campaigns & timed events").

**Real bug found here:** the active mode button, the Find-locations button, the
submit button and one label all used `#1e2937` — a transposition of web's
`bg-slate-800` (`#1e293b`); it is not gray-800 (`#1f2937`) either. Fixed at the
token (`slateCta`) so all four corrected at once.

## Backend-confirmed model changes  ✅

Checked against `server/src/models` before implementing:

- **Per-branch images** — `simpleDropOffLocationModel.extraLocations[].images`
  and `unifiedLocationModel.extraLocations[].images` both exist as
  `{ public_id, url }`. The API was already returning them; only the client
  mapper dropped the field. `WhereBranch` now carries `images`, `branchesOf`
  maps it, and the location sheet prefers the selected branch's photos over the
  parent's — matching web.
- **Where search Organizations / Materials sections** — no endpoint needed.
  Web's `useLocationSearch` derives organisations **client-side** by grouping
  the already-loaded places on `organizationName` and counting them, and filters
  material types by substring. Ported as `searchOrganizations` /
  `searchMaterialTypes` in `core/where` and rendered above the results with the
  same `HiOfficeBuilding` / `FiPackage` icons, "{N} location(s)" subtitle and
  slate-100 icon wells.

Still client-only and unimplemented: the AI chat completed-action state and the
ThingsMatch action badge, which need `AiMessage`/`AiTool` to grow fields.

## One dispose-chip source (Home + Where)

Web builds the homepage dispose row and the Where material row from a single
helper, `client/src/utils/disposeMaterialChips.ts`, so the two rows always carry
the same labels in the same order — NatCycle `/materials/primary-types` merged
with the ThingsMatch categories, sorted by `createdAt`.

Mobile had two implementations: Home merged both sources, Where fetched only
`/materials/primary-types`. Every ThingsMatch category the homepage offered —
books, clothes, shoes, electronics — was missing from the map's chip row.

`src/shared/api/dispose-chips.ts` is now the single source, mirroring the web
util, and both features call it. It lives in `shared/` rather than in one
feature so the other does not have to reach across the feature boundary.

Checked against the live guest dashboard, which renders
`Plastic · Paper · Fabrics · Books · Clothes · Shoes`.

## Material matching is by name, not by synonym family

Both codebases dropped the alias tables (`plastic` ⊃ PET/HDPE, `metal` ⊃
aluminium, `ewaste` ⊃ battery). `toCanonicalMaterialId` is now just
normalisation, and a location matches a chip only when it lists that exact name,
case-insensitively. A chip for a material added in the admin portal — Paint,
Battery — therefore works with no code change, which was the point.

Guest copy is `Register to start saving Carbon Units`: no trailing `!`, and not
the older "and earn rewards!".

## Running the app on web

`@rnmapbox/maps` is the only dependency in `src/` with no web implementation,
and it is imported in exactly one file. `src/shared/ui/maps/WhereMap.web.tsx`
now provides a stand-in so `expo start --web` builds and every screen renders.

It lists markers instead of plotting them — a **preview aid, not a port**. The
surrounding Where chrome can be reviewed in a browser; the map itself still has
to be checked on a device.

## Not visually verified

Everything in this document was established by reading the web source and the
mobile source side by side. **No screen here has been checked against a running
build.** Source parity catches missing elements, wrong values and wrong logic;
it does not prove the rendered result matches. Font metrics, flex overflow,
safe-area insets and real API payloads can all still differ. A visual pass
against a dev build is the remaining verification step.

## Still to audit

Only **Create drop-off** remains (see the structural divergence above) — it
needs a product decision, not a styling fix. After that, the visual pass
against a running build.

## Nov 2026 catch-up: Phase 0 and Phase 1

Web shipped ~56 releases between Oct 13 and Nov 5. Phase 0 (plumbing) and Phase 1 (the
screens mobile already had) were brought to web `964a78a`:

- **Plumbing:** guest device id (`x-guest-id`), AI token types and the used-up 429 as
  its own error, and `divaOrigin` so DiVA meters mobile questions (it picks the backend
  from `Origin`; a native app may set it).
- **Profile:** CU card with "used/total TK used"; loads in one go behind a skeleton;
  Rewards and NatPoints removed. New **AI tokens** page (no buying: the stores require
  their own payments for digital goods, so it reads "open soon").
- **DiVA:** opens straight into the chat; questions metered; "−20 TK" under replies;
  out-of-tokens message and link; advice card with nearest drop-offs and events; recipe
  card with star rating; turn-on-location prompt; reply images; food-card opening.
- **Impact:** home diversion in the pill and the breakdown; web's pale cards in two
  sideways rows; layout per HOME – 45.
- **Events:** "Events" wording; cards and View on map open the Where map; no progress
  bar without a goal.
- **Where:** events within 15 miles; I'll attend; event phone and payment note;
  `?focus=events`, `?eventId=`, `?materialType=`; coverage notice; miles.
- **Home:** the Nov 2 prototype: 23-stick meter, action carousel (material and food
  cards), apps row with the Where tile, ask Diva.

### Phase 2 (Nov 6)

- **Development build:** camera, speech recognition and audio (`expo-camera`,
  `expo-speech-recognition`, `expo-audio`, `expo-dev-client`). Run with `pnpm start:dev`
  on a dev build; Expo Go can't do speech or the live viewfinder.
- **Voice input** on Home's ask Diva, the grocery DiVA bar, the scanner and SnapDivert.
- **Waste Apps** page; Impact's "home diversion" opens it.
- **Grocery Manager:** History (30-day summary, Make a recipe, Expiring / History tabs,
  swipe to settle with Undo, item sheet, how-many, expiry date picker, DiVA bar) and the
  scanner (photo → Cloudinary → ML cart → DiVA asks aloud and listens → saved list with
  reminders). Profile's "My Grocery", Home's tiles and the food card open them.
- **SnapDivert** and its History; guests snap without keeping anything.
- **Coverage notice** has its "Open Grocery Manager" button again.

### Done since (Nov 6, later)

- Guest DiVA chat with 3 free questions; the scanner's own voice; pinch to zoom in both
  viewfinders; Where's dots when zoomed out and framing of events within 15 miles.

### Deferred, on purpose

- **Web's unlinked `/my-grocery` page**: nothing links to it on web.
- **Buying tokens or tiers:** in-app purchases (Apple / Google), not Stripe, if offered.

## Nov 24 catch-up: web `main` @ `cd343da`

The web fixes from the Nov 16 and Nov 18 meetings, brought across:

- **Where:** every quick drop-off point loads (2000, not the nearest 50). With a material
  picked, ended events no longer count toward "N events nearby take …". The event card
  collapses to its name, when and buttons (chevron beside the ✕), its buttons stay pinned
  under the scrolling details, and it never grows taller than the screen above the tab bar.
- **Grocery Manager, history:** web's new Last 30 days card (diverted share left in green,
  landfilled right in red, split bar). A third tab, **Recipes**, with a count: every recipe
  DiVA made, as cards, newest first. "Make a recipe →" opens a sheet (DiVA's ideas, pick
  one, the recipe is written and saved to the grocery chat) instead of going to DiVA; the
  new card lights up in Recipes. Share on every recipe card (the phone's share sheet). The
  DiVA bar, the bag illustration and the header's Recipes link are gone.
- **Grocery Manager, scanner:** no question bar or mic once the scan is saved. Plain BETA
  beside the name instead of the leaf. Results checked every 2.5 s at most.
- **Big carts (mobile's own bug):** a photo picked from the gallery was never scaled down
  (no size was passed to `preparePhoto`), so the full camera file went up. It's now scaled to
  1600 px like a capture, at web's 0.85 JPEG quality. SnapDivert had the same bug; fixed too.

Not ported, on purpose: web's sign-up change (Google/Apple above the form), because mobile
has no social sign-in yet; and the admin-only tools (merge duplicates, bulk uploads).
