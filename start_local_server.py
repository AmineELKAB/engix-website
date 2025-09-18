#!/usr/bin/env python3
"""
Simple HTTP Server for DexiMind UI Testing
==========================================

This script starts a simple HTTP server to serve your HTML files locally,
which allows the browser to connect to the DexiMind P6 UI API server
without CORS (Cross-Origin Resource Sharing) issues.

Usage:
    python start_local_server.py

Then open: http://localhost:8080/deximind.html
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configuration
PORT = 8080
HOST = "localhost"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to add CORS headers and serve files properly"""
    
    def end_headers(self):
        # Add CORS headers to allow connections to localhost:8001
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging to show what files are being served
        print(f"[{self.address_string()}] {format % args}")

def main():
    """Start the HTTP server"""
    
    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("=" * 60)
    print("DexiMind P6 UI - Local HTTP Server")
    print("=" * 60)
    print(f"Starting server on http://{HOST}:{PORT}")
    print(f"Serving files from: {script_dir}")
    print()
    print("Available URLs:")
    print(f"  • Main Page:     http://{HOST}:{PORT}/deximind.html")
    print(f"  • Test Page:     http://{HOST}:{PORT}/test_deximind_ui.html")
    print()
    print("Make sure the DexiMind P6 API server is running on localhost:8001")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            print(f"Server running at http://{HOST}:{PORT}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"Error: Port {PORT} is already in use. Try a different port.")
            print("You can modify the PORT variable in this script to use a different port.")
        else:
            print(f"Error starting server: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
