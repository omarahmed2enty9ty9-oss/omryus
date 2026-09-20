// The stub must be installed before the content script's top-level code runs,
// which is why it is a separate module imported first.
import './stub-chrome.js';
import '../../extension/src/content/content.js';
