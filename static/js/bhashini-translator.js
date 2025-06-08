class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.translationCache = new Map();
        this.observer = null;
        this.isTranslating = false;
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
        if (this.isTranslating) return;
        this.isTranslating = true;

        const targetLanguage = document.getElementById('languageSelect').value;
        const translateButton = document.getElementById('translateButton');
        
        // Update UI during translation
        translateButton.disabled = true;
        const originalButtonContent = translateButton.innerHTML;
        translateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';

        try {
            // Start observing DOM changes
            this.startObservation(targetLanguage);

            // Initial translation of all content
            await this.translateEntireDOM(targetLanguage);

            // Create status indicator
            const statusIndicator = this.createStatusIndicator('Translation in progress...');
            
            // Special handling for complex elements
            await this.handleComplexElements(targetLanguage);

            // Update status to completed
            statusIndicator.style.background = 'rgba(40,167,69,0.9)';
            statusIndicator.textContent = 'Translation completed!';
            setTimeout(() => statusIndicator.remove(), 2000);

        } catch (error) {
            console.error('Translation error:', error);
            const statusIndicator = this.createStatusIndicator('Translation failed!');
            statusIndicator.style.background = 'rgba(220,53,69,0.9)';
            setTimeout(() => statusIndicator.remove(), 3000);
        } finally {
            translateButton.disabled = false;
            translateButton.innerHTML = originalButtonContent;
            this.isTranslating = false;
        }
    }

    createStatusIndicator(text) {
        const indicator = document.createElement('div');
        indicator.style.position = 'fixed';
        indicator.style.bottom = '20px';
        indicator.style.right = '20px';
        indicator.style.padding = '10px 20px';
        indicator.style.background = 'rgba(0,0,0,0.8)';
        indicator.style.color = 'white';
        indicator.style.borderRadius = '5px';
        indicator.style.zIndex = '9999';
        indicator.textContent = text;
        document.body.appendChild(indicator);
        return indicator;
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
        await this.translateTextNodes(targetLanguage);
        
        // Translate all attributes
        await this.translateAttributes(targetLanguage);
        
        // Handle special cases
        await this.handleSpecialCases(targetLanguage);
    }

    async translateTextNodes(targetLanguage, root = document.body) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentNode.nodeName === 'SCRIPT' || 
                        node.parentNode.nodeName === 'STYLE' ||
                        node.parentNode.nodeName === 'NOSCRIPT' ||
                        !node.textContent.trim()) {
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

    async handleSpecialCases(targetLanguage) {
        // Handle elements with HTML content
        const htmlElements = document.querySelectorAll('[data-translatable-html]');
        for (const element of htmlElements) {
            if (!element.dataset.originalHtml) {
                element.dataset.originalHtml = element.innerHTML;
            }
            const translated = await this.translate(element.textContent.trim(), targetLanguage);
            element.textContent = translated;
        }

        // Handle input values
        const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
        for (const input of inputs) {
            if (input.value && !input.dataset.originalValue) {
                input.dataset.originalValue = input.value;
                input.value = await this.translate(input.value, targetLanguage);
            }
        }
    }

    async handleComplexElements(targetLanguage) {
        // Handle lists with complex structure
        const listItems = document.querySelectorAll('li');
        for (const item of listItems) {
            if (!item.dataset.originalText) {
                item.dataset.originalText = item.textContent;
            }
            item.textContent = await this.translate(item.textContent.trim(), targetLanguage);
        }

        // Handle buttons with icons and text
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            if (button.textContent.trim() && !button.dataset.originalText) {
                button.dataset.originalText = button.textContent;
                const translated = await this.translate(button.textContent.trim(), targetLanguage);
                // Preserve any HTML structure (like icons)
                if (button.children.length > 0) {
                    const textNodes = Array.from(button.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
                    textNodes.forEach(n => {
                        if (n.textContent.trim()) {
                            n.textContent = translated;
                        }
                    });
                } else {
                    button.textContent = translated;
                }
            }
        }
    }

    async translateElement(element, targetLanguage) {
        // Translate text nodes in this element
        await this.translateTextNodes(targetLanguage, element);
        
        // Translate attributes in this element
        await this.translateAttributes(targetLanguage, element);
        
        // Handle any complex cases in this element
        await this.handleComplexElements(targetLanguage);
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

        // Reset input values
        document.querySelectorAll('input[type="text"], input[type="search"], textarea').forEach(input => {
            if (input.dataset.originalValue) {
                input.value = input.dataset.originalValue;
            }
        });

        // Reset HTML elements
        document.querySelectorAll('[data-translatable-html]').forEach(el => {
            if (el.dataset.originalHtml) {
                el.innerHTML = el.dataset.originalHtml;
            }
        });

        // Reset complex elements
        document.querySelectorAll('li, button').forEach(el => {
            if (el.dataset.originalText) {
                el.textContent = el.dataset.originalText;
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

// Add event listener for translate button
document.getElementById('translateButton').addEventListener('click', () => {
    bhashiniTranslator.translatePage();
});
