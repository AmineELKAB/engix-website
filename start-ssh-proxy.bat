@echo off
echo Starting SSH Proxy Server for DexiMind Pi5 Integration...
echo.
echo This server allows the web interface to connect to your Pi5 via SSH
echo to retrieve the real serial number and connection status.
echo.
echo Make sure you have Python installed and sshpass available.
echo.
echo Press Ctrl+C to stop the server
echo.
python ssh-proxy-server.py
pause
