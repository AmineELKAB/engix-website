// Pi5 Configuration - Update these settings for your Pi5 device
const PI5_CONFIG = {
    // Pi5 Device Settings
    device: {
        host: 'localhost', // Use localhost for local testing
        port: '8080', // Pi5 web server port
        timeout: 5000, // Request timeout in milliseconds
        checkInterval: 30000 // Connection check interval in milliseconds
    },
    
    // API Endpoints (adjust if your Pi5 uses different endpoints)
    endpoints: {
        status: '/api/status',      // Device health/status endpoint
        serial: '/api/serial',      // Serial number endpoint
        network: '/api/network',    // Network connectivity endpoint
        cpuinfo: '/api/cpuinfo'     // CPU info endpoint (fallback for serial)
    },
    
    // Fallback Settings
    fallback: {
        enabled: true,              // Enable fallback methods
        useCpuInfo: true,          // Try to get serial from /proc/cpuinfo
        mockOnFailure: false       // Use mock data if all real methods fail
    },
    
    // Debug Settings
    debug: {
        enabled: true,              // Enable debug logging
        logRequests: true,         // Log all API requests
        logResponses: true         // Log API responses
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PI5_CONFIG;
}
