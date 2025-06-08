class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.translationCache = new Map();
        this.observer = null;
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;
        
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
            const translatedText = data?.target || data?.output?.[0]?.target || text;
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

        // Start observing DOM changes
        this.startObservation(targetLanguage);

        // Initial translation of all content
        await this.translateEntireDOM(targetLanguage);
    }

    startObservation(targetLanguage) {
        if (this.observer) this.observer.disconnect();
        
        this.observer = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        await this.translateElement(node, targetLanguage);
                    }
                }
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }

    async translateEntireDOM(targetLanguage) {
        // Translate all text nodes
        const allTextNodes = [];
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

        while (walker.nextNode()) {
            allTextNodes.push(walker.currentNode);
        }

        for (const node of allTextNodes) {
            if (!node.originalText) node.originalText = node.textContent;
            node.textContent = await this.translate(node.textContent.trim(), targetLanguage);
        }

        // Translate all attributes
        await this.translateAttributes(targetLanguage);
    }

    async translateElement(element, targetLanguage) {
        // Handle text nodes in this element
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
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

        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        for (const node of textNodes) {
            if (!node.originalText) node.originalText = node.textContent;
            node.textContent = await this.translate(node.textContent.trim(), targetLanguage);
        }

        // Handle attributes in this element
        await this.translateAttributes(targetLanguage, element);
    }

    async translateAttributes(targetLanguage, root = document) {
        const attributes = ['title', 'placeholder', 'alt', 'aria-label'];
        const elements = root.querySelectorAll('*');

        for (const element of elements) {
            for (const attr of attributes) {
                if (element.hasAttribute(attr)) {
                    const original = element.getAttribute(`data-original-${attr}`) || element.getAttribute(attr);
                    element.setAttribute(`data-original-${attr}`, original);
                    const translated = await this.translate(original, targetLanguage);
                    element.setAttribute(attr, translated);
                }
            }
        }
    }

    resetOriginalContent() {
        // Reset all text nodes
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

        // Reset all attributes
        const attributes = ['title', 'placeholder', 'alt', 'aria-label'];
        document.querySelectorAll('*').forEach(el => {
            for (const attr of attributes) {
                const original = el.getAttribute(`data-original-${attr}`);
                if (original) {
                    el.setAttribute(attr, original);
                }
            }
        });

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

// Initialize translator
const bhashiniTranslator = new BhashiniTranslator();

// Add this to your translate button click handler
function handleTranslate() {
    bhashiniTranslator.translatePage();
}
