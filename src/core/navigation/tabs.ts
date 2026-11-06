export const CONSUMER_TAB_IDS = ['home', 'impact', 'where', 'you'] as const;

export type ConsumerTabId = (typeof CONSUMER_TAB_IDS)[number];

export type ConsumerTab = {
  id: ConsumerTabId;
  name: string;
  appHref: string;
  guestHref: string | null;
  matchPaths: readonly string[];
};

export const CONSUMER_TABS: readonly ConsumerTab[] = [
  {
    id: 'home',
    name: 'Home',
    appHref: '/home',
    guestHref: '/guest/dashboard',
    matchPaths: ['/', '/home', '/guest/dashboard'],
  },
  {
    id: 'impact',
    name: 'Impact',
    appHref: '/impact',
    guestHref: null,
    matchPaths: ['/impact', '/material-contributions'],
  },
  {
    id: 'where',
    name: 'Where',
    appHref: '/where',
    guestHref: '/guest/where',
    matchPaths: ['/where', '/guest/where'],
  },
  {
    id: 'you',
    name: 'You',
    appHref: '/profile',
    guestHref: null,
    matchPaths: ['/profile'],
  },
];

export function tabById(id: ConsumerTabId): ConsumerTab {
  const tab = CONSUMER_TABS.find((item) => item.id === id);
  if (!tab) {
    throw new Error(`Unknown tab: ${id}`);
  }
  return tab;
}

export function isTabLocked(id: ConsumerTabId, guest: boolean): boolean {
  return guest && tabById(id).guestHref === null;
}

export function hrefForTab(id: ConsumerTabId, guest: boolean): string | null {
  const tab = tabById(id);
  return guest ? tab.guestHref : tab.appHref;
}

export function tabIdFromPath(pathname: string): ConsumerTabId {
  if (
    pathname.startsWith('/impact') ||
    pathname.startsWith('/material-contributions')
  )
    return 'impact';
  if (pathname.includes('/where')) return 'where';
  if (pathname.startsWith('/profile')) return 'you';
  return 'home';
}

export function isWherePath(pathname: string): boolean {
  return pathname.includes('/where');
}

export function isAiPath(pathname: string): boolean {
  return pathname.startsWith('/ai') || pathname.includes('/ai');
}

const GROCERY_PATHS = [
  '/ai/grocery',
  '/grocery',
  '/my-grocery',
  '/snapdivert',
  '/guest/ai/grocery',
  '/guest/snapdivert',
];

/**
 * The waste mini apps (Grocery Manager, My Grocery, SnapDivert): they bring their own
 * header and hide NatCycle's header and tab bar (web utils/groceryApp isGroceryAppPath).
 */
export function isGroceryAppPath(pathname: string): boolean {
  return GROCERY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** The Waste Apps page draws its own header, as the prototype does. */
export function isWasteAppsPath(pathname: string): boolean {
  return /^(\/guest)?\/waste-apps$/.test(pathname);
}

export function hidesConsumerChrome(pathname: string): boolean {
  return pathname.includes('verify-email') || pathname.includes('sign-in');
}
