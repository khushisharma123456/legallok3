class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.translationCache = new Map();
        this.observer = null;
        this.debugMode = true; // Enable to see exactly what's being translated
    }

    logDebug(message) {
        if (this.debugMode) {
            console.log('[DEBUG]', message);
        }
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) {
            this.logDebug(`Skipping empty text for ${targetLanguage}`);
            return text;
        }
        
        const cacheKey = `${text}_${targetLanguage}`;
        if (this.translationCache.has(cacheKey)) {
            this.logDebug(`Using cached translation for: "${text}"`);
            return this.translationCache.get(cacheKey);
        }

        try {
            this.logDebug(`Translating: "${text}" to ${targetLanguage}`);
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    input: {
                        source: text,
                        sourceLanguage: "en",
                        targetLanguage: targetLanguage
                    },
                    modelId: "ai4bharat/indictrans-v2-all-gpu",
                    task: "translation"
                })
            });

            const data = await response.json();
            const translatedText = data?.target || data?.output?.[0]?.target || text;
            
            this.logDebug(`Translation result for "${text}": "${translatedText}"`);
            this.translationCache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    async translatePage() {
        const targetLanguage = document.getElementById('languageSelect').value;
        if (targetLanguage === 'en') {
            this.resetOriginalContent();
            return;
        }

        const translateButton = document.getElementById('translateButton');
        translateButton.disabled = true;
        translateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';

        try {
            // Create debug container
            const debugContainer = this.createDebugContainer();
            
            // 1. First get ALL text content in the document
            const { elements, textNodes } = this.findAllTextContent();
            debugContainer.innerHTML += `<p>Found ${elements.length} elements and ${textNodes.length} text nodes to translate</p>`;
            
            // 2. Store original content
            this.storeOriginalContent(elements, textNodes, debugContainer);
            
            // 3. Translate everything
            await this.translateAllContent(elements, textNodes, targetLanguage, debugContainer);
            
            debugContainer.innerHTML += `<p style="color:green;">Translation completed successfully!</p>`;
            
        } catch (error) {
            console.error('Translation failed:', error);
            const debugContainer = document.getElementById('translation-debug');
            if (debugContainer) {
                debugContainer.innerHTML += `<p style="color:red;">Error: ${error.message}</p>`;
            }
        } finally {
            translateButton.disabled = false;
            translateButton.innerHTML = '<i class="fas fa-language"></i> Translate';
        }
    }

    findAllTextContent() {
        // Get all elements with text content
        const allElements = Array.from(document.querySelectorAll('body *')).filter(el => {
            // Skip these elements
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OPTION'].includes(el.tagName)) {
                return false;
            }
            
            // Include elements with text content or translatable attributes
            return el.textContent.trim().length > 0 || 
                   el.hasAttribute('placeholder') || 
                   el.hasAttribute('title') || 
                   el.hasAttribute('alt') || 
                   el.hasAttribute('aria-label');
        });
        
        // Get all text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentNode.nodeName === 'SCRIPT' || 
                        node.parentNode.nodeName === 'STYLE' ||
                        !node.textContent.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        
        return { elements: allElements, textNodes };
    }

    storeOriginalContent(elements, textNodes, debugContainer) {
        // Store original element content
        elements.forEach(el => {
            if (!el.dataset.originalText && el.textContent.trim()) {
                el.dataset.originalText = el.textContent;
                debugContainer.innerHTML += `<p>Stored original for element: ${el.tagName} - "${el.textContent.trim()}"</p>`;
            }
            
            // Store attribute content
            ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
                if (el.hasAttribute(attr)) {
                    const value = el.getAttribute(attr);
                    if (value && !el.hasAttribute(`data-original-${attr}`)) {
                        el.setAttribute(`data-original-${attr}`, value);
                        debugContainer.innerHTML += `<p>Stored original ${attr} for ${el.tagName}: "${value}"</p>`;
                    }
                }
            });
        });
        
        // Store original text nodes
        textNodes.forEach(node => {
            if (!node.originalText) {
                node.originalText = node.textContent;
                debugContainer.innerHTML += `<p>Stored original text node: "${node.textContent.trim()}"</p>`;
            }
        });
    }

    async translateAllContent(elements, textNodes, targetLanguage, debugContainer) {
        // Translate elements
        for (const el of elements) {
            try {
                // Translate text content
                if (el.textContent.trim()) {
                    const original = el.dataset.originalText || el.textContent;
                    const translated = await this.translate(original, targetLanguage);
                    el.textContent = translated;
                    debugContainer.innerHTML += `<p>Translated element ${el.tagName}: "${original}" → "${translated}"</p>`;
                }
                
                // Translate attributes
                ['placeholder', 'title', 'alt', 'aria-label'].forEach(async attr => {
                    if (el.hasAttribute(attr)) {
                        const original = el.getAttribute(`data-original-${attr}`) || el.getAttribute(attr);
                        const translated = await this.translate(original, targetLanguage);
                        el.setAttribute(attr, translated);
                        debugContainer.innerHTML += `<p>Translated ${attr} for ${el.tagName}: "${original}" → "${translated}"</p>`;
                    }
                });
            } catch (error) {
                debugContainer.innerHTML += `<p style="color:orange;">Error translating ${el.tagName}: ${error.message}</p>`;
            }
        }
        
        // Translate text nodes
        for (const node of textNodes) {
            try {
                const original = node.originalText || node.textContent;
                const translated = await this.translate(original, targetLanguage);
                node.textContent = translated;
                debugContainer.innerHTML += `<p>Translated text node: "${original}" → "${translated}"</p>`;
            } catch (error) {
                debugContainer.innerHTML += `<p style="color:orange;">Error translating text node: ${error.message}</p>`;
            }
        }
    }

    createDebugContainer() {
        let debugContainer = document.getElementById('translation-debug');
        if (!debugContainer) {
            debugContainer = document.createElement('div');
            debugContainer.id = 'translation-debug';
            debugContainer.style.position = 'fixed';
            debugContainer.style.bottom = '0';
            debugContainer.style.left = '0';
            debugContainer.style.width = '100%';
            debugContainer.style.height = '200px';
            debugContainer.style.overflow = 'auto';
            debugContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
            debugContainer.style.color = 'white';
            debugContainer.style.padding = '10px';
            debugContainer.style.zIndex = '9999';
            debugContainer.style.borderTop = '2px solid red';
            document.body.appendChild(debugContainer);
        }
        debugContainer.innerHTML = '<h3>Translation Debugger</h3>';
        return debugContainer;
    }

    resetOriginalContent() {
        // Reset elements
        document.querySelectorAll('[data-original-text]').forEach(el => {
            el.textContent = el.dataset.originalText;
        });
        
        // Reset attributes
        ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
            document.querySelectorAll(`[data-original-${attr}]`).forEach(el => {
                el.setAttribute(attr, el.getAttribute(`data-original-${attr}`));
            });
        });
        
        // Reset text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.originalText) {
                node.textContent = node.originalText;
            }
        }
        
        // Remove debug container
        const debugContainer = document.getElementById('translation-debug');
        if (debugContainer) {
            debugContainer.remove();
        }
    }
}

// Initialize translator
const bhashiniTranslator = new BhashiniTranslator();

// Add event listener for translate button
document.getElementById('translateButton').addEventListener('click', () => {
    bhashiniTranslator.translatePage();
});
