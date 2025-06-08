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
            // Get all elements that might contain text
            const allElements = document.querySelectorAll('body *:not(script):not(style):not(noscript):not(iframe)');
            const textNodes = [];
            
            // First pass: collect all text content and store originals
            for (const element of allElements) {
                this.storeOriginalContent(element);
                
                // Handle text content
                if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                    textNodes.push(element);
                }
                
                // Handle attributes
                const translatableAttributes = ['placeholder', 'title', 'alt', 'aria-label'];
                for (const attr of translatableAttributes) {
                    if (element.hasAttribute(attr)) {
                        this.storeOriginalAttribute(element, attr);
                    }
                }
            }
            
            // Second pass: translate content
            let translatedCount = 0;
            const totalToTranslate = textNodes.length + 
                document.querySelectorAll('[data-original-placeholder]').length +
                document.querySelectorAll('[data-original-title]').length +
                document.querySelectorAll('[data-original-alt]').length +
                document.querySelectorAll('[data-original-aria-label]').length;
            
            // Translate text nodes
            for (const element of textNodes) {
                statusIndicator.textContent = `Translating text (${++translatedCount}/${totalToTranslate})...`;
                const originalText = element.getAttribute('data-original-text');
                if (originalText) {
                    const translatedText = await this.translate(originalText, targetLanguage);
                    element.textContent = translatedText;
                }
            }
            
            // Translate attributes
            await this.translateAttributes('placeholder', targetLanguage, statusIndicator, translatedCount, totalToTranslate);
            await this.translateAttributes('title', targetLanguage, statusIndicator, translatedCount, totalToTranslate);
            await this.translateAttributes('alt', targetLanguage, statusIndicator, translatedCount, totalToTranslate);
            await this.translateAttributes('aria-label', targetLanguage, statusIndicator, translatedCount, totalToTranslate);
            
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

    async translateAttributes(attrName, targetLanguage, statusIndicator, translatedCount, totalToTranslate) {
        const elements = document.querySelectorAll(`[data-original-${attrName}]`);
        for (const element of elements) {
            statusIndicator.textContent = `Translating ${attrName} (${++translatedCount}/${totalToTranslate})...`;
            const originalValue = element.getAttribute(`data-original-${attrName}`);
            if (originalValue) {
                const translatedValue = await this.translate(originalValue, targetLanguage);
                element.setAttribute(attrName, translatedValue);
            }
        }
    }

    storeOriginalContent(element) {
        if (!element.hasAttribute('data-original-text') && element.textContent.trim()) {
            element.setAttribute('data-original-text', element.textContent.trim());
        }
    }

    storeOriginalAttribute(element, attrName) {
        const dataAttr = `data-original-${attrName}`;
        if (!element.hasAttribute(dataAttr)) {
            element.setAttribute(dataAttr, element.getAttribute(attrName));
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
        // Restore text content
        const elementsWithOriginalText = document.querySelectorAll('[data-original-text]');
        elementsWithOriginalText.forEach(element => {
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
            }
        });
        
        // Restore attributes
        const attributesToRestore = ['placeholder', 'title', 'alt', 'aria-label'];
        attributesToRestore.forEach(attr => {
            const elements = document.querySelectorAll(`[data-original-${attr}]`);
            elements.forEach(element => {
                const originalValue = element.getAttribute(`data-original-${attr}`);
                if (originalValue) {
                    element.setAttribute(attr, originalValue);
                }
            });
        });
    }
}

const bhashiniTranslator = new BhashiniTranslator();
