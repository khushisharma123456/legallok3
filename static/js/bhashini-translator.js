class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.serviceId = 'ai4bharat/indictrans-v2-all-gpu';
        this.translationCache = new Map();
        this.originalContentMap = new WeakMap();
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;
        
        const cacheKey = `${text}_${targetLanguage}`;
        
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        try {
            console.log('Translating:', text, 'to', targetLanguage);
            
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

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                const errText = await response.text();
                console.error('Non-JSON response from server:', errText);
                throw new Error('Translation service returned an invalid response.');
            }
            
            if (!response.ok || data.error) {
                const errorMsg = data.message || data.error || 'Translation failed';
                console.error('Translation API Error:', data);
                throw new Error(errorMsg);
            }

            let translatedText;
            if (data?.target) {
                translatedText = data.target;
            } else if (data?.output && Array.isArray(data.output) && data.output.length > 0) {
                translatedText = data.output[0]?.target;
            }
            
            if (!translatedText) {
                console.error('Response structure:', data);
                throw new Error('No translation found in response');
            }

            this.translationCache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error('Translation API error:', error);
            return text; // Return original text if translation fails
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
        
        const statusIndicator = this.createStatusIndicator('Preparing translation...');
        
        try {
            // Get all text nodes in the document
            const textNodes = this.getAllTextNodes(document.body);
            
            // First pass: store original content
            for (const node of textNodes) {
                this.storeOriginalText(node);
            }
            
            // Second pass: translate content
            let translatedCount = 0;
            const totalToTranslate = textNodes.length;
            
            for (const node of textNodes) {
                statusIndicator.textContent = `Translating (${++translatedCount}/${totalToTranslate})...`;
                const originalText = node.data;
                if (originalText && originalText.trim()) {
                    const translatedText = await this.translate(originalText.trim(), targetLanguage);
                    node.data = translatedText;
                }
            }
            
            // Translate attributes (title, placeholder, alt, etc.)
            await this.translateAttributes(targetLanguage, statusIndicator, translatedCount, totalToTranslate);
            
            statusIndicator.style.background = 'rgba(40,167,69,0.9)';
            statusIndicator.textContent = 'Translation completed!';
            
        } catch (error) {
            console.error('Translation error:', error);
            statusIndicator.style.background = 'rgba(220,53,69,0.9)';
            statusIndicator.textContent = 'Error: ' + error.message;
            alert('Translation failed: ' + error.message);
        } finally {
            translateButton.disabled = false;
            translateButton.innerHTML = '<i class="fas fa-language"></i> Translate';
            
            setTimeout(() => {
                if (document.body.contains(statusIndicator)) {
                    document.body.removeChild(statusIndicator);
                }
            }, 2000);
        }
    }

    getAllTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip text nodes in script, style, and other non-content elements
                    if (node.parentElement.tagName === 'SCRIPT' || 
                        node.parentElement.tagName === 'STYLE' ||
                        node.parentElement.tagName === 'NOSCRIPT' ||
                        node.parentElement.tagName === 'IFRAME') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Only include nodes with actual text content
                    return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            },
            false
        );
        
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        
        return textNodes;
    }

    storeOriginalText(node) {
        if (!node.originalText) {
            node.originalText = node.textContent;
        }
    }

    async translateAttributes(targetLanguage, statusIndicator, translatedCount, totalToTranslate) {
        const attributesToTranslate = ['title', 'placeholder', 'alt', 'aria-label'];
        const elementsWithAttributes = [];
        
        // Find all elements with translatable attributes
        attributesToTranslate.forEach(attr => {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                if (!el.hasAttribute(`data-original-${attr}`)) {
                    el.setAttribute(`data-original-${attr}`, el.getAttribute(attr));
                }
                elementsWithAttributes.push({el, attr});
            });
        });
        
        // Translate the attributes
        for (const {el, attr} of elementsWithAttributes) {
            statusIndicator.textContent = `Translating ${attr} attributes (${++translatedCount}/${totalToTranslate + elementsWithAttributes.length})...`;
            const originalValue = el.getAttribute(`data-original-${attr}`);
            if (originalValue) {
                const translatedValue = await this.translate(originalValue, targetLanguage);
                el.setAttribute(attr, translatedValue);
            }
        }
    }

    createStatusIndicator(initialText) {
        const statusIndicator = document.createElement('div');
        statusIndicator.style.position = 'fixed';
        statusIndicator.style.top = '10px';
        statusIndicator.style.right = '10px';
        statusIndicator.style.padding = '8px 16px';
        statusIndicator.style.background = 'rgba(0,0,0,0.7)';
        statusIndicator.style.color = 'white';
        statusIndicator.style.borderRadius = '4px';
        statusIndicator.style.zIndex = '9999';
        statusIndicator.textContent = initialText;
        document.body.appendChild(statusIndicator);
        return statusIndicator;
    }

    resetOriginalContent() {
        // Restore text nodes
        const textNodes = this.getAllTextNodes(document.body);
        for (const node of textNodes) {
            if (node.originalText) {
                node.data = node.originalText;
            }
        }
        
        // Restore attributes
        const attributesToRestore = ['title', 'placeholder', 'alt', 'aria-label'];
        attributesToRestore.forEach(attr => {
            document.querySelectorAll(`[data-original-${attr}]`).forEach(el => {
                const originalValue = el.getAttribute(`data-original-${attr}`);
                if (originalValue) {
                    el.setAttribute(attr, originalValue);
                }
            });
        });
    }
}

const bhashiniTranslator = new BhashiniTranslator();
