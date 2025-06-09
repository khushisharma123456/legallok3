class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.translationCache = new Map();
        this.observer = null;
        this.isTranslating = false;
        this.translationQueue = [];
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;
        
        const cacheKey = `${text}_${targetLanguage}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
<<<<<<< HEAD
        }        try {
            console.log('Translating:', text, 'to', targetLanguage);
            
            // Add request timeout with AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
=======
        }

        try {
>>>>>>> 10a5c3a48961e363f2ebc5d51d28050333b60bfd
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

<<<<<<< HEAD
            clearTimeout(timeoutId); // Clear timeout if request completes

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                // Try to get text for debugging
                const errText = await response.text();
                console.error('Non-JSON response from server:', errText);
                throw new Error('Translation service returned an invalid response.');
            }
            console.log('API Response:', data);
            
            if (!response.ok || data.error) {
                const errorMsg = data.message || data.error || 'Translation failed';
                console.error('Translation API Error:', data);
                throw new Error(errorMsg);
            }            // Extract translated text from the response based on API format
            let translatedText;
            if (data?.target) {
                // Format 1: From our Flask proxy
                translatedText = data.target;
            } else if (data?.output && Array.isArray(data.output) && data.output.length > 0) {
                // Format 2: Direct from Bhashini API
                translatedText = data.output[0]?.target;
            }
            
            console.log('Translated text:', translatedText);
            
            if (!translatedText) {
                console.error('Response structure:', data);
                throw new Error('No translation found in response');
            }

            // Store in cache
            this.translationCache.set(cacheKey, translatedText);
            return translatedText;        } catch (error) {
            console.error('Translation API error:', error);
            console.log('Attempting to use fallback translation...');
            
            // Instead of throwing error immediately, try to fall back to mock translations
            // Check if the response has mock translation data
            try {
                const fallbackResponse = await fetch('/api/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        source: text,
                        target: targetLanguage,
                        fallback_only: true  // Request only mock translations
                    })
                });
                
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData?.target) {
                        console.log('Using fallback translation:', fallbackData.target);
                        this.translationCache.set(cacheKey, fallbackData.target);
                        return fallbackData.target;
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback translation also failed:', fallbackError);
            }
            
            // If all else fails, return original text
            console.warn('No translation available, returning original text:', text);
=======
            const data = await response.json();
            const translatedText = data?.target || data?.output?.[0]?.target || text;
            this.translationCache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
>>>>>>> 10a5c3a48961e363f2ebc5d51d28050333b60bfd
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

            // Create status indicator
            const statusIndicator = this.createStatusIndicator('Starting translation...');

            // Get ALL elements with text content
            const allElements = this.getAllTextElements();
            
            // Process in batches to avoid UI freeze
            const batchSize = 10;
            for (let i = 0; i < allElements.length; i += batchSize) {
                const batch = allElements.slice(i, i + batchSize);
                await this.processBatch(batch, targetLanguage);
                
                // Update status
                statusIndicator.textContent = `Translating... (${Math.min(i + batchSize, allElements.length)}/${allElements.length})`;
                await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to keep UI responsive
            }

            // Final update
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

    getAllTextElements() {
        // Get all elements that might contain text
        const elements = Array.from(document.querySelectorAll('body *')).filter(el => {
            // Skip script, style, and other non-content elements
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
                return false;
            }
            
            // Check if element has text content
            return el.textContent.trim().length > 0 || 
                   el.hasAttribute('placeholder') || 
                   el.hasAttribute('title') || 
                   el.hasAttribute('alt') || 
                   el.hasAttribute('aria-label');
        });
        
        // Also include all text nodes
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
        
        return [...elements, ...textNodes];
    }

    async processBatch(batch, targetLanguage) {
        const promises = [];
        
        for (const element of batch) {
            if (element.nodeType === Node.TEXT_NODE) {
                promises.push(this.processTextNode(element, targetLanguage));
            } else {
                promises.push(this.processElement(element, targetLanguage));
            }
        }
        
        await Promise.all(promises);
    }

    async processTextNode(node, targetLanguage) {
        if (!node.originalText) {
            node.originalText = node.textContent;
        }
        node.textContent = await this.translate(node.textContent.trim(), targetLanguage);
    }

    async processElement(element, targetLanguage) {
        // Handle text content
        if (element.textContent.trim() && !element.dataset.originalText) {
            element.dataset.originalText = element.textContent;
            const translated = await this.translate(element.textContent.trim(), targetLanguage);
            
            // Preserve HTML structure if needed
            if (element.children.length > 0) {
                const textNodes = Array.from(element.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                if (textNodes.length > 0) {
                    textNodes[0].textContent = translated;
                    for (let i = 1; i < textNodes.length; i++) {
                        textNodes[i].textContent = '';
                    }
                }
            } else {
                element.textContent = translated;
            }
        }
        
        // Handle attributes
        const attributes = ['placeholder', 'title', 'alt', 'aria-label'];
        for (const attr of attributes) {
            if (element.hasAttribute(attr)) {
                const original = element.getAttribute(`data-original-${attr}`) || element.getAttribute(attr);
                element.setAttribute(`data-original-${attr}`, original);
                const translated = await this.translate(original, targetLanguage);
                element.setAttribute(attr, translated);
            }
        }
        
        // Handle input values
        if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && element.value) {
            if (!element.dataset.originalValue) {
                element.dataset.originalValue = element.value;
            }
            element.value = await this.translate(element.value, targetLanguage);
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
        
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                        this.translationQueue.push({ node, targetLanguage });
                    }
                });
            });
            
            if (!this.isProcessingQueue) {
                this.processQueue();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }

    async processQueue() {
        this.isProcessingQueue = true;
        
        while (this.translationQueue.length > 0) {
            const { node, targetLanguage } = this.translationQueue.shift();
            
            try {
                if (node.nodeType === Node.TEXT_NODE) {
                    await this.processTextNode(node, targetLanguage);
                } else {
                    await this.processElement(node, targetLanguage);
                }
            } catch (error) {
                console.error('Error processing node:', error);
            }
            
            // Small delay to keep UI responsive
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        this.isProcessingQueue = false;
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

        // Reset elements
        document.querySelectorAll('[data-original-text]').forEach(el => {
            el.textContent = el.dataset.originalText;
        });

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

        // Reset input values
        document.querySelectorAll('input, textarea').forEach(el => {
            if (el.dataset.originalValue) {
                el.value = el.dataset.originalValue;
            }
        });

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Clear queue
        this.translationQueue = [];
    }
}

// Initialize translator
const bhashiniTranslator = new BhashiniTranslator();

// Add event listener for translate button
document.getElementById('translateButton').addEventListener('click', () => {
    bhashiniTranslator.translatePage();
});
