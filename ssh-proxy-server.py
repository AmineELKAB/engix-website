#!/usr/bin/env python3
"""
SSH Proxy Server for DexiMind Pi5 Integration
This server acts as a proxy between the web interface and Pi5 SSH connections
"""

import json
import subprocess
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

class SSHProxyHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def do_POST(self):
        """Handle POST requests for SSH execution"""
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
            if path == '/api/ssh-execute':
                # Get request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                # Execute SSH command
                result = self.execute_ssh_command(request_data)
                self.wfile.write(json.dumps(result).encode())
            else:
                response = {'error': 'Endpoint not found'}
                self.wfile.write(json.dumps(response).encode())
                
        except Exception as e:
            error_response = {'success': False, 'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def execute_ssh_command(self, request_data):
        """Execute SSH command on Pi5"""
        try:
            hostname = request_data.get('hostname')
            username = request_data.get('username')
            password = request_data.get('password')
            port = request_data.get('port', 22)
            command = request_data.get('command')
            
            if not all([hostname, username, password, command]):
                return {
                    'success': False,
                    'error': 'Missing required parameters'
                }
            
            # Use sshpass for password authentication
            ssh_command = [
                'sshpass', '-p', password,
                'ssh', '-o', 'StrictHostKeyChecking=no',
                '-o', 'UserKnownHostsFile=/dev/null',
                '-o', 'LogLevel=ERROR',
                '-p', str(port),
                f'{username}@{hostname}',
                command
            ]
            
            # Execute SSH command
            result = subprocess.run(
                ssh_command,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            return {
                'success': True,
                'output': result.stdout.strip(),
                'error': result.stderr.strip(),
                'exitCode': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'SSH command timed out'
            }
        except FileNotFoundError:
            return {
                'success': False,
                'error': 'sshpass not found. Please install sshpass: sudo apt-get install sshpass'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'SSH execution failed: {str(e)}'
            }

def run_ssh_proxy_server(host='localhost', port=3000):
    """Run the SSH proxy server"""
    server_address = (host, port)
    httpd = HTTPServer(server_address, SSHProxyHandler)
    
    print(f"SSH Proxy Server starting on {host}:{port}")
    print("Available endpoints:")
    print("  POST /api/ssh-execute - Execute SSH commands on Pi5")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down SSH proxy server...")
        httpd.shutdown()

if __name__ == '__main__':
    import sys
    
    # Parse command line arguments
    host = 'localhost'
    port = 3000
    
    if len(sys.argv) > 1:
        host = sys.argv[1]
    if len(sys.argv) > 2:
        port = int(sys.argv[2])
    
    run_ssh_proxy_server(host, port)
