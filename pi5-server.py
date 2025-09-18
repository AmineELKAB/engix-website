#!/usr/bin/env python3
"""
Pi5 API Server for DexiMind Integration
This script should be run on your Pi5 device to provide API endpoints
for connection status and serial number retrieval.
"""

import json
import subprocess
import socket
import time
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

class Pi5APIHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.start_time = time.time()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            if path == '/api/status':
                response = self.get_device_status()
            elif path == '/api/serial':
                response = self.get_serial_number()
            elif path == '/api/network':
                response = self.get_network_status()
            elif path == '/api/cpuinfo':
                response = self.get_cpuinfo()
            else:
                response = {'error': 'Endpoint not found'}
                self.send_response(404)
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def get_device_status(self):
        """Get Pi5 device status"""
        try:
            # Get uptime
            uptime_seconds = time.time() - self.start_time
            
            # Get CPU temperature
            try:
                with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                    temp_millidegrees = int(f.read().strip())
                    temperature = temp_millidegrees / 1000.0
            except:
                temperature = None
            
            # Get CPU usage (simplified)
            try:
                result = subprocess.run(['top', '-bn1'], capture_output=True, text=True, timeout=5)
                cpu_usage = 0.0  # Simplified - you might want to parse this better
            except:
                cpu_usage = None
            
            return {
                'status': 'online',
                'uptime': uptime_seconds,
                'temperature': temperature,
                'cpuUsage': cpu_usage,
                'timestamp': time.time()
            }
        except Exception as e:
            return {'error': f'Failed to get device status: {str(e)}'}
    
    def get_serial_number(self):
        """Get Pi5 serial number"""
        try:
            # Try to get serial from /proc/cpuinfo
            with open('/proc/cpuinfo', 'r') as f:
                cpuinfo = f.read()
                
            for line in cpuinfo.split('\n'):
                if line.startswith('Serial'):
                    serial = line.split(':')[1].strip()
                    return {'serialNumber': serial}
            
            # Fallback: try to get from /proc/device-tree/serial-number
            try:
                with open('/proc/device-tree/serial-number', 'r') as f:
                    serial = f.read().strip().rstrip('\x00')
                    return {'serialNumber': serial}
            except:
                pass
            
            return {'error': 'Serial number not found'}
            
        except Exception as e:
            return {'error': f'Failed to get serial number: {str(e)}'}
    
    def get_network_status(self):
        """Get Pi5 network connectivity status"""
        try:
            # Check internet connectivity
            has_internet = self.check_internet_connectivity()
            
            # Get IP address
            ip_address = self.get_local_ip()
            
            # Get gateway (simplified)
            try:
                result = subprocess.run(['ip', 'route', 'show', 'default'], 
                                      capture_output=True, text=True, timeout=5)
                gateway = result.stdout.split()[2] if result.returncode == 0 else None
            except:
                gateway = None
            
            return {
                'hasInternet': has_internet,
                'ipAddress': ip_address,
                'gateway': gateway,
                'timestamp': time.time()
            }
        except Exception as e:
            return {'error': f'Failed to get network status: {str(e)}'}
    
    def get_cpuinfo(self):
        """Get CPU info including serial number"""
        try:
            with open('/proc/cpuinfo', 'r') as f:
                cpuinfo = f.read()
            
            # Parse cpuinfo
            info = {}
            for line in cpuinfo.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    info[key.strip()] = value.strip()
            
            return info
        except Exception as e:
            return {'error': f'Failed to get cpuinfo: {str(e)}'}
    
    def check_internet_connectivity(self):
        """Check if Pi5 has internet connectivity"""
        try:
            # Try to connect to a reliable host
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            return True
        except OSError:
            return False
    
    def get_local_ip(self):
        """Get local IP address"""
        try:
            # Connect to a remote address to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return None

def run_server(host='0.0.0.0', port=8080):
    """Run the Pi5 API server"""
    server_address = (host, port)
    httpd = HTTPServer(server_address, Pi5APIHandler)
    
    print(f"Pi5 API Server starting on {host}:{port}")
    print("Available endpoints:")
    print("  GET /api/status - Device status")
    print("  GET /api/serial - Serial number")
    print("  GET /api/network - Network status")
    print("  GET /api/cpuinfo - CPU info")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == '__main__':
    import sys
    
    # Parse command line arguments
    host = '0.0.0.0'
    port = 8080
    
    if len(sys.argv) > 1:
        host = sys.argv[1]
    if len(sys.argv) > 2:
        port = int(sys.argv[2])
    
    run_server(host, port)
