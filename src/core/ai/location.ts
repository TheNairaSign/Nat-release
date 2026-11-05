/**
 * Questions that can't be answered well without knowing where the person is: "near me",
 * "closest", "in my area", "where can I take…". Deliberately narrow, so ordinary
 * questions never trigger a permission prompt. Web utils/locationAccess.ts NEEDS_LOCATION.
 */
const NEEDS_LOCATION =
  /\b(near\s?me|nearby|nearest|closest|close\s+(to\s+me|by)|around\s+(me|here)|in\s+my\s+(area|city|town|neighbou?rhood)|near\s+my\s+\w+|where\s+(can|do|should)\s+i\s+(take|drop|recycle|donate|dispose|find|bring|compost))\b/i;

export function needsLocation(question: string): boolean {
  return NEEDS_LOCATION.test(question);
}
