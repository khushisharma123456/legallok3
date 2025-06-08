class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.translationCache = new Map();
        this.observer = null;
        this.debugMode = true;
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;
        
        // Skip translation if already in target language
        if (this.isInTargetLanguage(text, targetLanguage)) {
            return text;
        }

        const cacheKey = `${text}_${targetLanguage}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        try {
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
            let translatedText = data?.target || data?.output?.[0]?.target || text;
            
            // Verify the translation actually changed
            if (translatedText === text) {
                console.warn('API returned same text:', text);
                translatedText = text; // Fallback to original
            }
            
            this.translationCache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    isInTargetLanguage(text, targetLanguage) {
        // Simple check for non-English text
        if (targetLanguage !== 'en' && !/^[a-zA-Z0-9\s.,!?'"@#$%^&*()_+-=]*$/.test(text)) {
            return true;
        }
        return false;
    }

    async translatePage() {
        const targetLanguage = document.getElementById('languageSelect').value;
        const translateButton = document.getElementById('translateButton');
        
        translateButton.disabled = true;
        translateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';

        try {
            // 1. First handle marked elements
            await this.translateMarkedElements(targetLanguage);
            
            // 2. Then handle all other text nodes
            await this.translateTextNodes(targetLanguage);
            
            // 3. Handle attributes
            await this.translateAttributes(targetLanguage);
            
            // 4. Set up observer for dynamic content
            this.setupObserver(targetLanguage);
            
        } finally {
            translateButton.disabled = false;
            translateButton.innerHTML = '<i class="fas fa-language"></i> Translate';
        }
    }

    async translateMarkedElements(targetLanguage) {
        const elements = document.querySelectorAll('[data-translatable]');
        for (const el of elements) {
            if (!el.dataset.originalText) {
                el.dataset.originalText = el.textContent;
            }
            const translated = await this.translate(el.dataset.originalText, targetLanguage);
            el.textContent = translated;
        }
    }

    async translateTextNodes(targetLanguage, root = document.body) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentNode.nodeName === 'SCRIPT' || 
                        node.parentNode.nodeName === 'STYLE' ||
                        !node.textContent.trim() ||
                        node.parentNode.hasAttribute('data-translatable')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        for (const node of nodes) {
            if (!node.originalText) node.originalText = node.textContent;
            node.textContent = await this.translate(node.textContent.trim(), targetLanguage);
        }
    }

    async translateAttributes(targetLanguage) {
        const attributes = ['placeholder', 'title', 'alt', 'aria-label'];
        const elements = document.querySelectorAll('*');

        for (const el of elements) {
            for (const attr of attributes) {
                if (el.hasAttribute(attr)) {
                    const original = el.getAttribute(`data-original-${attr}`) || el.getAttribute(attr);
                    el.setAttribute(`data-original-${attr}`, original);
                    const translated = await this.translate(original, targetLanguage);
                    el.setAttribute(attr, translated);
                }
            }
        }
    }

    setupObserver(targetLanguage) {
        if (this.observer) this.observer.disconnect();
        
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.translateElement(node, targetLanguage);
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }

    async translateElement(element, targetLanguage) {
        // Handle marked elements first
        const markedElements = element.querySelectorAll('[data-translatable]');
        for (const el of markedElements) {
            if (!el.dataset.originalText) {
                el.dataset.originalText = el.textContent;
            }
            el.textContent = await this.translate(el.dataset.originalText, targetLanguage);
        }
        
        // Then handle text nodes
        await this.translateTextNodes(targetLanguage, element);
        
        // Then handle attributes
        await this.translateAttributes(targetLanguage, element);
    }

    resetOriginalContent() {
        // Reset marked elements
        document.querySelectorAll('[data-translatable]').forEach(el => {
            if (el.dataset.originalText) {
                el.textContent = el.dataset.originalText;
            }
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
        
        // Reset attributes
        const attributes = ['placeholder', 'title', 'alt', 'aria-label'];
        document.querySelectorAll('*').forEach(el => {
            for (const attr of attributes) {
                const original = el.getAttribute(`data-original-${attr}`);
                if (original) {
                    el.setAttribute(attr, original);
                }
            }
        });
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

// Initialize and set up event listener
document.addEventListener('DOMContentLoaded', () => {
    const translator = new BhashiniTranslator();
    document.getElementById('translateButton').addEventListener('click', () => {
        translator.translatePage();
    });
});
