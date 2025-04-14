// Theme manager functionality
const themeManager = {
    init() {
        const themeToggle = document.querySelector('.theme-toggle');
        const themeIcon = themeToggle.querySelector('i');
        
        // Update theme icon based on current theme
        const updateIcon = (isDark) => {
            themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        };

        // Set initial icon state
        updateIcon(document.documentElement.getAttribute('data-theme') === 'dark');

        // Handle theme toggle
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme === 'dark');
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => themeManager.init());
