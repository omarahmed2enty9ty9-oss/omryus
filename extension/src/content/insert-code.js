/**
 * Putting the code in the box so that React, Vue and friends notice.
 *
 * Setting el.value directly is invisible to React: it keeps its own cached
 * "value tracker" and concludes nothing changed, so the code vanishes on the
 * next render. Calling the prototype's native setter updates the real value and
 * bypasses the tracker; the bubbling input/change events then tell the
 * framework to read it back.
 */

function nativeValueSetter(el) {
  const proto = el.tagName.toLowerCase() === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  return Object.getOwnPropertyDescriptor(proto, 'value')?.set;
}

/**
 * @param {HTMLInputElement|HTMLTextAreaElement} el
 * @param {string} code
 * @returns {boolean} whether the value actually stuck
 */
export function insertCode(el, code) {
  el.focus?.();
  const setter = nativeValueSetter(el);
  if (setter) setter.call(el, code);
  else el.value = code;

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.blur?.();
  return el.value === code;
}

/**
 * Optionally press the store's own "Apply" button.
 * The user asked for the discount to be applied, so clicking the store's apply
 * button is part of that same action — but if we cannot find it we simply stop
 * and let them press it.
 * @returns {boolean} whether a button was clicked
 */
export function clickApplyButton(selectors, root = document) {
  for (const selector of selectors) {
    let el;
    try {
      el = root.querySelector(selector);
    } catch {
      continue;
    }
    if (el && !el.disabled) {
      el.click();
      return true;
    }
  }
  return false;
}
