class BhashiniTranslator {
    constructor() {
        this.apiEndpoint = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
        this.translationCache = new Map();
        this.observer = null;
        this.isTranslating = false;
        this.translationQueue = [];
    }

    // --- MOCK TRANSLATIONS FOR TESTING (add at the top of the class) ---
    mockTranslations = {
        // Bengali
        'লিগ্যাল লোক': 'Legal Lok',
        'বাংলা': 'Bengali',
        'ড্যাশবোর্ড': 'Dashboard',
        'ফর্ম': 'Forms',
        'Community Forum': 'কমিউনিটি ফোরাম',
        'Legal Institutions': 'আইনি প্রতিষ্ঠান',
        'Petitions': 'আবেদন',
        'Document Converter': 'ডকুমেন্ট কনভার্টার',
        'Settings': 'সেটিংস',
        'Legal Chatbot': 'লিগ্যাল চ্যাটবট',
        'Logout': 'লগআউট',
        'Welcome back, d!': 'স্বাগতম d!',
        "Here's what's happening with your legal matters today.": 'আপনার আইনি বিষয়ে আজ যা ঘটছে',
        'My Profile': 'আমার প্রোফাইল',
        'Member since N/A': 'সদস্য N/A থেকে',
        'Full Name': 'পূর্ণ নাম',
        'Mobile Number': 'মোবাইল নম্বর',
        'Email Address': 'ইমেইল ঠিকানা',
        'User ID': 'ইউজার আইডি',
        'Recent Activities': 'সাম্প্রতিক কার্যক্রম',
        'New Petition Filed': 'নতুন আবেদন দাখিল হয়েছে',
        'Your petition regarding property dispute has been successfully submitted.': 'সম্পত্তি সংক্রান্ত আপনার আবেদন সফলভাবে জমা দেওয়া হয়েছে।',
        '2 hours ago': '২ ঘন্টা আগে',
        'Translate': 'অনুবাদ',
        'd': 'ডি',
        // Hindi
        'लिगल लोक': 'Legal Lok',
        'हिंदी': 'Hindi',
        'डैशबोर्ड': 'Dashboard',
        'फॉर्म': 'Forms',
        'Community Forum': 'सामुदायिक मंच',
        'Legal Institutions': 'कानूनी संस्थान',
        'Petitions': 'याचिकाएँ',
        'Document Converter': 'दस्तावेज़ परिवर्तक',
        'Settings': 'सेटिंग्स',
        'Legal Chatbot': 'लीगल चैटबोट',
        'Logout': 'लॉगआउट',
        'Welcome back, d!': 'वापसी पर स्वागत है, d!',
        "Here's what's happening with your legal matters today.": 'आज आपके कानूनी मामलों में यह हो रहा है।',
        'My Profile': 'मेरा प्रोफ़ाइल',
        'Member since N/A': 'सदस्य N/A से',
        'Full Name': 'पूरा नाम',
        'Mobile Number': 'मोबाइल नंबर',
        'Email Address': 'ईमेल पता',
        'User ID': 'यूज़र आईडी',
        'Recent Activities': 'हाल की गतिविधियाँ',
        'New Petition Filed': 'नई याचिका दायर की गई',
        'Your petition regarding property dispute has been successfully submitted.': 'संपत्ति विवाद से संबंधित आपकी याचिका सफलतापूर्वक जमा कर दी गई है।',
        '2 hours ago': '2 घंटे पहले',
        'Translate': 'अनुवाद',
        'd': 'डी',
        // New UI Strings
        'Explore Templates': {
            'hi': 'टेम्पलेट्स देखें',
            'bn': 'টেমপ্লেট দেখুন'
        },
        'Filter': {
            'hi': 'फ़िल्टर',
            'bn': 'ফিল্টার'
        },
        'Business': {
            'hi': 'व्यापार',
            'bn': 'ব্যবসা'
        },
        'Employment Contract': {
            'hi': 'रोजगार अनुबंध',
            'bn': 'চাকরির চুক্তি'
        },
        'NDA Agreement': {
            'hi': 'एनडीए समझौता',
            'bn': 'এনডিএ চুক্তি'
        },
        'Partnership Agreement': {
            'hi': 'साझेदारी समझौता',
            'bn': 'অংশীদারিত্ব চুক্তি'
        },
        'Healthcare': {
            'hi': 'स्वास्थ्य सेवा',
            'bn': 'স্বাস্থ্যসেবা'
        },
        'Patient Intake': {
            'hi': 'रोगी प्रवेश',
            'bn': 'রোগী ভর্তি'
        },
        'Medical Release': {
            'hi': 'चिकित्सा रिलीज़',
            'bn': 'মেডিকেল রিলিজ'
        },
        'Personal': {
            'hi': 'व्यक्तिगत',
            'bn': 'ব্যক্তিগত'
        },
        'Lease Agreement': {
            'hi': 'पट्टा समझौता',
            'bn': 'লিজ চুক্তি'
        },
        'Vehicle Sale': {
            'hi': 'वाहन बिक्री',
            'bn': 'যানবাহন বিক্রয়'
        },
        // Community Forum UI
        'Community Forum': {
            'hi': 'सामुदायिक मंच',
            'bn': 'কমিউনিটি ফোরাম'
        },
        'Create New Post': {
            'hi': 'नई पोस्ट बनाएं',
            'bn': 'নতুন পোস্ট তৈরি করুন'
        },
        'Posted by d on 14/4/2025': {
            'hi': 'd द्वारा 14/4/2025 को पोस्ट किया गया',
            'bn': 'd দ্বারা ১৪/৪/২০২৫ তারিখে পোস্ট করা হয়েছে'
        },
        'View Discussion': {
            'hi': 'चर्चा देखें',
            'bn': 'আলোচনা দেখুন'
        },
        'Understanding Employment Contracts': {
            'hi': 'रोजगार अनुबंध को समझना',
            'bn': 'চাকরির চুক্তি বোঝা'
        },
        "Hello everyone! I'm new to the legal field and would like to understand more about employment contracts. What are the key elements that should be included in a standard employment con...": {
            'hi': 'नमस्ते सभी! मैं कानूनी क्षेत्र में नया हूँ और रोजगार अनुबंधों के बारे में अधिक जानना चाहता हूँ। एक मानक रोजगार अनुबंध में कौन-कौन से मुख्य तत्व शामिल होने चाहिए?',
            'bn': 'সবাইকে শুভেচ্ছা! আমি আইনি ক্ষেত্রে নতুন এবং চাকরির চুক্তি সম্পর্কে আরও জানতে চাই। একটি স্ট্যান্ডার্ড চাকরির চুক্তিতে কী কী মূল উপাদান থাকা উচিত?'
        },
        'Tips for Filing a Legal Petition': {
            'hi': 'कानूनी याचिका दाखिल करने के लिए सुझाव',
            'bn': 'আইনি আবেদন দাখিলের টিপস'
        },
        "I've been working on filing a legal petition and wanted to share some tips I've learned: 1. Always double-check all personal information 2. Include all relevant dates a...": {
            'hi': 'मैं कानूनी याचिका दाखिल करने पर काम कर रहा हूँ और कुछ सुझाव साझा करना चाहता हूँ: 1. सभी व्यक्तिगत जानकारी दोबारा जांचें 2. सभी प्रासंगिक तिथियाँ शामिल करें...',
            'bn': 'আমি আইনি আবেদন দাখিল করার কাজ করছি এবং কিছু টিপস শেয়ার করতে চাই: ১. সব ব্যক্তিগত তথ্য ভালোভাবে যাচাই করুন ২. সব প্রাসঙ্গিক তারিখ অন্তর্ভুক্ত করুন...'
        },
        'Legal Document Templates - Best Practices': {
            'hi': 'कानूनी दस्तावेज़ टेम्पलेट्स - सर्वोत्तम अभ्यास',
            'bn': 'আইনি ডকুমেন্ট টেমপ্লেট - সেরা অনুশীলন'
        },
        "When using legal document templates, it's important to: - Review the entire document before signing - Understand each clause and its implications - Keep...": {
            'hi': 'कानूनी दस्तावेज़ टेम्पलेट्स का उपयोग करते समय, यह महत्वपूर्ण है: - हस्ताक्षर करने से पहले पूरे दस्तावेज़ की समीक्षा करें - प्रत्येक क्लॉज और उसके प्रभाव को समझें...',
            'bn': 'আইনি ডকুমেন্ট টেমপ্লেট ব্যবহার করার সময়, গুরুত্বপূর্ণ: - স্বাক্ষর করার আগে পুরো ডকুমেন্টটি পর্যালোচনা করুন - প্রতিটি ধারা ও তার প্রভাব বুঝুন...'
        },
        'Common Mistakes in Legal Forms': {
            'hi': 'कानूनी फॉर्म में सामान्य गलतियाँ',
            'bn': 'আইনি ফর্মে সাধারণ ভুল'
        },
        "I've noticed several common mistakes people make when filling out legal forms: 1. Missing signatures 2. Incomplete information 3. Using outdated forms ...": {
            'hi': 'मैंने देखा है कि लोग कानूनी फॉर्म भरते समय कई सामान्य गलतियाँ करते हैं: 1. हस्ताक्षर छूटना 2. अधूरी जानकारी 3. पुराने फॉर्म का उपयोग...',
            'bn': 'আমি লক্ষ্য করেছি যে মানুষ আইনি ফর্ম পূরণ করার সময় কয়েকটি সাধারণ ভুল করে: ১. স্বাক্ষর বাদ পড়া ২. অসম্পূর্ণ তথ্য ৩. পুরনো ফর্ম ব্যবহার...'
        },
    };

    async translate(text, targetLanguage) {
        if (!text || !text.trim()) return text;
        // Check mock translations first
        if (this.mockTranslations[text]) {
            return this.mockTranslations[text];
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
                    pipelineTasks: [
                        {
                            taskType: 'translation',
                            config: {
                                language: {
                                    sourceLanguage: 'en',
                                    targetLanguage: targetLanguage
                                },
                                serviceId: 'bhashini/iiith/nmt-all'
                            }
                        }
                    ],
                    inputData: {
                        input: [
                            { source: text }
                        ],
                        audio: [
                            { audioContent: null }
                        ]
                    }
                })
            });

            console.log('Bhashini API response:', response);
            const data = await response.json();
            console.log('Bhashini API response JSON:', data);
            // Adjust this line if the API response structure is different
            const translatedText = data?.pipelineResponse?.[0]?.output?.[0]?.target || data?.output?.[0]?.target || text;
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
