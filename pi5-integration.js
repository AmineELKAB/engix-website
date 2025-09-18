// Pi5 Integration Service - Version 1.0
// This service handles Pi5 device connection and status checking

class Pi5Integration {
    constructor() {
        this.isConnected = false;
        this.serialNumber = null;
        this.lastCheckTime = null;
        this.checkInterval = null;
        
        // Use Pi5 configuration
        this.config = PI5_CONFIG;
    }

    /**
     * Initialize Pi5 connection monitoring
     */
    async initialize() {
        console.log('Initializing Pi5 integration...');
        
        try {
            // Get Pi5 serial number first
            await this.getPi5SerialNumber();
            
            // Start periodic connection checking
            this.startConnectionMonitoring();
            
            console.log('Pi5 integration initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Pi5 integration:', error);
            return false;
        }
    }

    /**
     * Get Pi5 serial number from real device
     */
    async getPi5SerialNumber() {
        try {
            console.log('Fetching real Pi5 serial number...');
            
            const serialUrl = `http://${this.config.device.host}:${this.config.device.port}${this.config.endpoints.serial}`;
            
            if (this.config.debug.enabled && this.config.debug.logRequests) {
                console.log('Requesting Pi5 serial from:', serialUrl);
            }
            
            const response = await fetch(serialUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.config.device.timeout)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (this.config.debug.enabled && this.config.debug.logResponses) {
                console.log('Pi5 serial response:', data);
            }
            
            if (data.serialNumber) {
                this.serialNumber = data.serialNumber;
                console.log('Real Pi5 Serial Number:', this.serialNumber);
                return this.serialNumber;
            } else {
                throw new Error('No serial number in response');
            }
            
        } catch (error) {
            console.error('Failed to get real Pi5 serial number:', error);
            
            // Fallback: Try to get serial from /proc/cpuinfo (if Pi5 has a web interface for this)
            try {
                const fallbackSerial = await this.getSerialFromCpuInfo();
                if (fallbackSerial) {
                    this.serialNumber = fallbackSerial;
                    console.log('Pi5 Serial Number (fallback):', this.serialNumber);
                    return this.serialNumber;
                }
            } catch (fallbackError) {
                console.error('Fallback serial retrieval failed:', fallbackError);
            }
            
            this.serialNumber = 'UNKNOWN';
            return null;
        }
    }

    /**
     * Check Pi5 internet connection
     */
    async checkConnection() {
        try {
            console.log('Checking real Pi5 internet connection...');
            
            // Check Pi5 device status
            const deviceStatus = await this.checkPi5DeviceStatus();
            
            // Check Pi5 network connectivity
            const networkStatus = await this.checkPi5NetworkStatus();
            
            // Pi5 is connected if both device is reachable and has internet
            const isConnected = deviceStatus.reachable && networkStatus.hasInternet;
            
            this.isConnected = isConnected;
            this.lastCheckTime = new Date();
            
            console.log('Pi5 Connection Status:', isConnected ? 'CONNECTED' : 'DISCONNECTED');
            console.log('Device Reachable:', deviceStatus.reachable);
            console.log('Has Internet:', networkStatus.hasInternet);
            
            return {
                connected: this.isConnected,
                timestamp: this.lastCheckTime,
                serialNumber: this.serialNumber,
                deviceStatus: deviceStatus,
                networkStatus: networkStatus
            };
        } catch (error) {
            console.error('Failed to check Pi5 connection:', error);
            this.isConnected = false;
            return {
                connected: false,
                timestamp: new Date(),
                serialNumber: this.serialNumber,
                error: error.message
            };
        }
    }

    /**
     * Start periodic connection monitoring
     */
    startConnectionMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(async () => {
            await this.checkConnection();
            // Trigger UI update
            this.onConnectionStatusChange({
                connected: this.isConnected,
                timestamp: this.lastCheckTime,
                serialNumber: this.serialNumber
            });
        }, this.config.device.checkInterval);
        
        console.log('Pi5 connection monitoring started');
    }

    /**
     * Stop connection monitoring
     */
    stopConnectionMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('Pi5 connection monitoring stopped');
        }
    }

    /**
     * Get current Pi5 status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            serialNumber: this.serialNumber,
            lastCheckTime: this.lastCheckTime,
            isMonitoring: !!this.checkInterval
        };
    }

    /**
     * Check Pi5 device status (ping/health check)
     */
    async checkPi5DeviceStatus() {
        try {
            const statusUrl = `http://${this.config.device.host}:${this.config.device.port}${this.config.endpoints.status}`;
            
            if (this.config.debug.enabled && this.config.debug.logRequests) {
                console.log('Requesting Pi5 status from:', statusUrl);
            }
            
            const response = await fetch(statusUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.config.device.timeout)
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    reachable: true,
                    status: data.status || 'online',
                    uptime: data.uptime,
                    temperature: data.temperature,
                    cpuUsage: data.cpuUsage
                };
            } else {
                return {
                    reachable: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
        } catch (error) {
            console.error('Pi5 device status check failed:', error);
            return {
                reachable: false,
                error: error.message
            };
        }
    }

    /**
     * Check Pi5 network connectivity (internet access)
     */
    async checkPi5NetworkStatus() {
        try {
            const networkUrl = `http://${this.config.device.host}:${this.config.device.port}${this.config.endpoints.network}`;
            
            if (this.config.debug.enabled && this.config.debug.logRequests) {
                console.log('Requesting Pi5 network status from:', networkUrl);
            }
            
            const response = await fetch(networkUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.config.device.timeout)
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    hasInternet: data.hasInternet || false,
                    ipAddress: data.ipAddress,
                    gateway: data.gateway,
                    dns: data.dns,
                    speed: data.speed
                };
            } else {
                return {
                    hasInternet: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
        } catch (error) {
            console.error('Pi5 network status check failed:', error);
            return {
                hasInternet: false,
                error: error.message
            };
        }
    }

    /**
     * Fallback method to get serial number from /proc/cpuinfo
     */
    async getSerialFromCpuInfo() {
        try {
            const cpuInfoUrl = `http://${this.config.device.host}:${this.config.device.port}${this.config.endpoints.cpuinfo}`;
            
            if (this.config.debug.enabled && this.config.debug.logRequests) {
                console.log('Requesting Pi5 cpuinfo from:', cpuInfoUrl);
            }
            
            const response = await fetch(cpuInfoUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.config.device.timeout)
            });
            
            if (response.ok) {
                const data = await response.json();
                // Look for serial number in cpuinfo data
                if (data.serial) {
                    return data.serial;
                }
            }
            return null;
        } catch (error) {
            console.error('Failed to get serial from cpuinfo:', error);
            return null;
        }
    }

    /**
     * Generate mock serial number
     */
    generateMockSerialNumber() {
        // Generate a realistic-looking Pi5 serial number
        const prefix = 'Pi5-';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${timestamp}-${random}`;
    }

    /**
     * Utility function to add delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Callback for connection status changes
     */
    onConnectionStatusChange(status) {
        // This will be overridden by the main app
        console.log('Connection status changed:', status);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopConnectionMonitoring();
        this.isConnected = false;
        this.serialNumber = null;
        this.lastCheckTime = null;
        console.log('Pi5 integration destroyed');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pi5Integration;
}
