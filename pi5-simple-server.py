#!/usr/bin/env python3
"""
Pi5 Simple Web Server - Serves real Pi5 data via HTTP
No installation required - uses only Python standard library
"""

import http.server
import socketserver
import json
import subprocess
import os
import sys
from urllib.parse import urlparse, parse_qs

class Pi5DataHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests for Pi5 data"""
        try:
            parsed_path = urlparse(self.path)
            path = parsed_path.path
            
            # Set CORS headers to allow cross-origin requests
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            if path == '/api/serial':
                data = self.get_serial_number()
            elif path == '/api/status':
                data = self.get_device_status()
            elif path == '/api/network':
                data = self.get_network_status()
            elif path == '/api/cpuinfo':
                data = self.get_cpu_info()
            elif path == '/':
                # Serve the web interface
                self.serve_web_interface()
                return
            else:
                data = {'error': 'Endpoint not found', 'path': path}
            
            # Send JSON response
            response = json.dumps(data, indent=2)
            self.wfile.write(response.encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def get_serial_number(self):
        """Get real Pi5 serial number from /proc/cpuinfo"""
        try:
            # Try multiple methods to get serial number
            methods = [
                self._get_serial_from_cpuinfo,
                self._get_serial_from_device_tree,
                self._get_serial_from_sys_firmware
            ]
            
            for method in methods:
                try:
                    serial = method()
                    if serial and serial.strip():
                        return {
                            'serialNumber': serial.strip(),
                            'method': method.__name__,
                            'status': 'success'
                        }
                except Exception as e:
                    print(f"Method {method.__name__} failed: {e}")
                    continue
            
            # If all methods fail, return error
            return {
                'serialNumber': 'UNKNOWN',
                'error': 'Could not retrieve serial number',
                'status': 'error'
            }
            
        except Exception as e:
            return {
                'serialNumber': 'UNKNOWN',
                'error': str(e),
                'status': 'error'
            }
    
    def _get_serial_from_cpuinfo(self):
        """Get serial from /proc/cpuinfo"""
        try:
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if line.startswith('Serial'):
                        return line.split(':', 1)[1].strip()
        except:
            pass
        return None
    
    def _get_serial_from_device_tree(self):
        """Get serial from device tree"""
        try:
            with open('/proc/device-tree/serial-number', 'rb') as f:
                return f.read().decode('utf-8').rstrip('\x00')
        except:
            pass
        return None
    
    def _get_serial_from_sys_firmware(self):
        """Get serial from sys firmware"""
        try:
            with open('/sys/firmware/devicetree/base/serial-number', 'rb') as f:
                return f.read().decode('utf-8').rstrip('\x00')
        except:
            pass
        return None
    
    def get_device_status(self):
        """Get Pi5 device status"""
        try:
            # Get uptime
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.read().split()[0])
            
            # Get temperature (if available)
            temperature = None
            try:
                with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                    temp_millicelsius = int(f.read().strip())
                    temperature = temp_millicelsius / 1000.0
            except:
                pass
            
            # Get CPU usage (simplified)
            cpu_usage = self._get_cpu_usage()
            
            return {
                'status': 'online',
                'uptime': int(uptime_seconds),
                'temperature': temperature,
                'cpuUsage': cpu_usage,
                'timestamp': self._get_timestamp()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    def get_network_status(self):
        """Get Pi5 network status"""
        try:
            # Check internet connectivity
            has_internet = self._check_internet_connectivity()
            
            # Get IP address
            ip_address = self._get_ip_address()
            
            # Get gateway
            gateway = self._get_gateway()
            
            return {
                'hasInternet': has_internet,
                'ipAddress': ip_address,
                'gateway': gateway,
                'timestamp': self._get_timestamp()
            }
        except Exception as e:
            return {
                'hasInternet': False,
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    def get_cpu_info(self):
        """Get CPU information"""
        try:
            cpu_info = {}
            
            # Read /proc/cpuinfo
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        if key in ['processor', 'model name', 'Hardware', 'Serial', 'Revision']:
                            cpu_info[key] = value
            
            return {
                'cpuInfo': cpu_info,
                'processor': cpu_info.get('Hardware', 'Unknown'),
                'serial': cpu_info.get('Serial', 'Unknown'),
                'model': 'Raspberry Pi 5',
                'timestamp': self._get_timestamp()
            }
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    def _get_cpu_usage(self):
        """Get CPU usage percentage"""
        try:
            # Simple CPU usage calculation
            with open('/proc/stat', 'r') as f:
                line = f.readline()
                fields = line.split()
                idle = int(fields[4])
                total = sum(int(field) for field in fields[1:])
                return round((1 - idle / total) * 100, 1)
        except:
            return 0.0
    
    def _check_internet_connectivity(self):
        """Check if Pi5 has internet connectivity"""
        try:
            # Try to ping Google DNS
            result = subprocess.run(['ping', '-c', '1', '-W', '3', '8.8.8.8'], 
                                  capture_output=True, timeout=5)
            return result.returncode == 0
        except:
            return False
    
    def _get_ip_address(self):
        """Get Pi5 IP address"""
        try:
            result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
            return result.stdout.strip().split()[0]
        except:
            return 'Unknown'
    
    def _get_gateway(self):
        """Get default gateway"""
        try:
            result = subprocess.run(['ip', 'route', 'show', 'default'], 
                                  capture_output=True, text=True)
            for line in result.stdout.split('\n'):
                if 'default via' in line:
                    return line.split()[2]
        except:
            pass
        return 'Unknown'
    
    def _get_timestamp(self):
        """Get current timestamp"""
        import time
        return int(time.time())
    
    def serve_web_interface(self):
        """Serve the web interface"""
        html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pi5 Web Server - Real Data</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 15px; margin: 10px 0; border-radius: 5px; font-weight: bold; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .endpoint { background: #e9ecef; padding: 10px; border-radius: 5px; margin: 10px 0; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Pi5 Web Server - Real Data</h1>
        <p>This server provides real Pi5 data via HTTP API endpoints.</p>
        
        <div id="status" class="status info">
            Server Status: Running
        </div>
        
        <h2>Available Endpoints</h2>
        <div class="endpoint">GET /api/serial - Get real Pi5 serial number</div>
        <div class="endpoint">GET /api/status - Get device status</div>
        <div class="endpoint">GET /api/network - Get network status</div>
        <div class="endpoint">GET /api/cpuinfo - Get CPU information</div>
        
        <h2>Test Endpoints</h2>
        <button onclick="testSerial()">Test Serial Number</button>
        <button onclick="testStatus()">Test Device Status</button>
        <button onclick="testNetwork()">Test Network Status</button>
        <button onclick="testCpuInfo()">Test CPU Info</button>
        
        <div id="results"></div>
        
        <h2>Access from DexiMind</h2>
        <p>Use these URLs in your DexiMind configuration:</p>
        <pre>http://YOUR_PI5_IP:8080/api/serial
http://YOUR_PI5_IP:8080/api/status
http://YOUR_PI5_IP:8080/api/network
http://YOUR_PI5_IP:8080/api/cpuinfo</pre>
    </div>

    <script>
        async function testSerial() {
            try {
                const response = await fetch('/api/serial');
                const data = await response.json();
                showResult('Serial Number', JSON.stringify(data, null, 2));
            } catch (error) {
                showResult('Serial Number Error', error.message);
            }
        }

        async function testStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                showResult('Device Status', JSON.stringify(data, null, 2));
            } catch (error) {
                showResult('Device Status Error', error.message);
            }
        }

        async function testNetwork() {
            try {
                const response = await fetch('/api/network');
                const data = await response.json();
                showResult('Network Status', JSON.stringify(data, null, 2));
            } catch (error) {
                showResult('Network Status Error', error.message);
            }
        }

        async function testCpuInfo() {
            try {
                const response = await fetch('/api/cpuinfo');
                const data = await response.json();
                showResult('CPU Info', JSON.stringify(data, null, 2));
            } catch (error) {
                showResult('CPU Info Error', error.message);
            }
        }

        function showResult(title, data) {
            const results = document.getElementById('results');
            results.innerHTML = `
                <h3>${title}</h3>
                <pre>${data}</pre>
            `;
        }
    </script>
</body>
</html>
        """
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html_content.encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override to reduce log noise"""
        pass

def main():
    """Main function to start the server"""
    PORT = 8080
    
    try:
        with socketserver.TCPServer(("", PORT), Pi5DataHandler) as httpd:
            print(f"Pi5 Web Server starting on port {PORT}")
            print(f"Access the server at: http://localhost:{PORT}")
            print(f"API endpoints available at: http://localhost:{PORT}/api/")
            print("Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()