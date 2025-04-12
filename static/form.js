document.addEventListener('DOMContentLoaded', function() {
    // Show More functionality
    const showMoreButtons = document.querySelectorAll('.show-more-btn');
    
    showMoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const formsList = this.closest('ul');
            const hiddenForms = formsList.querySelectorAll('.hidden-form');
            
            hiddenForms.forEach(form => {
                form.classList.remove('hidden-form');
            });
            
            // Hide the show more button after clicking
            this.closest('li').style.display = 'none';
        });
    });
    
    // Form action buttons functionality
    document.querySelectorAll('.fill-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const formName = this.closest('.form-item').querySelector('.form-name').textContent;
            alert(`Opening form filler for: ${formName}`);
        });
    });
    
    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const formName = this.closest('.form-item').querySelector('.form-name').textContent;
            alert(`Previewing: ${formName}`);
        });
    });
    
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const formName = this.closest('.form-item').querySelector('.form-name').textContent;
            alert(`Downloading: ${formName}`);
        });
    });
    // Filter dropdown functionality
    const filterButton = document.getElementById('filter-button');
    const filterOptions = document.getElementById('filter-options');
    const filterOptionItems = document.querySelectorAll('.filter-option');
    
    filterButton.addEventListener('click', function() {
        filterOptions.classList.toggle('show');
    });
    
    // Close filter dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!filterButton.contains(e.target) && !filterOptions.contains(e.target)) {
            filterOptions.classList.remove('show');
        }
    });
    
    // Filter option selection
    filterOptionItems.forEach(option => {
        option.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active state
            filterOptionItems.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            // Update button text
            filterButton.querySelector('span').textContent = this.textContent;
            
            // Filter forms
            filterForms(category);
            
            // Close dropdown
            filterOptions.classList.remove('show');
        });
    });
    
    // Search functionality would be implemented here
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', function() {
        // Filter logic would go here
        
    });
});