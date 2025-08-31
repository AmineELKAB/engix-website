// Performance monitoring and optimization for engix.dev
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        // Wait for page load to complete
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.measurePerformance());
        } else {
            this.measurePerformance();
        }

        // Monitor performance after page is fully loaded
        window.addEventListener('load', () => this.measureLoadPerformance());
    }

    measurePerformance() {
        // Measure DOM content loaded time
        const domContentLoaded = performance.getEntriesByType('navigation')[0];
        if (domContentLoaded) {
            this.metrics.domContentLoaded = domContentLoaded.domContentLoadedEventEnd - domContentLoaded.domContentLoadedEventStart;
        }

        // Measure first paint and first contentful paint
        if ('PerformanceObserver' in window) {
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-paint') {
                        this.metrics.firstPaint = entry.startTime;
                    }
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.firstContentfulPaint = entry.startTime;
                    }
                }
            });
            paintObserver.observe({ entryTypes: ['paint'] });
        }

        // Measure largest contentful paint
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.largestContentfulPaint = lastEntry.startTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    measureLoadPerformance() {
        // Measure total page load time
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
            this.metrics.totalTime = navigation.loadEventEnd - navigation.fetchStart;
        }

        // Log performance metrics
        this.logMetrics();
    }

    logMetrics() {
        console.log('🚀 Performance Metrics:', {
            'DOM Content Loaded': `${this.metrics.domContentLoaded?.toFixed(2)}ms`,
            'First Paint': `${this.metrics.firstPaint?.toFixed(2)}ms`,
            'First Contentful Paint': `${this.metrics.firstContentfulPaint?.toFixed(2)}ms`,
            'Largest Contentful Paint': `${this.metrics.largestContentfulPaint?.toFixed(2)}ms`,
            'Page Load Time': `${this.metrics.pageLoadTime?.toFixed(2)}ms`,
            'Total Time': `${this.metrics.totalTime?.toFixed(2)}ms`
        });

        // Send metrics to analytics if available
        this.sendMetricsToAnalytics();
    }

    sendMetricsToAnalytics() {
        // Example: Send to Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metrics', {
                event_category: 'performance',
                value: Math.round(this.metrics.totalTime || 0),
                custom_parameters: {
                    dom_content_loaded: Math.round(this.metrics.domContentLoaded || 0),
                    first_paint: Math.round(this.metrics.firstPaint || 0),
                    first_contentful_paint: Math.round(this.metrics.firstContentfulPaint || 0),
                    largest_contentful_paint: Math.round(this.metrics.largestContentfulPaint || 0)
                }
            });
        }
    }

    // Optimize images for better performance
    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Add loading="lazy" for images below the fold
            if (img.getBoundingClientRect().top > window.innerHeight) {
                img.loading = 'lazy';
            }

            // Add decoding="async" for better performance
            img.decoding = 'async';
        });
    }

    // Preload critical resources
    preloadCriticalResources() {
        // Preload critical fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);

        // Preload critical CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'preload';
        cssLink.href = 'styles.css';
        cssLink.as = 'style';
        document.head.appendChild(cssLink);
    }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();

// Optimize images after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    performanceMonitor.optimizeImages();
});

// Preload critical resources
performanceMonitor.preloadCriticalResources();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
