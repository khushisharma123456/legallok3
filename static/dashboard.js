// Previous JavaScript remains the same
        
        // News API Integration
        const articlesContainer = document.getElementById('articles-container');
        const loadMoreBtn = document.getElementById('load-more');
        let currentOffset = 0;
        const limit = 6; // Number of articles to load at a time
        
        // Function to fetch news articles
        async function fetchNewsArticles(offset = 0) {
            try {
                // In a real implementation, you would call your actual API endpoint
                // This is a mock implementation using your sample response structure
                const mockResponse = {
                    "pagination": {
                        "limit": limit,
                        "offset": offset,
                        "count": limit,
                        "total": 293
                    },
                    "data": [
                        {
                            "author": "Legal News Network",
                            "title": "Supreme Court Rules on Landmark Privacy Case",
                            "description": "The Supreme Court issued a major ruling today that strengthens digital privacy protections for citizens.",
                            "url": "#",
                            "source": "Supreme Court Journal",
                            "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                            "category": "legal",
                            "published_at": new Date().toISOString()
                        },
                        {
                            "author": "Civil Rights Watch",
                            "title": "New Tenant Protection Laws Take Effect",
                            "description": "Several states have implemented new laws providing additional protections for renters facing eviction.",
                            "url": "#",
                            "source": "Housing Law Review",
                            "image": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                            "category": "housing",
                            "published_at": new Date().toISOString()
                        },
                        {
                            "author": "Corporate Law Team",
                            "title": "Changes to Corporate Tax Legislation",
                            "description": "The government has proposed significant changes to corporate tax laws that could affect businesses of all sizes.",
                            "url": "#",
                            "source": "Business Law Today",
                            "image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                            "category": "business",
                            "published_at": new Date().toISOString()
                        },
                        {
                            "author": "Family Law Association",
                            "title": "Mediation Now Required in Custody Cases",
                            "description": "New legislation mandates mediation attempts before custody cases can proceed to court.",
                            "url": "#",
                            "source": "Family Law Journal",
                            "image": "https://images.unsplash.com/photo-1581539250439-c96689b516dd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                            "category": "family",
                            "published_at": new Date().toISOString()
                        },
                        {
                            "author": "Criminal Defense Network",
                            "title": "Bail Reform: What You Need to Know",
                            "description": "Recent changes to bail procedures are affecting how defendants are processed through the system.",
                            "url": "#",
                            "source": "Criminal Law Review",
                            "image": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                            "category": "criminal",
                            "published_at": new Date().toISOString()
                        },
                        {
                            "author": "Intellectual Property Office",
                            "title": "Trademark Law Updates for Digital Content",
                            "description": "New guidelines address how trademark law applies to digital content creators and influencers.",
                            "url": "#",
                            "source": "IP Law Bulletin",
                            "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                            "category": "intellectual-property",
                            "published_at": new Date().toISOString()
                        }
                    ]
                };
                
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));
                
                return mockResponse;
            } catch (error) {
                console.error('Error fetching news articles:', error);
                return { data: [] };
            }
        }
        
        // Function to render articles
        function renderArticles(articles) {
            if (articles.length === 0) {
                articlesContainer.innerHTML = '<div class="loading-articles">No articles found</div>';
                return;
            }
            
            // Remove loading message if it exists
            const loadingMessage = articlesContainer.querySelector('.loading-articles');
            if (loadingMessage) {
                loadingMessage.remove();
            }
            
            articles.forEach(article => {
                const articleCard = document.createElement('div');
                articleCard.className = 'article-card';
                articleCard.innerHTML = `
                    <div class="article-image">
                        ${article.image ? 
                            `<img src="${article.image}" alt="${article.title}">` : 
                            `<i class="fas fa-newspaper placeholder-icon"></i>`
                        }
                    </div>
                    <div class="article-content">
                        <span class="article-source">${article.source}</span>
                        <h3>${article.title}</h3>
                        <p>${article.description}</p>
                        <div class="article-meta">
                            <span>${formatDate(article.published_at)}</span>
                            <span>By ${article.author || 'Legal Lok'}</span>
                        </div>
                    </div>
                `;
                
                // Add click handler to open article (in real app would open URL)
                articleCard.addEventListener('click', () => {
                    alert(`Would open: ${article.title}`);
                    // window.open(article.url, '_blank');
                });
                
                articlesContainer.appendChild(articleCard);
            });
        }
        
        // Format date
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }
        
        // Initial load
        async function loadArticles() {
            const response = await fetchNewsArticles(currentOffset);
            renderArticles(response.data);
            currentOffset += limit;
            
            // Show/hide load more button
            loadMoreBtn.style.display = currentOffset < response.pagination.total ? 'block' : 'none';
        }
        
        // Load more articles
        loadMoreBtn.addEventListener('click', async () => {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            const response = await fetchNewsArticles(currentOffset);
            renderArticles(response.data);
            currentOffset += limit;
            
            // Show/hide load more button
            loadMoreBtn.style.display = currentOffset < response.pagination.total ? 'block' : 'none';
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load More Articles';
        });
        
        // Initialize
        document.addEventListener('DOMContentLoaded', loadArticles);