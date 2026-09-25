import { EVENTS, getCounts, reset } from '../background/analytics.js';
import { DONATION, donationRecipient } from '../shared/brand.js';

// Named in one place (shared/brand.js) so the cause can be changed without
// hunting through copy — and left unnamed entirely until they have agreed in
// writing to be named. See DONATION.agreed.
const charityLink = document.getElementById('charity-link');
charityLink.textContent = DONATION.agreed ? DONATION.charity : 'a charity, named here once the agreement is signed';
if (DONATION.agreed) charityLink.href = DONATION.url;
else charityLink.removeAttribute('href');

// The optional "shops you visit" grant. The service worker listens for the
// permission change and re-registers the content script itself.
const SHOPS = { origins: ['https://*/*'] };
const shopsToggle = document.getElementById('shops-toggle');
const shopsState = document.getElementById('shops-state');
let shopsAllowed = false;

async function renderShops() {
  shopsAllowed = await chrome.permissions.contains(SHOPS);
  shopsToggle.textContent = shopsAllowed ? 'Stop running on new shops' : 'Allow on shops I visit';
  shopsState.textContent = shopsAllowed
    ? 'On. New partner shops start working automatically.'
    : 'Off. Omryus works on the shops it came with.';
}

// No await before request(): Chrome only allows it inside the click itself.
shopsToggle.addEventListener('click', () => {
  const change = shopsAllowed ? chrome.permissions.remove(SHOPS) : chrome.permissions.request(SHOPS);
  change.then(renderShops, renderShops);
});

renderShops();

const checkbox = document.getElementById('analytics');
const countsEl = document.getElementById('counts');

async function render() {
  const { settings } = await chrome.storage.local.get('settings');
  checkbox.checked = settings?.analyticsEnabled !== false;
  const counts = await getCounts();
  countsEl.textContent = EVENTS.map((e) => `${e}: ${counts[e]}`).join('\n');
}

checkbox.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get('settings');
  settings.analyticsEnabled = checkbox.checked;
  await chrome.storage.local.set({ settings });
});

document.getElementById('reset').addEventListener('click', async () => {
  await reset();
  render();
});

render();
