/**
 * Grocery dates: how they read, how urgent they are, and turning typed or spoken dates
 * into one. Copied from web (main 964a78a) api/groceryApi.ts (parseExpiryInput and the
 * answer helpers), utils/groceryExpiry.ts and utils/groceryUrgency.ts.
 */
import { daysUntil, type ExpirySource } from "./grocery";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "3 days", "2 weeks", "1 month" — how long until a date, in round numbers. */
export function untilLabel(expiresOn: string, today = new Date()): string {
  const target = new Date(`${expiresOn.slice(0, 10)}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((target.getTime() - start.getTime()) / DAY_MS);
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 14) return `${days} days`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

/** Whole days from today to a date; negative once it has passed. */
function daysFromToday(expiresOn: string, today: Date): number {
  const target = new Date(`${expiresOn.slice(0, 10)}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / DAY_MS);
}

/** A guessed date reads "Usually expires in…"; a date we read or were told is definite. */
/**
 * The History list's wording (prototype Flow 3, "Current list"): lower case, and the
 * past said plainly — "expires in 2 days", "expired 2 days ago".
 */
export function listExpiryLine(
  expiresOn: string | null | undefined,
  source: ExpirySource | null | undefined,
  today = new Date(),
): string {
  if (!expiresOn) return "no expiry date yet";
  const days = daysFromToday(expiresOn, today);
  if (days < 0) {
    const ago = -days === 1 ? "yesterday" : `${-days} days ago`;
    return source === "shelf_life" ? `usually expired ${ago}` : `expired ${ago}`;
  }
  const line = expiryLine(expiresOn, source, today);
  return line.charAt(0).toLowerCase() + line.slice(1);
}

export function expiryLine(
  expiresOn: string | null | undefined,
  source: ExpirySource | null | undefined,
  today = new Date(),
): string {
  if (!expiresOn) return "No expiry date yet";
  // Past its date but still active (up to three days): a negative counter, "−2 days".
  const days = daysFromToday(expiresOn, today);
  if (days < 0) {
    const counter = `−${-days} day${days === -1 ? "" : "s"}`;
    return source === "shelf_life" ? `Usually expired · ${counter}` : `Expired · ${counter}`;
  }
  const until = untilLabel(expiresOn, today);
  if (source === "shelf_life") {
    return until === "today" || until === "tomorrow"
      ? `Usually expires ${until}`
      : until.endsWith("ago")
        ? `Usually expired ${until}`
        : `Usually expires in ${until}`;
  }
  if (until === "today" || until === "tomorrow") return `Expires ${until}`;
  if (until.endsWith("ago")) return `Expired ${until}`;
  return `Expires in ${until}`;
}

export type Urgency = "expired" | "critical" | "soon" | "fine";

/** Red once it's gone or goes today/tomorrow, amber within the week, plain after that. */
export function urgencyOf(
  expiresOn: string | null | undefined,
  status: string | undefined,
  today = new Date(),
): Urgency {
  // Food that ran out of time unused stays red, muted: it's the waste worth noticing.
  if (status === "expired") return "expired";
  if (!expiresOn || (status && status !== "active")) return "fine";
  const days = daysUntil(expiresOn, today);
  if (days < 0) return "expired";
  if (days <= 2) return "critical";
  if (days <= 6) return "soon";
  return "fine";
}

/**
 * History card colours (prototype Flow 3, "Current list"): red only once the date has
 * passed, peach for two days or less, pale lime after that. The reminder thumb carries a
 * deeper shade of the card. Web URGENCY_STYLES, as colours.
 */
export type UrgencyStyle = {
  card: string;
  thumb: string;
  thumbIcon: string;
  text: string;
  link: string;
  packaging: string;
  /** The quieter shade for details (web HistoryItemRow QUIET). */
  quiet: string;
};

const EXPIRED: UrgencyStyle = {
  card: "#DC3545",
  thumb: "#9F2530",
  thumbIcon: "#FAFFEF",
  text: "#FAFFEF",
  link: "#FAFFEF",
  packaging: "#FAFFEF",
  quiet: "rgba(255,255,255,0.8)",
};

const LATER: UrgencyStyle = {
  card: "#F5FFD9",
  thumb: "#BBC69E",
  thumbIcon: "#000000",
  text: "#010B02",
  link: "#198754",
  packaging: "#775319",
  quiet: "#5C6B4E",
};

export const URGENCY_STYLES: Record<Urgency, UrgencyStyle> = {
  expired: EXPIRED,
  critical: {
    card: "rgba(255,210,139,0.584)",
    thumb: "#D5A75E",
    thumbIcon: "#FAFFEF",
    text: "#010B02",
    link: "#198754",
    packaging: "#AC0056",
    quiet: "#6B5434",
  },
  soon: LATER,
  fine: LATER,
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

/** Spoken day numbers: "third of September", "twenty first". */
const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7,
  eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13,
  fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18,
  nineteenth: 19, twentieth: 20, thirtieth: 30, "twenty first": 21,
  "twenty second": 22, "twenty third": 23, "twenty fourth": 24, "twenty fifth": 25,
  "twenty sixth": 26, "twenty seventh": 27, "twenty eighth": 28, "twenty ninth": 29,
  "thirty first": 31,
};

/** A date said without a year is this year, unless it's this far past. */
const STALE_DATE_DAYS = 60;

