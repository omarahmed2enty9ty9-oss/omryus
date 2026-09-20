import { EVENTS, getCounts, reset } from '../background/analytics.js';

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
