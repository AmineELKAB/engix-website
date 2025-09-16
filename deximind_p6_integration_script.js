<!-- DexiMind P6 UI Integration Script -->
<script>
(function() {
    // DexiMind P6 UI Integration
    const DEXIMIND_UI_CONFIG = {
        apiUrl: 'http://localhost:8001',
        wsUrl: 'ws://localhost:8001/ws',
        version: '1.0.0',
        features: {
            taskManagement: true,
            systemMonitoring: true,
            realTimeUpdates: true,
            killSwitch: true,
            userFeedback: true
        }
    };
    
    // Load DexiMind P6 UI
    function loadDexiMindUI() {
        const container = document.createElement('div');
        container.id = 'deximind-p6-ui';
        container.innerHTML = `
            <div id="deximind-ui-panel" style="
                position: fixed;
                top: 0;
                right: 0;
                width: 400px;
                height: 100vh;
                background: #f8f9fa;
                border-left: 1px solid #dee2e6;
                z-index: 10000;
                overflow-y: auto;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            ">
                <!-- Header -->
                <div style="
                    background: #007bff;
                    color: white;
                    padding: 15px;
                    text-align: center;
                    border-bottom: 1px solid #0056b3;
                ">
                    <h2 style="margin: 0; font-size: 18px;">DexiMind AI Agent</h2>
                    <div id="connection-status" style="font-size: 12px; margin-top: 5px;">Connecting...</div>
                </div>
                
                <!-- Task Queue -->
                <div class="ui-section" style="padding: 15px; border-bottom: 1px solid #dee2e6;">
                    <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">Task Queue</h3>
                    <div id="task-input" style="margin-bottom: 10px;">
                        <input type="text" id="command-input" placeholder="Enter your command..." 
                               style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px;">
                        <button id="submit-command" style="
                            width: 100%; 
                            padding: 8px; 
                            margin-top: 5px;
                            background: #007bff; 
                            color: white; 
                            border: none; 
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Submit Task</button>
                    </div>
                    <div id="task-list" style="max-height: 200px; overflow-y: auto;"></div>
                </div>
                
                <!-- System Status -->
                <div class="ui-section" style="padding: 15px; border-bottom: 1px solid #dee2e6;">
                    <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">System Status</h3>
                    <div id="status-indicators"></div>
                </div>
                
                <!-- Performance Metrics -->
                <div class="ui-section" style="padding: 15px; border-bottom: 1px solid #dee2e6;">
                    <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">Performance</h3>
                    <div id="metrics-display"></div>
                </div>
                
                <!-- Emergency Controls -->
                <div class="ui-section" style="padding: 15px; border-bottom: 1px solid #dee2e6;">
                    <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">Emergency Controls</h3>
                    <button id="kill-switch-btn" style="
                        width: 100%; 
                        padding: 10px; 
                        background: #dc3545; 
                        color: white; 
                        border: none; 
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">Emergency Stop</button>
                </div>
                
                <!-- Notifications -->
                <div class="ui-section" style="padding: 15px;">
                    <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">Notifications</h3>
                    <div id="notification-list" style="max-height: 150px; overflow-y: auto;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Initialize UI
        initDexiMindUI();
    }
    
    function initDexiMindUI() {
        const ui = new DexiMindP6UI();
        window.deximindUI = ui;
    }
    
    class DexiMindP6UI {
        constructor() {
            this.ws = null;
            this.connected = false;
            this.tasks = [];
            this.systemStatus = {};
            this.performanceMetrics = {};
            this.notifications = [];
            
            this.init();
        }
        
        init() {
            this.connectWebSocket();
            this.setupEventListeners();
            this.startUIUpdates();
        }
        
        connectWebSocket() {
            this.ws = new WebSocket(DEXIMIND_UI_CONFIG.wsUrl);
            
            this.ws.onopen = () => {
                this.connected = true;
                console.log('Connected to DexiMind P6 UI');
                this.updateConnectionStatus('Connected', '#28a745');
                this.addNotification({
                    type: 'success',
                    title: 'Connected',
                    message: 'Successfully connected to DexiMind AI Agent'
                });
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.ws.onclose = () => {
                this.connected = false;
                console.log('Disconnected from DexiMind P6 UI');
                this.updateConnectionStatus('Disconnected', '#dc3545');
                this.addNotification({
                    type: 'warning',
                    title: 'Disconnected',
                    message: 'Connection lost. Attempting to reconnect...'
                });
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('Error', '#dc3545');
                this.addNotification({
                    type: 'error',
                    title: 'Connection Error',
                    message: 'Failed to connect to DexiMind API. Make sure the server is running on localhost:8001'
                });
            };
        }
        
        setupEventListeners() {
            // Command input
            document.getElementById('submit-command').addEventListener('click', () => {
                const command = document.getElementById('command-input').value;
                if (command.trim()) {
                    this.createTask(command);
                    document.getElementById('command-input').value = '';
                }
            });
            
            // Enter key support
            document.getElementById('command-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const command = document.getElementById('command-input').value;
                    if (command.trim()) {
                        this.createTask(command);
                        document.getElementById('command-input').value = '';
                    }
                }
            });
            
            // Kill switch
            document.getElementById('kill-switch-btn').addEventListener('click', () => {
                const reason = prompt('Reason for emergency stop:');
                if (reason) {
                    this.activateKillSwitch(reason);
                }
            });
        }
        
        handleMessage(data) {
            switch (data.type) {
                case 'task_update':
                    this.updateTask(data.data);
                    break;
                case 'system_status':
                    this.updateSystemStatus(data.data);
                    break;
                case 'performance_metrics':
                    this.updatePerformanceMetrics(data.data);
                    break;
                case 'kill_switch_activated':
                    this.handleKillSwitchActivated(data.data);
                    break;
                case 'notification':
                    this.addNotification(data.data);
                    break;
                case 'alert':
                    this.addNotification(data.data);
                    break;
            }
        }
        
        async createTask(command) {
            if (!this.connected) {
                alert('Not connected to DexiMind API. Make sure the server is running on localhost:8001');
                return;
            }
            
            const message = {
                type: 'create_task',
                data: { command, user_id: 'web_user', priority: 5 }
            };
            
            this.ws.send(JSON.stringify(message));
            this.addNotification({
                type: 'info',
                title: 'Task Created',
                message: `Created task: ${command}`
            });
        }
        
        updateTask(task) {
            const existingIndex = this.tasks.findIndex(t => t.task_id === task.task_id);
            if (existingIndex >= 0) {
                this.tasks[existingIndex] = task;
            } else {
                this.tasks.push(task);
            }
            this.renderTasks();
        }
        
        updateSystemStatus(status) {
            this.systemStatus = status;
            this.renderSystemStatus();
        }
        
        updatePerformanceMetrics(metrics) {
            this.performanceMetrics = metrics;
            this.renderPerformanceMetrics();
        }
        
        handleKillSwitchActivated(data) {
            this.addNotification({
                type: 'critical',
                title: 'Kill Switch Activated',
                message: `System disabled: ${data.reason}`
            });
        }
        
        addNotification(notification) {
            notification.id = Date.now() + Math.random();
            notification.timestamp = new Date().toLocaleTimeString();
            this.notifications.unshift(notification);
            if (this.notifications.length > 20) {
                this.notifications = this.notifications.slice(0, 20);
            }
            this.renderNotifications();
        }
        
        renderTasks() {
            const container = document.getElementById('task-list');
            if (!container) return;
            
            container.innerHTML = this.tasks.map(task => `
                <div class="task-item" style="
                    border: 1px solid #ddd; 
                    margin: 5px 0; 
                    padding: 8px; 
                    border-radius: 4px;
                    background: white;
                    font-size: 12px;
                ">
                    <div style="font-weight: bold; margin-bottom: 4px;">${task.command}</div>
                    <div>Status: <span class="status-${task.status}" style="font-weight: bold;">${task.status}</span></div>
                    <div>Progress: ${task.progress || 0}%</div>
                    ${task.status === 'running' ? '<button onclick="deximindUI.cancelTask(\'' + task.task_id + '\')" style="margin-top: 4px; padding: 2px 6px; font-size: 10px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer;">Cancel</button>' : ''}
                </div>
            `).join('');
        }
        
        renderSystemStatus() {
            const container = document.getElementById('status-indicators');
            if (!container) return;
            
            const status = this.systemStatus.status || 'unknown';
            const statusColor = {
                'healthy': '#28a745',
                'warning': '#ffc107',
                'error': '#dc3545',
                'critical': '#dc3545'
            }[status] || '#6c757d';
            
            container.innerHTML = `
                <div style="padding: 8px; background: ${statusColor}; color: white; border-radius: 4px; margin: 5px 0; text-align: center; font-weight: bold;">
                    Status: ${status.toUpperCase()}
                </div>
                <div style="font-size: 12px; margin: 2px 0;">Components: ${Object.keys(this.systemStatus.components || {}).length}</div>
                <div style="font-size: 12px; margin: 2px 0;">Active Tasks: ${this.systemStatus.performance?.active_tasks || 0}</div>
            `;
        }
        
        renderPerformanceMetrics() {
            const container = document.getElementById('metrics-display');
            if (!container) return;
            
            const metrics = this.performanceMetrics;
            
            container.innerHTML = `
                <div style="font-size: 12px; margin: 2px 0;">CPU: ${metrics.cpu_percent || 0}%</div>
                <div style="font-size: 12px; margin: 2px 0;">Memory: ${metrics.memory_percent || 0}%</div>
                <div style="font-size: 12px; margin: 2px 0;">Latency P80: ${metrics.latency_p80 || 0}ms</div>
                <div style="font-size: 12px; margin: 2px 0;">Accuracy: ${metrics.accuracy || 0}%</div>
            `;
        }
        
        renderNotifications() {
            const container = document.getElementById('notification-list');
            if (!container) return;
            
            container.innerHTML = this.notifications.slice(0, 10).map(notif => `
                <div class="notification" style="
                    padding: 6px; 
                    margin: 3px 0; 
                    background: #f8f9fa; 
                    border-left: 3px solid #007bff; 
                    border-radius: 2px;
                    font-size: 11px;
                ">
                    <div style="font-weight: bold;">${notif.title}</div>
                    <div>${notif.message}</div>
                    <div style="color: #6c757d; font-size: 10px;">${notif.timestamp}</div>
                </div>
            `).join('');
        }
        
        updateConnectionStatus(status, color) {
            const element = document.getElementById('connection-status');
            if (element) {
                element.textContent = status;
                element.style.color = color;
            }
        }
        
        async cancelTask(taskId) {
            if (!this.connected) return;
            
            const message = {
                type: 'cancel_task',
                data: { task_id: taskId }
            };
            
            this.ws.send(JSON.stringify(message));
        }
        
        async activateKillSwitch(reason) {
            if (!this.connected) return;
            
            const message = {
                type: 'activate_kill_switch',
                data: { reason }
            };
            
            this.ws.send(JSON.stringify(message));
        }
        
        startUIUpdates() {
            // Update UI every 5 seconds
            setInterval(() => {
                if (this.connected) {
                    this.ws.send(JSON.stringify({ type: 'ping' }));
                }
            }, 5000);
        }
    }
    
    // Load UI when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDexiMindUI);
    } else {
        loadDexiMindUI();
    }
})();
</script>

<style>
.status-pending { color: #ffc107; }
.status-running { color: #007bff; }
.status-completed { color: #28a745; }
.status-failed { color: #dc3545; }
.status-cancelled { color: #6c757d; }
</style>