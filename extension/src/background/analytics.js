/**
 * Analytics: four counters, stored locally, never sent anywhere.
 *
 * There is no network call in this file and no user, page, cart or form data is
 * recorded — only how many times each event happened on this device. Swap the
 * body of track() for a fetch() if you ever need aggregate server-side numbers,
 * and update the privacy policy and store listing when you do.
 */
const STORAGE_KEY = 'analytics';
const SETTINGS_KEY = 'settings';

export const EVENTS = ['extension_installed', 'offer_displayed', 'offer_applied', 'offer_dismissed'];

export async function isEnabled() {
  const { [SETTINGS_KEY]: settings } = await chrome.storage.local.get(SETTINGS_KEY);
  return settings?.analyticsEnabled !== false; // on unless explicitly turned off
}

export async function track(event) {
  if (!EVENTS.includes(event)) return;
  if (!(await isEnabled())) return;
  const { [STORAGE_KEY]: counts = {} } = await chrome.storage.local.get(STORAGE_KEY);
  counts[event] = (counts[event] ?? 0) + 1;
  await chrome.storage.local.set({ [STORAGE_KEY]: counts });
}

export async function getCounts() {
  const { [STORAGE_KEY]: counts = {} } = await chrome.storage.local.get(STORAGE_KEY);
  return Object.fromEntries(EVENTS.map((e) => [e, counts[e] ?? 0]));
}

export async function reset() {
  await chrome.storage.local.remove(STORAGE_KEY);
}
