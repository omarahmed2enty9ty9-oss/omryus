/**
 * Finding the coupon box.
 *
 * Two problems to solve: the box may be inside a shadow root (web components),
 * and on many checkouts it does not exist yet when the page first loads.
 */

/** Fields we must never, ever write into, whatever a selector says. */
const FORBIDDEN_TYPES = ['password', 'hidden', 'email', 'tel', 'file'];

function isUsableField(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') return false;
  if (el.disabled || el.readOnly) return false;
  if (tag === 'input' && FORBIDDEN_TYPES.includes((el.type || '').toLowerCase())) return false;
  // A credit-card field can carry an innocent-looking name; autocomplete is the giveaway.
  if ((el.autocomplete || '').startsWith('cc-')) return false;
  return true;
}

/**
 * querySelector that also descends into open shadow roots.
 * Closed shadow roots are unreachable by design — we report "not found" rather
 * than trying to break into them.
 * @param {string[]} selectors
 * @param {Document|ShadowRoot|Element} root
 * @returns {HTMLInputElement|HTMLTextAreaElement|null}
 */
export function queryDeep(selectors, root = document) {
  for (const selector of selectors) {
    let matches;
    try {
      matches = root.querySelectorAll(selector);
    } catch {
      continue; // a malformed selector in offer data must not break the rest
    }
    for (const el of matches) if (isUsableField(el)) return el;
  }
  // Nothing at this level — look inside any open shadow roots below us.
  for (const el of root.querySelectorAll('*')) {
    if (el.shadowRoot) {
      const found = queryDeep(selectors, el.shadowRoot);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Look now; if it is not there, watch the DOM until it appears or we time out.
 * Handles checkouts that render the coupon form after a fetch, or behind a
 * "Have a promo code?" toggle the user opens.
 * @returns {Promise<HTMLInputElement|HTMLTextAreaElement|null>}
 */
export function waitForField(selectors, { timeoutMs = 10000, root = document } = {}) {
  const immediate = queryDeep(selectors, root);
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    const finish = (result) => {
      clearTimeout(timer);
      observer.disconnect();
      resolve(result);
    };
    const observer = new MutationObserver(() => {
      const found = queryDeep(selectors, root);
      if (found) finish(found);
    });
    const timer = setTimeout(() => finish(null), timeoutMs);
    observer.observe(root === document ? document.documentElement : root, {
      childList: true,
      subtree: true,
    });
  });
}
