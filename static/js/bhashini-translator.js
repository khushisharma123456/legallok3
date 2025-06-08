class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.translationCache = new Map();
        this.observer = null;
        this.debugMode = true;
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;

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
                headers: { 'Content-Type': 'application/json' },
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

            if (translatedText === text) {
                console.warn('API returned same text:', text);
                translatedText = text;
            }

            this.translationCache.set(cacheKey, translatedText);

            if (this.debugMode) console.log(`Translated "${text}" → "${translatedText}"`);

            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    isInTargetLanguage(text, targetLanguage) {
        if (targetLanguage !== 'en' && !/^[a-zA-Z0-9\s.,!?'"@#$%^&*()_+\-=/\\]*$/.test(text)) {
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
            await this.translateMarkedElements(targetLanguage);
            await this.translateTextNodes(targetLanguage);
            await this.translateAttributes(targetLanguage);
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
                el.dataset.originalText = el.innerText;
            }
            const translated = await this.translate(el.dataset.originalText, targetLanguage);
            el.innerText = translated;
        }
    }

    async translateTextNodes(targetLanguage, root = document.body) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (
                        node.parentNode.nodeName === 'SCRIPT' ||
                        node.parentNode.nodeName === 'STYLE' ||
                        !node.textContent.trim()
                    ) {
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
            node.textContent = await this.translate(node.originalText.trim(), targetLanguage);
        }
    }

    async translateAttributes(targetLanguage, root = document.body) {
        const attributes = ['placeholder', 'title', 'alt', 'aria-label'];
        const elements = root.querySelectorAll('*');

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
            subtree: true
        });
    }

    async translateElement(element, targetLanguage) {
        const markedElements = element.querySelectorAll('[data-translatable]');
        for (const el of markedElements) {
            if (!el.dataset.originalText) {
                el.dataset.originalText = el.innerText;
            }
            el.innerText = await this.translate(el.dataset.originalText, targetLanguage);
        }

        await this.translateTextNodes(targetLanguage, element);
        await this.translateAttributes(targetLanguage, element);
    }

    resetOriginalContent() {
        document.querySelectorAll('[data-translatable]').forEach(el => {
            if (el.dataset.originalText) {
                el.innerText = el.dataset.originalText;
            }
        });

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.originalText) {
                node.textContent = node.originalText;
            }
        }

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

document.addEventListener('DOMContentLoaded', () => {
    const translator = new BhashiniTranslator();
    document.getElementById('translateButton').addEventListener('click', () => {
        translator.translatePage();
    });
});
