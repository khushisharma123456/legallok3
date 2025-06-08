class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.translationCache = new Map();
        this.observer = null;
        this.fallbackTranslations = {
            // English to Hindi fallbacks for key phrases
            "Disclaimer:": "अस्वीकरण:",
            "This AI assistant provides general legal information, not professional advice.": "यह एआई सहायक सामान्य कानूनी जानकारी प्रदान करता है, पेशेवर सलाह नहीं।",
            "For complex issues, consult a qualified lawyer.": "जटिल मामलों के लिए, एक योग्य वकील से परामर्श करें।",
            "Hello! I'm your Legal Lok assistant.": "नमस्ते! मैं आपका लीगल लोक सहायक हूँ।",
            "I can help you with legal information about:": "मैं आपको निम्नलिखित विषयों पर कानूनी जानकारी प्रदान कर सकता हूँ:",
            "Property and real estate laws": "संपत्ति और अचल संपत्ति कानून",
            "Family and marriage laws": "परिवार और विवाह कानून",
            "Business and employment regulations": "व्यवसाय और रोजगार विनियम",
            "Criminal and civil procedures": "आपराधिक और नागरिक प्रक्रियाएं",
            "Consumer rights and more": "उपभोक्ता अधिकार और अन्य",
            "Type your legal question here...": "अपना कानूनी प्रश्न यहाँ टाइप करें...",
            "Community Forum": "सामुदायिक मंच",
            "Legal Institutions": "कानूनी संस्थान",
            "Petitions": "याचिकाएँ",
            "Notifications": "सूचनाएँ",
            "Settings": "सेटिंग्स"
        };
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;
        
        // Use fallback if available
        if (targetLanguage === 'hi' && this.fallbackTranslations[text.trim()]) {
            return this.fallbackTranslations[text.trim()];
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
            const translatedText = data?.target || data?.output?.[0]?.target || text;
            
            // Verify the translation actually changed
            if (translatedText === text && targetLanguage !== 'en') {
                console.warn('API returned same text, using fallback:', text);
                return this.fallbackTranslations[text.trim()] || text;
            }
            
            this.translationCache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return this.fallbackTranslations[text.trim()] || text;
        }
    }

    async translatePage() {
        const targetLanguage = document.getElementById('languageSelect').value;
        const translateButton = document.getElementById('translateButton');
        
        translateButton.disabled = true;
        translateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';

        try {
            // 1. First handle all marked elements
            await this.translateMarkedElements(targetLanguage);
            
            // 2. Then handle all text nodes
            await this.translateAllTextNodes(targetLanguage);
            
            // 3. Handle all attributes
            await this.translateAllAttributes(targetLanguage);
            
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

    async translateAllTextNodes(targetLanguage) {
        const walker = document.createTreeWalker(
            document.body,
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

    async translateAllAttributes(targetLanguage) {
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
                        this.translateNewElement(node, targetLanguage);
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

    async translateNewElement(element, targetLanguage) {
        // Handle marked elements
        const markedElements = element.querySelectorAll('[data-translatable]');
        for (const el of markedElements) {
            if (!el.dataset.originalText) {
                el.dataset.originalText = el.textContent;
            }
            el.textContent = await this.translate(el.dataset.originalText, targetLanguage);
        }
        
        // Handle text nodes in this element
        const walker = document.createTreeWalker(
            element,
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

        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.originalText) node.originalText = node.textContent;
            node.textContent = await this.translate(node.textContent.trim(), targetLanguage);
        }
        
        // Handle attributes in this element
        const attributes = ['placeholder', 'title', 'alt', 'aria-label'];
        for (const attr of attributes) {
            if (element.hasAttribute(attr)) {
                const original = element.getAttribute(`data-original-${attr}`) || element.getAttribute(attr);
                element.setAttribute(`data-original-${attr}`, original);
                const translated = await this.translate(original, targetLanguage);
                element.setAttribute(attr, translated);
            }
        }
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
    
    // Add data-translatable to all elements that need translation
    document.querySelectorAll('.chatbot-container, .sidebar-item, .chat-messages, .chatbot-disclaimer')
           .forEach(el => el.setAttribute('data-translatable', 'true'));
});
