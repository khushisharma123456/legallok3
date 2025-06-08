async translatePage() {
  const targetLanguage = document.getElementById('languageSelect').value;
  if (targetLanguage === 'en') {
    this.resetOriginalContent();
    return;
  }

  const translateButton = document.getElementById('translateButton');
  translateButton.disabled = true;
  translateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';

  // Status indicator UI
  let statusIndicator = document.createElement('div');
  Object.assign(statusIndicator.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    padding: '8px 16px',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    borderRadius: '4px',
    zIndex: '9999',
  });
  statusIndicator.textContent = 'Preparing to translate...';
  document.body.appendChild(statusIndicator);

  try {
    // Get all visible text nodes in the document body recursively
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Ignore empty or whitespace-only text nodes
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;

          // Ignore text nodes inside script, style, noscript, iframe, etc
          const parentTag = node.parentNode.nodeName.toLowerCase();
          const skipTags = ['script', 'style', 'noscript', 'iframe', 'code', 'pre'];
          if (skipTags.includes(parentTag)) return NodeFilter.FILTER_REJECT;

          // Ignore hidden elements (display:none or visibility:hidden)
          const style = window.getComputedStyle(node.parentNode);
          if (style.display === 'none' || style.visibility === 'hidden') return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    // For placeholders and title/alt/aria-label attributes in inputs, images, etc
    const attrElements = [...document.querySelectorAll('input, textarea, img, [title], [alt], [aria-label]')];

    const totalItems = textNodes.length + attrElements.length;
    let translatedCount = 0;

    // Translate all text nodes
    for (const node of textNodes) {
      if (!node.parentNode) continue;

      // Save original text if not saved
      if (!node.parentNode.hasAttribute('data-original-text')) {
        node.parentNode.setAttribute('data-original-text', node.nodeValue);
      }

      statusIndicator.textContent = Translating text nodes (${translatedCount}/${totalItems})...;
      const translated = await this.translate(node.nodeValue, targetLanguage);
      node.nodeValue = translated;
      translatedCount++;
    }

    // Translate placeholder, title, alt, aria-label attributes
    for (const el of attrElements) {
      // Placeholder
      if (el.placeholder) {
        if (!el.hasAttribute('data-original-placeholder')) {
          el.setAttribute('data-original-placeholder', el.placeholder);
        }
        statusIndicator.textContent = Translating placeholders/attributes (${translatedCount}/${totalItems})...;
        el.placeholder = await this.translate(el.placeholder, targetLanguage);
        translatedCount++;
      }

      // title attribute
      if (el.title) {
        if (!el.hasAttribute('data-original-title')) {
          el.setAttribute('data-original-title', el.title);
        }
        statusIndicator.textContent = Translating title attributes (${translatedCount}/${totalItems})...;
        el.title = await this.translate(el.title, targetLanguage);
        translatedCount++;
      }

      // alt attribute for images
      if (el.alt) {
        if (!el.hasAttribute('data-original-alt')) {
          el.setAttribute('data-original-alt', el.alt);
        }
        statusIndicator.textContent = Translating alt attributes (${translatedCount}/${totalItems})...;
        el.alt = await this.translate(el.alt, targetLanguage);
        translatedCount++;
      }

      // aria-label attribute
      if (el.hasAttribute('aria-label')) {
        if (!el.hasAttribute('data-original-aria-label')) {
          el.setAttribute('data-original-aria-label', el.getAttribute('aria-label'));
        }
        statusIndicator.textContent = Translating aria-labels (${translatedCount}/${totalItems})...;
        el.setAttribute('aria-label', await this.translate(el.getAttribute('aria-label'), targetLanguage));
        translatedCount++;
      }
    }

  } catch (error) {
    console.error('Translation error:', error);
    statusIndicator.style.background = 'rgba(220,53,69,0.9)';
    statusIndicator.textContent = 'Error: ' + error.message;

    setTimeout(() => {
      if (document.body.contains(statusIndicator)) document.body.removeChild(statusIndicator);
    }, 5000);

    alert('Translation failed: ' + error.message);
  } finally {
    translateButton.disabled = false;
    translateButton.innerHTML = '<i class="fas fa-language"></i> Translate';

    if (document.body.contains(statusIndicator) && !statusIndicator.textContent.includes('Error')) {
      statusIndicator.style.background = 'rgba(40,167,69,0.9)';
      statusIndicator.textContent = 'Translation completed!';
      setTimeout(() => {
        if (document.body.contains(statusIndicator)) document.body.removeChild(statusIndicator);
      }, 2000);
    }
  }
}