/** Local calendar date as YYYY-MM-DD. Never via toISOString(), which is UTC and can shift the day. */
function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** A real calendar date (rejects 31 Feb), or null. */
function makeDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

function fullYear(year: number): number {
  return year < 100 ? 2000 + year : year;
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0);
}

/**
 * No year given ("15 Oct", "third of September"): this year, unless that day is more
 * than STALE_DATE_DAYS past, which means they meant next year.
 */
function withoutYear(month: number, day: number, today: Date): Date | null {
  const thisYear = makeDate(today.getFullYear(), month, day);
  if (!thisYear) return null;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysPast = Math.round((startOfToday.getTime() - thisYear.getTime()) / DAY_MS);
  return daysPast <= STALE_DATE_DAYS
    ? thisYear
    : makeDate(today.getFullYear() + 1, month, day);
}

/**
 * Parse a typed or spoken expiry into YYYY-MM-DD, reading numeric dates day-first (UK):
 * "2026-10-15", "15/10/2026", "15.10.26", "10/2026" (end of month), "15 Oct 2026",
 * "the third of September", "21st of September", "today", "tomorrow", "in 5 days".
 * Returns null when it can't tell, so the user is asked again.
 */
export function parseExpiryInput(raw: string, today: Date = new Date()): string | null {
  let text = raw
    .trim()
    .toLowerCase()
    .replace(/^(?:it\s+)?(?:expires|expiry|best before|use by|bb)\s*(?:on|is|:)?\s*/, "")
    .replace(/(\d)(?:st|nd|rd|th)\b/g, "$1")
    .replace(/[.,]$/, "")
    .trim();
  // Longest first, so "twenty first" isn't half-replaced by "first".
  const ordinals = Object.entries(ORDINALS).sort((a, b) => b[0].length - a[0].length);
  for (const [word, value] of ordinals) {
    text = text.replace(new RegExp(`\\b${word}\\b`, "g"), String(value));
  }
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return null;

  const done = (date: Date | null) => (date ? toIsoDate(date) : null);

  if (text === "today") return done(today);
  if (text === "tomorrow") {
    return done(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  }

  const relative = text.match(/^in\s+(\d+)\s+(day|week|month)s?$/);
  if (relative) {
    const n = Number(relative[1]);
    const unit = relative[2];
    return done(
      new Date(
        today.getFullYear(),
        today.getMonth() + (unit === "month" ? n : 0),
        today.getDate() + (unit === "day" ? n : unit === "week" ? n * 7 : 0),
      ),
    );
  }

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return done(makeDate(Number(iso[1]), Number(iso[2]), Number(iso[3])));

  // Day-first numeric: 15/10/2026, 15-10-26, 15.10.2026
  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (dmy) {
    return done(makeDate(fullYear(Number(dmy[3])), Number(dmy[2]), Number(dmy[1])));
  }

  // Day and month only: 15/10
  const dm = text.match(/^(\d{1,2})[/.-](\d{1,2})$/);
  if (dm) return done(withoutYear(Number(dm[2]), Number(dm[1]), today));

  // Month and year only (pack style "10/2026"): end of that month
  const monthYear = text.match(/^(\d{1,2})[/.-](\d{4})$/);
  if (monthYear) {
    const month = Number(monthYear[1]);
    return month >= 1 && month <= 12
      ? done(lastDayOfMonth(Number(monthYear[2]), month))
      : null;
  }

  // "15 oct 2026", "3 of september", "oct 15 2026", "september 3"
  const words = text
    .split(/[\s,]+/)
    .filter((w) => w && !["the", "of", "on"].includes(w));
  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;
  for (const word of words) {
    const monthKey = word.slice(0, 4) === "sept" ? "sept" : word.slice(0, 3);
    if (month === undefined && /^[a-z]+$/.test(word) && MONTHS[monthKey]) {
      month = MONTHS[monthKey];
    } else if (/^\d{4}$/.test(word)) {
      year = Number(word);
    } else if (/^\d{1,2}$/.test(word) && day === undefined) {
      day = Number(word);
    } else {
      return null; // unexpected word: don't guess
    }
  }
  if (month === undefined) return null;
  if (day === undefined) {
    // "october 2026": end of month, like printed month-only dates
    return year ? done(lastDayOfMonth(year, month)) : null;
  }
  return done(year ? makeDate(year, month, day) : withoutYear(month, day, today));
}

/**
 * A plain "yes". Answers containing a number ("yes but 3 is milk") are corrections, not
 * confirmations, so they don't count.
 */
export function isAffirmative(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    !/\d/.test(t) &&
    /^(yes|yep|yeah|yup|correct|looks good|all good|that'?s right|it is|ok|okay|fine|perfect)\b/.test(t)
  );
}

/**
 * Turn an answer to "Is item 4 canned beans?" into a name: "yes" accepts the suggestion,
 * "no, it's chickpeas" gives "chickpeas". Null when there's nothing usable.
 */
export function labelFromAnswer(text: string, suggestion: string | null): string | null {
  if (suggestion && isAffirmative(text)) return suggestion;
  let label = text.trim().replace(/[.!?]+$/, "");
  const filler = /^(?:no|nope|it'?s|it is|that'?s|that is|actually|a|an|the|some)\b[\s,]*/i;
  while (filler.test(label)) label = label.replace(filler, "");
  label = label.trim();
  return label && !isAffirmative(label) ? label : null;
}
