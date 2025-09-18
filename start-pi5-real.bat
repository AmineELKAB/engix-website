@echo off
echo Starting Pi5 Web Server with Real SSH Connection...
echo.
echo This will connect to your actual Pi5 device to get the real serial number.
echo.

REM Set Pi5 credentials (update these with your actual Pi5 details)
set PI5_HOST=192.168.1.100
set PI5_USER=pi
set PI5_PASSWORD=raspberry
set PI5_PORT=22

echo Pi5 Configuration:
echo   Host: %PI5_HOST%
echo   User: %PI5_USER%
echo   Port: %PI5_PORT%
echo.

echo Starting server...
echo The server will run on http://localhost:8080
echo Press Ctrl+C to stop the server
echo.

node pi5-server.js

pause












