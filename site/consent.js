/**
 * Cookie consent for the impact.com tag.
 *
 * UK PECR requires consent BEFORE a non-essential tracking cookie is set, and
 * refusing has to be as easy as accepting. So the tag ships as
 * <script type="text/plain" data-consent="impact"> — present in the page source
 * (our affiliate network verifies ownership by looking for it) but inert until
 * someone says yes.
 *
 * No cookies are used to remember the choice; localStorage needs no consent
 * because it is strictly necessary to honour the preference itself.
 */
(function () {
  var KEY = 'omryus-consent';
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) { /* private mode */ }

  function activate() {
    var blocked = document.querySelectorAll('script[type="text/plain"][data-consent="impact"]');
    for (var i = 0; i < blocked.length; i++) {
      var live = document.createElement('script');
      live.text = blocked[i].textContent;
      document.head.appendChild(live);
    }
  }

  function remember(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode */ }
  }

  if (choice === 'accepted') { activate(); return; }
  if (choice === 'declined') { return; }

  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.createElement('div');
    bar.className = 'consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookies');
    bar.innerHTML =
      '<p>This site loads our affiliate network\'s tracking tag, which may set cookies. ' +
      'It verifies we own the site and credits referrals. ' +
      '<strong>The extension itself never does this</strong> — ' +
      '<a href="privacy.html#this-website">what we load and why</a>.</p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="consent-no">Decline</button>' +
      '<button type="button" class="consent-yes">Accept</button>' +
      '</div>';
    document.body.appendChild(bar);

    bar.querySelector('.consent-yes').addEventListener('click', function () {
      remember('accepted');
      activate();
      bar.remove();
    });
    bar.querySelector('.consent-no').addEventListener('click', function () {
      remember('declined');
      bar.remove();
    });
  });
})();
