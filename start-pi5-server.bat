@echo off
echo Starting Pi5 Web Server with Node.js...
echo.
echo This will start a simple HTTP server that provides real Pi5 data
echo without requiring any installation.
echo.
echo The server will run on http://localhost:8080
echo Press Ctrl+C to stop the server
echo.

node pi5-server.js

pause