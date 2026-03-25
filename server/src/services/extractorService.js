/**
 * Extractor Service - Processes DOM snapshots to extract structured features.
 * Identifies interactive elements, navigation, content sections, and states.
 */

/**
 * Extract structured features from a crawled page's DOM snapshot.
 * @param {Object} pageData - Crawled page data with domSnapshot
 * @returns {Object} Structured feature data
 */
function extractFeatures(pageData) {
  const { domSnapshot, url, title } = pageData;

  return {
    metadata: { url, title, crawledAt: pageData.crawledAt },

    interactive_elements: extractInteractiveElements(domSnapshot),
    navigation: extractNavigation(domSnapshot),
    sections: extractContentSections(domSnapshot),
    states: extractStates(domSnapshot)
  };
}

/**
 * Extract interactive UI elements (buttons, inputs, forms, modals).
 */
function extractInteractiveElements(dom) {
  const elements = [];

  (dom.buttons || []).forEach(btn => {
    elements.push({
      type: 'button',
      text: btn.text,
      role: btn.role || 'button',
      actionHint: guessAction(btn.text, btn.ariaLabel)
    });
  });

  (dom.inputs || []).forEach(input => {
    elements.push({
      type: 'input',
      inputType: input.tag === 'select' ? 'dropdown' : (input.placeholder ? 'text' : 'unknown'),
      placeholder: input.placeholder,
      label: input.ariaLabel
    });
  });

  (dom.forms || []).forEach(form => {
    elements.push({
      type: 'form',
      id: form.id,
      className: form.className
    });
  });

  (dom.modals || []).forEach(modal => {
    elements.push({
      type: 'modal',
      text: modal.text?.slice(0, 100),
      role: modal.role
    });
  });

  return elements;
}

/**
 * Extract navigation structure from DOM.
 */
function extractNavigation(dom) {
  const navItems = [];

  (dom.navs || []).forEach(nav => {
    navItems.push({
      type: 'navigation',
      text: nav.text?.slice(0, 200)
    });
  });

  const mainLinks = (dom.links || [])
    .filter(link => link.text && link.href)
    .slice(0, 50)
    .map(link => ({
      type: 'link',
      text: link.text.slice(0, 100),
      href: link.href
    }));

  return [...navItems, ...mainLinks];
}

/**
 * Extract content sections from DOM headings and structure.
 */
function extractContentSections(dom) {
  return (dom.headings || []).map(h => ({
    level: h.tag,
    text: h.text,
    id: h.id
  }));
}

/**
 * Detect potential UI states (disabled buttons, empty states, error msgs).
 */
function extractStates(dom) {
  const states = [];

  (dom.buttons || []).forEach(btn => {
    if (btn.className && /disabled|inactive/i.test(btn.className)) {
      states.push({ type: 'disabled_button', text: btn.text });
    }
  });

  (dom.headings || []).forEach(h => {
    if (/error|not found|empty|no results/i.test(h.text)) {
      states.push({ type: 'error_or_empty', text: h.text });
    }
  });

  return states;
}

/**
 * Guess the action from button text or aria label.
 */
function guessAction(text, ariaLabel) {
  const combined = `${text} ${ariaLabel || ''}`.toLowerCase();
  if (/submit|send|save|confirm/i.test(combined)) return 'submit';
  if (/search|find|filter/i.test(combined)) return 'search';
  if (/cancel|close|dismiss/i.test(combined)) return 'cancel';
  if (/add|create|new/i.test(combined)) return 'create';
  if (/delete|remove/i.test(combined)) return 'delete';
  if (/edit|update|modify/i.test(combined)) return 'edit';
  if (/login|sign in/i.test(combined)) return 'login';
  if (/register|sign up/i.test(combined)) return 'register';
  if (/download|export/i.test(combined)) return 'export';
  return 'action';
}

module.exports = { extractFeatures };
