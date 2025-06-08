class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.serviceId = 'ai4bharat/indictrans-v2-all-gpu';
        this.translationCache = new Map();
        this.observedElements = new WeakSet();
        this.observer = null;
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;
        
        const cacheKey = `${text}_${targetLanguage}`;
        
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal,
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

            clearTimeout(timeoutId);

            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.message || data.error || 'Translation failed');
            }

            const translatedText = data?.target || 
                                (data?.output?.[0]?.target || text);
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
        translateButton.textContent = 'Translating...';

        try {
            // Setup MutationObserver to catch dynamic content
            this.setupObserver(targetLanguage);
            
            // Initial translation pass
            await this.translateAllTextNodes(document.body, targetLanguage);
            await this.translateAllAttributes(targetLanguage);
            
            // Special cases for common UI patterns
            await this.handleSpecialCases(targetLanguage);
            
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            translateButton.disabled = false;
            translateButton.textContent = 'Translate';
        }
    }

    setupObserver(targetLanguage) {
        if (this.observer) this.observer.disconnect();
        
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.translateAllTextNodes(node, targetLanguage);
                        this.translateAllAttributes(targetLanguage, node);
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
    }

    async translateAllTextNodes(root, targetLanguage) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node.textContent.trim() || 
                        node.parentNode.tagName === 'SCRIPT' || 
                        node.parentNode.tagName === 'STYLE' ||
                        node.parentNode.tagName === 'NOSCRIPT' ||
                        node.parentNode.tagName === 'IFRAME') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        for (const node of nodes) {
            if (!node.originalText) {
                node.originalText = node.textContent;
            }
            const translated = await this.translate(node.textContent.trim(), targetLanguage);
            node.textContent = translated;
        }
    }

    async translateAllAttributes(targetLanguage, root = document) {
        const attributes = ['title', 'placeholder', 'alt', 'aria-label'];
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

    async handleSpecialCases(targetLanguage) {
        // Handle common UI patterns that might need special attention
        const specialSelectors = [
            '.disclaimer-text',
            '.welcome-message',
            '.ai-assistant-text',
            '.legal-topics-list'
        ];

        for (const selector of specialSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                if (!el.dataset.originalHtml) {
                    el.dataset.originalHtml = el.innerHTML;
                }
                const translated = await this.translate(el.textContent.trim(), targetLanguage);
                el.textContent = translated;
            }
        }
    }

    resetOriginalContent() {
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
        const attributes = ['title', 'placeholder', 'alt', 'aria-label'];
        document.querySelectorAll('*').forEach(el => {
            for (const attr of attributes) {
                const original = el.getAttribute(`data-original-${attr}`);
                if (original) {
                    el.setAttribute(attr, original);
                }
            }
        });

        // Reset special cases
        const specialSelectors = [
            '.disclaimer-text',
            '.welcome-message',
            '.ai-assistant-text',
            '.legal-topics-list'
        ];

        specialSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.dataset.originalHtml) {
                    el.innerHTML = el.dataset.originalHtml;
                }
            });
        });

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

const bhashiniTranslator = new BhashiniTranslator();
