class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = '/api/translate'; // Your backend endpoint that calls Bhashini API
        this.translationCache = new Map();
        this.observer = null;
        this.isTranslating = false;
        this.translationQueue = [];
        this.isProcessingQueue = false;
        this.currentLanguage = 'en';
    }

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;
        
        // Check cache first
        const cacheKey = `${text}_${targetLanguage}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    sourceLanguage: "en", // Assuming source is always English
                    targetLanguage: targetLanguage
                })
            });

            if (!response.ok) {
                throw new Error(`Translation failed with status ${response.status}`);
            }

            const data = await response.json();
            const translatedText = data.translatedText || text;
            
            // Cache the translation
            this.translationCache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original text if translation fails
        }
    }

    async translatePage() {
        if (this.isTranslating) return;
        
        this.isTranslating = true;
        this.currentLanguage = document.getElementById('languageSelect').value;
        
        // UI updates
        const translateButton = document.getElementById('translateButton');
        const resetButton = document.getElementById('resetTranslation');
        translateButton.disabled = true;
        const originalButtonText = translateButton.innerHTML;
        translateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';
        
        // Show reset button
        resetButton.style.display = 'inline-block';
        
        try {
            // Create status indicator
            const statusIndicator = this.createStatusIndicator('Starting translation...');
            
            // Get all elements with text content
            const elementsToTranslate = this.getAllTextElements();
            
            // Process in batches to avoid UI freeze
            const batchSize = 5;
            for (let i = 0; i < elementsToTranslate.length; i += batchSize) {
                const batch = elementsToTranslate.slice(i, i + batchSize);
                await this.processTranslationBatch(batch, this.currentLanguage);
                
                // Update status
                statusIndicator.textContent = `Translating... ${Math.min(i + batchSize, elementsToTranslate.length)}/${elementsToTranslate.length}`;
                
                // Small delay to keep UI responsive
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Start observing DOM changes for dynamic content
            this.startObservation(this.currentLanguage);
            
            // Update status
            statusIndicator.textContent = 'Translation complete!';
            statusIndicator.style.backgroundColor = '#4CAF50';
            setTimeout(() => statusIndicator.remove(), 2000);
            
        } catch (error) {
            console.error('Page translation error:', error);
            const statusIndicator = this.createStatusIndicator('Translation failed!');
            statusIndicator.style.backgroundColor = '#F44336';
            setTimeout(() => statusIndicator.remove(), 3000);
        } finally {
            translateButton.disabled = false;
            translateButton.innerHTML = originalButtonText;
            this.isTranslating = false;
        }
    }

    getAllTextElements() {
        const selectors = [
            'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'a', 'li', 'td', 'th', 'label', 'button', 'input[type="text"]',
            'input[type="submit"]', 'textarea', 'option', 'strong', 'em',
            'title', 'figcaption', 'blockquote', 'pre', 'code'
        ];
        
        let elements = [];
        
        // Get elements by selector
        selectors.forEach(selector => {
            elements = [...elements, ...document.querySelectorAll(selector)];
        });
        
        // Get all text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip empty text nodes and those inside script/style tags
                    if (!node.textContent.trim() || 
                        node.parentNode.nodeName === 'SCRIPT' || 
                        node.parentNode.nodeName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );
        
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        
        // Filter elements that have text content or translatable attributes
        return [...elements, ...textNodes].filter(el => {
            if (el.nodeType === Node.TEXT_NODE) {
                return el.textContent.trim().length > 0;
            }
            
            // For elements, check if they have text content or translatable attributes
            return el.textContent.trim().length > 0 || 
                   el.hasAttribute('placeholder') || 
                   el.hasAttribute('title') || 
                   el.hasAttribute('alt') || 
                   el.hasAttribute('aria-label');
        });
    }

    async processTranslationBatch(batch, targetLanguage) {
        const promises = [];
        
        for (const element of batch) {
            if (element.nodeType === Node.TEXT_NODE) {
                promises.push(this.translateTextNode(element, targetLanguage));
            } else {
                promises.push(this.translateElement(element, targetLanguage));
            }
        }
        
        await Promise.all(promises);
    }

    async translateTextNode(node, targetLanguage) {
        if (!node.originalText) {
            node.originalText = node.textContent;
        }
        
        const translatedText = await this.translate(node.textContent.trim(), targetLanguage);
        node.textContent = translatedText;
    }

    async translateElement(element, targetLanguage) {
        // Store original content if not already stored
        if (!element.dataset.originalText && element.textContent.trim()) {
            element.dataset.originalText = element.textContent;
        }
        
        // Translate text content
        if (element.textContent.trim()) {
            const translatedText = await this.translate(element.textContent.trim(), targetLanguage);
            
            // Preserve HTML structure if element has children
            if (element.children.length > 0) {
                const textNodes = Array.from(element.childNodes).filter(n => 
                    n.nodeType === Node.TEXT_NODE && n.textContent.trim()
                );
                
                if (textNodes.length > 0) {
                    textNodes[0].textContent = translatedText;
                    for (let i = 1; i < textNodes.length; i++) {
                        textNodes[i].textContent = '';
                    }
                }
            } else {
                element.textContent = translatedText;
            }
        }
        
        // Translate attributes
        const attributes = ['placeholder', 'title', 'alt', 'aria-label'];
        for (const attr of attributes) {
            if (element.hasAttribute(attr)) {
                const originalValue = element.getAttribute(`data-original-${attr}`) || element.getAttribute(attr);
                element.setAttribute(`data-original-${attr}`, originalValue);
                const translatedValue = await this.translate(originalValue, targetLanguage);
                element.setAttribute(attr, translatedValue);
            }
        }
        
        // Translate input/textarea values
        if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && element.value) {
            if (!element.dataset.originalValue) {
                element.dataset.originalValue = element.value;
            }
            element.value = await this.translate(element.value, targetLanguage);
        }
    }

    startObservation(targetLanguage) {
        if (this.observer) this.observer.disconnect();
        
        this.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                        this.translationQueue.push({ node, targetLanguage });
                    }
                });
            });
            
            if (!this.isProcessingQueue && this.translationQueue.length > 0) {
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
                    await this.translateTextNode(node, targetLanguage);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    await this.translateElement(node, targetLanguage);
                }
            } catch (error) {
                console.error('Error processing node in queue:', error);
            }
            
            // Small delay to keep UI responsive
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        this.isProcessingQueue = false;
    }

    resetTranslation() {
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
                const originalValue = el.getAttribute(`data-original-${attr}`);
                if (originalValue) {
                    el.setAttribute(attr, originalValue);
                    el.removeAttribute(`data-original-${attr}`);
                }
            }
        });
        
        // Reset input values
        document.querySelectorAll('input, textarea').forEach(el => {
            if (el.dataset.originalValue) {
                el.value = el.dataset.originalValue;
                el.removeAttribute('data-original-value');
            }
        });
        
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Hide reset button
        document.getElementById('resetTranslation').style.display = 'none';
        
        // Show status
        const statusIndicator = this.createStatusIndicator('Translation reset to English');
        statusIndicator.style.backgroundColor = '#2196F3';
        setTimeout(() => statusIndicator.remove(), 2000);
    }

    createStatusIndicator(text) {
        const indicator = document.createElement('div');
        indicator.style.position = 'fixed';
        indicator.style.bottom = '20px';
        indicator.style.right = '20px';
        indicator.style.padding = '10px 20px';
        indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        indicator.style.color = 'white';
        indicator.style.borderRadius = '5px';
        indicator.style.zIndex = '9999';
        indicator.style.fontFamily = 'Arial, sans-serif';
        indicator.style.fontSize = '14px';
        indicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        indicator.textContent = text;
        document.body.appendChild(indicator);
        return indicator;
    }
}

// Initialize translator
const translator = new BhashiniTranslator();

// Add event listeners
document.getElementById('translateButton').addEventListener('click', () => {
    translator.translatePage();
});

document.getElementById('resetTranslation').addEventListener('click', () => {
    translator.resetTranslation();
});

// Add language change handler
document.getElementById('languageSelect').addEventListener('change', () => {
    document.getElementById('resetTranslation').style.display = 'inline-block';
});
