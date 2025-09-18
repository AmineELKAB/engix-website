# DexiMind P6 UI Deployment Guide

## Overview
This guide explains how to deploy the DexiMind P6 UI to make it accessible at https://engix.dev/deximind-p6-ui.html

## Files Added
- `deximind-p6-ui.html` - Web interface for the P6 UI
- `standalone_p6_ui.py` - P6 UI server with Pi5 HID integration
- `start_p6_ui.py` - Startup script for production deployment

## Deployment Steps

### 1. Server Setup
The P6 UI server needs to be running on the server to handle the web interface requests.

### 2. Web Interface
The `deximind-p6-ui.html` file is now accessible at:
**https://engix.dev/deximind-p6-ui.html**

### 3. Server Requirements
- Python 3.8+
- FastAPI and uvicorn
- SSH access to Pi5 device
- Pi5 HID executor script deployed

### 4. Pi5 Integration
The P6 UI connects to a Pi5 device via SSH to execute HID commands:
- Pi5 IP: 192.168.1.7
- SSH Key: C:/Users/hp/.ssh/id_rsa
- HID Executor: /tmp/hid_executor.sh

### 5. Supported Commands
- Mouse movements: "Move the mouse up/down/left/right"
- Mouse clicks: "Click the mouse"
- Basic typing: "Type [text]"

## Technical Details

### WebSocket Communication
- Real-time task updates via WebSocket
- Connection status monitoring
- Task progress tracking

### HID Execution
- Commands are parsed and mapped to Pi5 HID actions
- Real-time execution on target computer
- Error handling and status reporting

### Security
- SSH key-based authentication to Pi5
- Local network communication only
- No external API dependencies

## Status
✅ **DEPLOYED** - P6 UI is now accessible at https://engix.dev/deximind-p6-ui.html

The web interface provides a complete natural language control system for the DexiMind AI agent with real Pi5 HID integration.
