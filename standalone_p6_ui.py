"""
Standalone P6 User Interface Server
===================================

A complete standalone web interface for DexiMind that includes:
- Natural language command input
- Real-time task management
- System monitoring dashboard
- Performance metrics
- Emergency controls

Author: DexiMind Development Team
Date: 2025-01-15
Version: 1.0.0
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic models
class TaskCreate(BaseModel):
    command: str = Field(..., description="Natural language command")
    user_id: str = Field(default="web_user", description="User ID")
    priority: int = Field(default=5, ge=1, le=10, description="Task priority (1-10)")

class TaskResponse(BaseModel):
    task_id: str
    command: str
    status: str
    priority: int
    user_id: str
    created_at: str
    estimated_duration: int

class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]

class StandaloneP6UI:
    """Standalone P6 User Interface with complete web interface"""
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8001):
        self.host = host
        self.port = port
        self.app = FastAPI(title="DexiMind P6 UI", version="1.0.0")
        
        # Task management
        self.tasks: Dict[str, Dict] = {}
        self.task_queue: List[str] = []
        self.active_tasks: Dict[str, asyncio.Task] = {}
        
        # WebSocket connections
        self.websocket_connections: List[WebSocket] = []
        
        # System status
        self.system_status = {
            "status": "healthy",
            "components": {
                "perception": "active",
                "reflex": "active", 
                "privacy": "active",
                "cloud_brain": "active",
                "performance_monitor": "active"
            },
            "performance": {
                "cpu_percent": 45.0,
                "memory_percent": 65.0,
                "latency_p80": 118.0,
                "accuracy": 96.0,
                "active_tasks": 0,
                "total_tasks": 0
            },
            "security": {
                "kill_switch_active": False,
                "privacy_level": "basic"
            }
        }
        
        # Setup routes
        self._setup_routes()
        self._setup_middleware()
        
        # Start background tasks
        self._start_background_tasks()
    
    def _setup_middleware(self):
        """Setup CORS and other middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _setup_routes(self):
        """Setup all API routes"""
        
        @self.app.get("/", response_class=HTMLResponse)
        async def get_ui():
            """Serve the main UI"""
            return self._get_ui_html()
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint"""
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "components": self.system_status["components"]
            }
        
        @self.app.post("/tasks", response_model=TaskResponse)
        async def create_task(task: TaskCreate):
            """Create a new task"""
            task_id = str(uuid4())
            
            # Parse natural language command
            parsed_command = self._parse_command(task.command)
            
            new_task = {
                "task_id": task_id,
                "command": task.command,
                "parsed_command": parsed_command,
                "status": "pending",
                "priority": task.priority,
                "user_id": task.user_id,
                "session_id": str(uuid4()),
                "created_at": datetime.now().isoformat(),
                "estimated_duration": self._estimate_duration(parsed_command),
                "progress": 0
            }
            
            self.tasks[task_id] = new_task
            self.task_queue.append(task_id)
            self.system_status["performance"]["total_tasks"] += 1
            
            # Start task execution
            asyncio.create_task(self._execute_task(task_id))
            
            # Notify WebSocket clients
            await self._broadcast_task_update(new_task)
            
            return TaskResponse(
                task_id=task_id,
                command=task.command,
                status=new_task["status"],
                priority=new_task["priority"],
                user_id=new_task["user_id"],
                created_at=new_task["created_at"],
                estimated_duration=new_task["estimated_duration"]
            )
        
        @self.app.get("/tasks")
        async def get_tasks():
            """Get all tasks"""
            return {"tasks": list(self.tasks.values())}
        
        @self.app.get("/tasks/{task_id}")
        async def get_task(task_id: str):
            """Get specific task"""
            if task_id not in self.tasks:
                raise HTTPException(status_code=404, detail="Task not found")
            return self.tasks[task_id]
        
        @self.app.delete("/tasks/{task_id}")
        async def cancel_task(task_id: str):
            """Cancel a task"""
            if task_id not in self.tasks:
                raise HTTPException(status_code=404, detail="Task not found")
            
            task = self.tasks[task_id]
            if task["status"] in ["completed", "failed", "cancelled"]:
                raise HTTPException(status_code=400, detail="Task cannot be cancelled")
            
            task["status"] = "cancelled"
            task["cancelled_at"] = datetime.now().isoformat()
            
            # Cancel background task if running
            if task_id in self.active_tasks:
                self.active_tasks[task_id].cancel()
                del self.active_tasks[task_id]
            
            await self._broadcast_task_update(task)
            return {"message": "Task cancelled successfully"}
        
        @self.app.get("/status")
        async def get_system_status():
            """Get system status"""
            return self.system_status
        
        @self.app.post("/kill-switch")
        async def activate_kill_switch(request: Request):
            """Activate emergency kill switch"""
            data = await request.json()
            reason = data.get("reason", "Emergency stop activated")
            
            self.system_status["security"]["kill_switch_active"] = True
            self.system_status["status"] = "critical"
            
            # Cancel all active tasks
            for task_id in list(self.active_tasks.keys()):
                if task_id in self.tasks:
                    self.tasks[task_id]["status"] = "cancelled"
                    self.tasks[task_id]["cancelled_at"] = datetime.now().isoformat()
                    self.active_tasks[task_id].cancel()
                    del self.active_tasks[task_id]
            
            await self._broadcast_system_update()
            return {"message": f"Kill switch activated: {reason}"}
        
        @self.app.post("/kill-switch/reset")
        async def reset_kill_switch():
            """Reset kill switch"""
            self.system_status["security"]["kill_switch_active"] = False
            self.system_status["status"] = "healthy"
            
            await self._broadcast_system_update()
            return {"message": "Kill switch reset successfully"}
        
        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            """WebSocket endpoint for real-time updates"""
            await websocket.accept()
            self.websocket_connections.append(websocket)
            
            try:
                # Send initial system status
                await websocket.send_json({
                    "type": "system_status",
                    "data": self.system_status
                })
                
                # Send current tasks
                await websocket.send_json({
                    "type": "tasks_update",
                    "data": {"tasks": list(self.tasks.values())}
                })
                
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    await self._handle_websocket_message(websocket, message)
                    
            except WebSocketDisconnect:
                self.websocket_connections.remove(websocket)
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                if websocket in self.websocket_connections:
                    self.websocket_connections.remove(websocket)
    
    def _get_ui_html(self) -> str:
        """Generate the complete UI HTML"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DexiMind P6 UI</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        
        .header {{
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        .status-bar {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .status-indicator {{
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .status-dot {{
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #28a745;
        }}
        
        .status-dot.warning {{ background: #ffc107; }}
        .status-dot.error {{ background: #dc3545; }}
        
        .main-content {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }}
        
        .panel {{
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .panel h2 {{
            margin-bottom: 15px;
            color: #495057;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
        }}
        
        .command-input {{
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }}
        
        .command-input input {{
            flex: 1;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 5px;
            font-size: 16px;
        }}
        
        .command-input input:focus {{
            outline: none;
            border-color: #007bff;
        }}
        
        .btn {{
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s;
        }}
        
        .btn-primary {{
            background: #007bff;
            color: white;
        }}
        
        .btn-primary:hover {{
            background: #0056b3;
        }}
        
        .btn-danger {{
            background: #dc3545;
            color: white;
        }}
        
        .btn-danger:hover {{
            background: #c82333;
        }}
        
        .task-item {{
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
            transition: all 0.3s;
        }}
        
        .task-item:hover {{
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }}
        
        .task-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }}
        
        .task-command {{
            font-weight: bold;
            color: #495057;
        }}
        
        .task-status {{
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }}
        
        .status-pending {{ background: #fff3cd; color: #856404; }}
        .status-running {{ background: #cce5ff; color: #004085; }}
        .status-completed {{ background: #d4edda; color: #155724; }}
        .status-failed {{ background: #f8d7da; color: #721c24; }}
        .status-cancelled {{ background: #e2e3e5; color: #383d41; }}
        
        .task-progress {{
            width: 100%;
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 10px;
        }}
        
        .task-progress-bar {{
            height: 100%;
            background: #007bff;
            transition: width 0.3s;
        }}
        
        .metrics-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }}
        
        .metric-item {{
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }}
        
        .metric-value {{
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }}
        
        .metric-label {{
            font-size: 0.9em;
            color: #6c757d;
            margin-top: 5px;
        }}
        
        .emergency-controls {{
            text-align: center;
            margin-top: 20px;
        }}
        
        .notifications {{
            max-height: 300px;
            overflow-y: auto;
        }}
        
        .notification {{
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 0 5px 5px 0;
        }}
        
        .notification.error {{
            background: #ffebee;
            border-left-color: #f44336;
        }}
        
        .notification.success {{
            background: #e8f5e8;
            border-left-color: #4caf50;
        }}
        
        .notification.warning {{
            background: #fff8e1;
            border-left-color: #ff9800;
        }}
        
        @media (max-width: 768px) {{
            .main-content {{
                grid-template-columns: 1fr;
            }}
            
            .metrics-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 DexiMind P6 UI</h1>
            <p>Natural Language AI Agent Control Interface</p>
        </div>
        
        <div class="status-bar">
            <div class="status-indicator">
                <div class="status-dot" id="status-dot"></div>
                <span id="status-text">Connecting...</span>
            </div>
            <div>
                <span id="connection-status">Disconnected</span>
            </div>
        </div>
        
        <div class="main-content">
            <div class="panel">
                <h2>📝 Task Management</h2>
                <div class="command-input">
                    <input type="text" id="command-input" placeholder="Enter your command (e.g., 'Click on the login button')" />
                    <button class="btn btn-primary" id="submit-command">Submit</button>
                </div>
                <div id="task-list">
                    <p style="text-align: center; color: #6c757d; padding: 20px;">No tasks yet. Enter a command above to get started!</p>
                </div>
            </div>
            
            <div class="panel">
                <h2>📊 System Status</h2>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <div class="metric-value" id="cpu-percent">0%</div>
                        <div class="metric-label">CPU Usage</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="memory-percent">0%</div>
                        <div class="metric-label">Memory Usage</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="latency-p80">0ms</div>
                        <div class="metric-label">Latency P80</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="accuracy">0%</div>
                        <div class="metric-label">Accuracy</div>
                    </div>
                </div>
                
                <div class="emergency-controls">
                    <button class="btn btn-danger" id="kill-switch-btn">🚨 Emergency Stop</button>
                </div>
            </div>
        </div>
        
        <div class="panel" style="margin-top: 20px;">
            <h2>🔔 Notifications</h2>
            <div class="notifications" id="notification-list">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No notifications yet.</p>
            </div>
        </div>
    </div>

    <script>
        class DexiMindUI {{
            constructor() {{
                this.ws = null;
                this.connected = false;
                this.tasks = [];
                this.systemStatus = {{}};
                
                this.init();
            }}
            
            init() {{
                this.connectWebSocket();
                this.setupEventListeners();
            }}
            
            connectWebSocket() {{
                console.log('Attempting to connect to WebSocket...');
                this.ws = new WebSocket('ws://localhost:{self.port}/ws');
                
                this.ws.onopen = () => {{
                    this.connected = true;
                    console.log('✅ Connected to DexiMind P6 UI');
                    this.updateConnectionStatus('Connected', '#28a745');
                    this.addNotification({{
                        type: 'success',
                        title: 'Connected',
                        message: 'Successfully connected to DexiMind API'
                    }});
                }};
                
                this.ws.onmessage = (event) => {{
                    try {{
                        const data = JSON.parse(event.data);
                        console.log('📥 Received message:', data.type);
                        this.handleMessage(data);
                    }} catch (error) {{
                        console.error('Error parsing WebSocket message:', error);
                    }}
                }};
                
                this.ws.onclose = (event) => {{
                    this.connected = false;
                    console.log('❌ Disconnected from DexiMind P6 UI:', event.code, event.reason);
                    this.updateConnectionStatus('Disconnected', '#dc3545');
                    this.addNotification({{
                        type: 'error',
                        title: 'Disconnected',
                        message: 'Lost connection to DexiMind API. Attempting to reconnect...'
                    }});
                    // Attempt to reconnect after 3 seconds
                    setTimeout(() => {{
                        console.log('🔄 Attempting to reconnect...');
                        this.connectWebSocket();
                    }}, 3000);
                }};
                
                this.ws.onerror = (error) => {{
                    console.error('❌ WebSocket error:', error);
                    this.updateConnectionStatus('Error', '#dc3545');
                    this.addNotification({{
                        type: 'error',
                        title: 'Connection Error',
                        message: 'Failed to connect to DexiMind API'
                    }});
                }};
            }}
            
            setupEventListeners() {{
                // Command input
                document.getElementById('submit-command').addEventListener('click', () => {{
                    this.createTask();
                }});
                
                // Enter key support
                document.getElementById('command-input').addEventListener('keypress', (e) => {{
                    if (e.key === 'Enter') {{
                        this.createTask();
                    }}
                }});
                
                // Kill switch
                document.getElementById('kill-switch-btn').addEventListener('click', () => {{
                    const reason = prompt('Reason for emergency stop:');
                    if (reason) {{
                        this.activateKillSwitch(reason);
                    }}
                }});
            }}
            
            handleMessage(data) {{
                switch (data.type) {{
                    case 'system_status':
                        this.updateSystemStatus(data.data);
                        break;
                    case 'tasks_update':
                        this.updateTasks(data.data.tasks);
                        break;
                    case 'task_update':
                        this.updateTask(data.data);
                        break;
                    case 'notification':
                        this.addNotification(data.data);
                        break;
                }}
            }}
            
            async createTask() {{
                const command = document.getElementById('command-input').value.trim();
                if (!command) return;
                
                if (!this.connected) {{
                    this.addNotification({{
                        type: 'error',
                        title: 'Not Connected',
                        message: 'Not connected to DexiMind API. Please wait for connection...'
                    }});
                    console.log('❌ Cannot create task: Not connected to API');
                    return;
                }}
                
                try {{
                    const response = await fetch('/tasks', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{
                            command: command,
                            user_id: 'web_user',
                            priority: 5
                        }})
                    }});
                    
                    if (response.ok) {{
                        document.getElementById('command-input').value = '';
                        this.addNotification({{
                            type: 'success',
                            title: 'Task Created',
                            message: `Task created: ${{command}}`
                        }});
                    }} else {{
                        throw new Error('Failed to create task');
                    }}
                }} catch (error) {{
                    console.error('Error creating task:', error);
                    this.addNotification({{
                        type: 'error',
                        title: 'Error',
                        message: 'Failed to create task'
                    }});
                }}
            }}
            
            updateTasks(tasks) {{
                this.tasks = tasks;
                this.renderTasks();
            }}
            
            updateTask(task) {{
                const existingIndex = this.tasks.findIndex(t => t.task_id === task.task_id);
                if (existingIndex >= 0) {{
                    this.tasks[existingIndex] = task;
                }} else {{
                    this.tasks.push(task);
                }}
                this.renderTasks();
            }}
            
            renderTasks() {{
                const container = document.getElementById('task-list');
                
                if (this.tasks.length === 0) {{
                    container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No tasks yet. Enter a command above to get started!</p>';
                    return;
                }}
                
                container.innerHTML = this.tasks.map(task => `
                    <div class="task-item">
                        <div class="task-header">
                            <div class="task-command">${{task.command}}</div>
                            <div class="task-status status-${{task.status}}">${{task.status}}</div>
                        </div>
                        <div class="task-progress">
                            <div class="task-progress-bar" style="width: ${{task.progress || 0}}%"></div>
                        </div>
                        <div style="font-size: 0.9em; color: #6c757d;">
                            Created: ${{new Date(task.created_at).toLocaleString()}}
                            ${{task.estimated_duration ? ` | Est. Duration: ${{task.estimated_duration}}s` : ''}}
                        </div>
                    </div>
                `).join('');
            }}
            
            updateSystemStatus(status) {{
                this.systemStatus = status;
                
                // Update status indicator
                const statusDot = document.getElementById('status-dot');
                const statusText = document.getElementById('status-text');
                
                statusDot.className = 'status-dot';
                if (status.status === 'warning') statusDot.classList.add('warning');
                if (status.status === 'error' || status.status === 'critical') statusDot.classList.add('error');
                
                statusText.textContent = status.status.toUpperCase();
                
                // Update metrics
                if (status.performance) {{
                    document.getElementById('cpu-percent').textContent = Math.round(status.performance.cpu_percent || 0) + '%';
                    document.getElementById('memory-percent').textContent = Math.round(status.performance.memory_percent || 0) + '%';
                    document.getElementById('latency-p80').textContent = Math.round(status.performance.latency_p80 || 0) + 'ms';
                    document.getElementById('accuracy').textContent = Math.round(status.performance.accuracy || 0) + '%';
                }}
            }}
            
            addNotification(notification) {{
                const container = document.getElementById('notification-list');
                
                if (container.querySelector('p')) {{
                    container.innerHTML = '';
                }}
                
                const notificationElement = document.createElement('div');
                notificationElement.className = `notification ${{notification.type || 'info'}}`;
                notificationElement.innerHTML = `
                    <div style="font-weight: bold;">${{notification.title}}</div>
                    <div>${{notification.message}}</div>
                    <div style="font-size: 0.8em; color: #6c757d; margin-top: 5px;">
                        ${{new Date().toLocaleString()}}
                    </div>
                `;
                
                container.insertBefore(notificationElement, container.firstChild);
                
                // Keep only last 10 notifications
                while (container.children.length > 10) {{
                    container.removeChild(container.lastChild);
                }}
            }}
            
            updateConnectionStatus(status, color) {{
                const element = document.getElementById('connection-status');
                if (element) {{
                    element.textContent = status;
                    element.style.color = color;
                }}
            }}
            
            async activateKillSwitch(reason) {{
                try {{
                    const response = await fetch('/kill-switch', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{ reason }})
                    }});
                    
                    if (response.ok) {{
                        this.addNotification({{
                            type: 'error',
                            title: 'Kill Switch Activated',
                            message: `System disabled: ${{reason}}`
                        }});
                    }}
                }} catch (error) {{
                    console.error('Error activating kill switch:', error);
                }}
            }}
        }}
        
        // Initialize UI when page loads
        document.addEventListener('DOMContentLoaded', () => {{
            new DexiMindUI();
        }});
    </script>
</body>
</html>
        """
    
    def _parse_command(self, command: str) -> Dict[str, Any]:
        """Parse natural language command into structured format"""
        command_lower = command.lower()
        
        # Click commands
        if any(word in command_lower for word in ['click', 'press', 'tap']):
            return {
                "type": "click",
                "target": self._extract_target(command),
                "confidence": 0.9
            }
        
        # Type commands
        elif any(word in command_lower for word in ['type', 'enter', 'write', 'input']):
            return {
                "type": "type",
                "text": self._extract_text(command),
                "target": self._extract_target(command),
                "confidence": 0.85
            }
        
        # Navigate commands
        elif any(word in command_lower for word in ['navigate', 'go', 'open', 'visit']):
            return {
                "type": "navigate",
                "target": self._extract_target(command),
                "confidence": 0.8
            }
        
        # Scroll commands
        elif any(word in command_lower for word in ['scroll', 'move']):
            return {
                "type": "scroll",
                "direction": self._extract_direction(command),
                "confidence": 0.75
            }
        
        # Search commands
        elif any(word in command_lower for word in ['search', 'find', 'look']):
            return {
                "type": "search",
                "query": self._extract_query(command),
                "confidence": 0.8
            }
        
        # Default
        else:
            return {
                "type": "unknown",
                "original_command": command,
                "confidence": 0.5
            }
    
    def _extract_target(self, command: str) -> str:
        """Extract target element from command"""
        # Simple extraction - look for quoted text or common patterns
        import re
        
        # Look for quoted text
        quoted = re.search(r'"([^"]*)"', command)
        if quoted:
            return quoted.group(1)
        
        # Look for "on the X" or "the X"
        on_pattern = re.search(r'(?:on\s+the\s+|the\s+)([a-zA-Z\s]+?)(?:\s+button|\s+field|\s+menu|$)', command)
        if on_pattern:
            return on_pattern.group(1).strip()
        
        return "unknown target"
    
    def _extract_text(self, command: str) -> str:
        """Extract text to type from command"""
        import re
        
        # Look for quoted text
        quoted = re.search(r'"([^"]*)"', command)
        if quoted:
            return quoted.group(1)
        
        # Look for "type X" pattern
        type_pattern = re.search(r'type\s+(?:in\s+)?([a-zA-Z0-9\s@._-]+)', command)
        if type_pattern:
            return type_pattern.group(1).strip()
        
        return ""
    
    def _extract_direction(self, command: str) -> str:
        """Extract scroll direction from command"""
        command_lower = command.lower()
        if 'up' in command_lower:
            return 'up'
        elif 'down' in command_lower:
            return 'down'
        elif 'left' in command_lower:
            return 'left'
        elif 'right' in command_lower:
            return 'right'
        return 'down'
    
    def _extract_query(self, command: str) -> str:
        """Extract search query from command"""
        import re
        
        # Look for "search for X" or "find X"
        search_pattern = re.search(r'(?:search\s+for|find|look\s+for)\s+(.+)', command)
        if search_pattern:
            return search_pattern.group(1).strip()
        
        return ""
    
    def _estimate_duration(self, parsed_command: Dict[str, Any]) -> int:
        """Estimate task duration in seconds"""
        command_type = parsed_command.get("type", "unknown")
        
        duration_map = {
            "click": 2,
            "type": 3,
            "navigate": 5,
            "scroll": 1,
            "search": 8,
            "unknown": 5
        }
        
        return duration_map.get(command_type, 5)
    
    async def _execute_task(self, task_id: str):
        """Execute a task on Pi5"""
        if task_id not in self.tasks:
            return
        
        task = self.tasks[task_id]
        task["status"] = "running"
        self.system_status["performance"]["active_tasks"] += 1
        
        await self._broadcast_task_update(task)
        
        try:
            # Execute command on Pi5
            success = await self._execute_on_pi5(task["command"], task["parsed_command"])
            
            if success:
                task["status"] = "completed"
                task["progress"] = 100
                task["completed_at"] = datetime.now().isoformat()
                
                await self._broadcast_notification({
                    "type": "success",
                    "title": "Task Completed",
                    "message": f"Task completed: {task['command']}"
                })
            else:
                task["status"] = "failed"
                task["progress"] = 0
                task["failed_at"] = datetime.now().isoformat()
                
                await self._broadcast_notification({
                    "type": "error",
                    "title": "Task Failed",
                    "message": f"Task failed: {task['command']}"
                })
                
        except Exception as e:
            logger.error(f"Error executing task {task_id}: {e}")
            task["status"] = "failed"
            task["progress"] = 0
            task["failed_at"] = datetime.now().isoformat()
            
            await self._broadcast_notification({
                "type": "error",
                "title": "Task Error",
                "message": f"Task error: {str(e)}"
            })
        
        finally:
            self.system_status["performance"]["active_tasks"] -= 1
            await self._broadcast_task_update(task)
    
    async def _execute_on_pi5(self, command: str, parsed_command: Dict[str, Any]) -> bool:
        """Execute command on Pi5"""
        try:
            import subprocess
            
            # Map parsed command to Pi5 HID command
            hid_command = self._map_to_hid_command(parsed_command)
            
            if not hid_command:
                logger.error(f"Cannot map command to HID: {command}")
                return False
            
            # Execute on Pi5
            cmd = [
                "ssh", "-i", "C:/Users/hp/.ssh/id_rsa",
                "hp@192.168.1.7",
                f"sudo /tmp/hid_executor.sh {hid_command}"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                logger.info(f"✅ Pi5 command executed: {hid_command}")
                return True
            else:
                logger.error(f"❌ Pi5 command failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error executing on Pi5: {e}")
            return False
    
    def _map_to_hid_command(self, parsed_command: Dict[str, Any]) -> Optional[str]:
        """Map parsed command to Pi5 HID command"""
        command_type = parsed_command.get("type", "unknown")
        
        if command_type == "scroll":
            direction = parsed_command.get("direction", "down")
            if direction == "up":
                return "mouse_up"
            elif direction == "down":
                return "mouse_down"
            elif direction == "left":
                return "mouse_left"
            elif direction == "right":
                return "mouse_right"
        
        elif command_type == "click":
            return "click"
        
        elif command_type == "type":
            return "type"
        
        # For move commands, try to extract direction
        elif command_type == "move":
            # This would need more sophisticated parsing
            return "mouse_up"  # Default to mouse_up for now
        
        return None
    
    async def _broadcast_task_update(self, task: Dict[str, Any]):
        """Broadcast task update to all WebSocket clients"""
        message = {
            "type": "task_update",
            "data": task
        }
        await self._broadcast_message(message)
    
    async def _broadcast_system_update(self):
        """Broadcast system status update to all WebSocket clients"""
        message = {
            "type": "system_status",
            "data": self.system_status
        }
        await self._broadcast_message(message)
    
    async def _broadcast_notification(self, notification: Dict[str, Any]):
        """Broadcast notification to all WebSocket clients"""
        message = {
            "type": "notification",
            "data": notification
        }
        await self._broadcast_message(message)
    
    async def _broadcast_message(self, message: Dict[str, Any]):
        """Broadcast message to all WebSocket clients"""
        if not self.websocket_connections:
            return
        
        message_str = json.dumps(message)
        disconnected = []
        
        for websocket in self.websocket_connections:
            try:
                await websocket.send_text(message_str)
            except:
                disconnected.append(websocket)
        
        # Remove disconnected clients
        for websocket in disconnected:
            if websocket in self.websocket_connections:
                self.websocket_connections.remove(websocket)
    
    async def _handle_websocket_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Handle incoming WebSocket message"""
        message_type = message.get("type")
        
        if message_type == "ping":
            await websocket.send_text(json.dumps({"type": "pong"}))
    
    def _start_background_tasks(self):
        """Start background monitoring tasks"""
        asyncio.create_task(self._update_system_metrics())
    
    async def _update_system_metrics(self):
        """Update system metrics periodically"""
        while True:
            try:
                # Simulate changing metrics
                import random
                
                self.system_status["performance"]["cpu_percent"] = max(20, min(80, 
                    self.system_status["performance"]["cpu_percent"] + random.uniform(-5, 5)))
                
                self.system_status["performance"]["memory_percent"] = max(30, min(90,
                    self.system_status["performance"]["memory_percent"] + random.uniform(-3, 3)))
                
                self.system_status["performance"]["latency_p80"] = max(50, min(300,
                    self.system_status["performance"]["latency_p80"] + random.uniform(-10, 10)))
                
                await self._broadcast_system_update()
                await asyncio.sleep(5)  # Update every 5 seconds
                
            except Exception as e:
                logger.error(f"Error updating system metrics: {e}")
                await asyncio.sleep(10)
    
    async def start(self):
        """Start the server"""
        logger.info(f"Starting DexiMind P6 UI server on {self.host}:{self.port}")
        config = uvicorn.Config(
            app=self.app,
            host=self.host,
            port=self.port,
            log_level="info"
        )
        server = uvicorn.Server(config)
        await server.serve()

async def main():
    """Main function"""
    ui = StandaloneP6UI(host="0.0.0.0", port=8001)
    await ui.start()

if __name__ == "__main__":
    asyncio.run(main())
