// Configuration file for engix.dev website
const CONFIG = {
    // Form handling configuration
    form: {
        // Formspree configuration (free form handling service)
        formspree: {
            endpoint: 'https://formspree.io/f/YOUR_FORM_ID', // Replace with your actual form ID
            enabled: true
        },
        
        // Alternative: SendGrid configuration
        sendgrid: {
            endpoint: '/api/contact',
            enabled: false,
            apiKey: 'YOUR_SENDGRID_API_KEY' // Replace with your actual API key
        },
        
        // Form validation settings
        validation: {
            rateLimitMs: 5000, // 5 seconds between submissions
            maxRequestLength: 1000 // Maximum characters for request field
        }
    },
    
    // Email notification settings
    email: {
        ownerEmail: 'your-email@example.com', // Replace with your actual email
        subjectPrefix: '[Engix] ',
        autoReply: true
    },
    
    // Spam protection settings
    spamProtection: {
        honeypotEnabled: true,
        rateLimitEnabled: true,
        maxSubmissionsPerHour: 10
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
