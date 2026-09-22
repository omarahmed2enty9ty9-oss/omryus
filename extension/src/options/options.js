import { EVENTS, getCounts, reset } from '../background/analytics.js';
import { DONATION, donationRecipient } from '../shared/brand.js';

// Named in one place (shared/brand.js) so the cause can be changed without
// hunting through copy — and left unnamed entirely until they have agreed in
// writing to be named. See DONATION.agreed.
const charityLink = document.getElementById('charity-link');
charityLink.textContent = DONATION.agreed ? DONATION.charity : 'a charity, named here once the agreement is signed';
if (DONATION.agreed) charityLink.href = DONATION.url;
else charityLink.removeAttribute('href');

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
