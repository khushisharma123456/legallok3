class BhashiniTranslator {
    constructor() {
        // Bhashini API configuration
        this.apiEndpoint = '/api/translate';  // Use our proxy endpoint
        this.serviceId = 'ai4bharat/indictrans-v2-all-gpu';
        
        // Cache for storing translations to avoid repeated API calls
        this.translationCache = new Map();
    }async translate(text, targetLanguage) {
        const cacheKey = `${text}_${targetLanguage}`;
        
        // Check cache first
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }        try {
            console.log('Translating:', text, 'to', targetLanguage);
            
            // Add request timeout with AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
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
            return text;
        }
    }    async translatePage() {
        const targetLanguage = document.getElementById('languageSelect').value;
        if (targetLanguage === 'en') {
            // Reset to original content if English is selected
            this.resetOriginalContent();
            return;
        }

        const elements = document.querySelectorAll('[data-translatable]');
        const translateButton = document.getElementById('translateButton');
        translateButton.disabled = true;
        translateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';
        
        // Create status indicator
        let statusIndicator = document.createElement('div');
        statusIndicator.style.position = 'fixed';
        statusIndicator.style.top = '10px';
        statusIndicator.style.right = '10px';
        statusIndicator.style.padding = '8px 16px';
        statusIndicator.style.background = 'rgba(0,0,0,0.7)';
        statusIndicator.style.color = 'white';
        statusIndicator.style.borderRadius = '4px';
        statusIndicator.style.zIndex = '9999';
        statusIndicator.textContent = 'Connecting to translation service...';
        document.body.appendChild(statusIndicator);        try {
            let translatedCount = 0;
            const elements = document.querySelectorAll('[data-translatable]');
            const placeholderElements = document.querySelectorAll('[data-translatable-placeholder]');
            const totalElements = elements.length + placeholderElements.length;
            
            // Translate regular text elements
            for (const element of elements) {
                // Store original text if not already stored
                if (!element.getAttribute('data-original-text')) {
                    element.setAttribute('data-original-text', element.textContent.trim());
                }

                const originalText = element.getAttribute('data-original-text');
                
                // Update status indicator
                statusIndicator.textContent = `Translating (${translatedCount}/${totalElements})...`;
                
                const translatedText = await this.translate(originalText, targetLanguage);
                element.textContent = translatedText;
                translatedCount++;
            }
            
            // Translate placeholder elements
            for (const element of placeholderElements) {
                // Store original placeholder if not already stored
                if (!element.getAttribute('data-original-placeholder')) {
                    element.setAttribute('data-original-placeholder', element.placeholder);
                }

                const originalPlaceholder = element.getAttribute('data-original-placeholder');
                
                // Update status indicator
                statusIndicator.textContent = `Translating (${translatedCount}/${totalElements})...`;
                
                const translatedPlaceholder = await this.translate(originalPlaceholder, targetLanguage);
                element.placeholder = translatedPlaceholder;
                translatedCount++;
            }} catch (error) {
            console.error('Translation error details:', error);
            
            // Show error in status indicator with red background
            statusIndicator.style.background = 'rgba(220,53,69,0.9)';
            statusIndicator.textContent = 'Error: ' + error.message;
            
            // Remove status indicator after 5 seconds
            setTimeout(() => {
                if (document.body.contains(statusIndicator)) {
                    document.body.removeChild(statusIndicator);
                }
            }, 5000);
            
            // Also show alert for accessibility
            alert('Translation failed: ' + error.message);
        } finally {
            translateButton.disabled = false;
            translateButton.innerHTML = '<i class="fas fa-language"></i> Translate';
            
            // If no error occurred, show success and remove status indicator
            if (document.body.contains(statusIndicator) && 
                !statusIndicator.textContent.includes('Error')) {
                statusIndicator.style.background = 'rgba(40,167,69,0.9)';
                statusIndicator.textContent = 'Translation completed!';
                
                setTimeout(() => {
                    if (document.body.contains(statusIndicator)) {
                        document.body.removeChild(statusIndicator);
                    }
                }, 2000);
            }
        }
    }    resetOriginalContent() {
        const elements = document.querySelectorAll('[data-translatable]');
        elements.forEach(element => {
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
            }
        });
        
        const placeholderElements = document.querySelectorAll('[data-translatable-placeholder]');
        placeholderElements.forEach(element => {
            const originalPlaceholder = element.getAttribute('data-original-placeholder');
            if (originalPlaceholder) {
                element.placeholder = originalPlaceholder;
            }
        });
    }
}

// Initialize translator
const bhashiniTranslator = new BhashiniTranslator();
