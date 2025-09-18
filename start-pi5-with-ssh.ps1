# PowerShell script to start Pi5 server with SSH connection
# This script will connect to your real Pi5 device to get the actual serial number

Write-Host "Starting Pi5 Web Server with SSH connection..." -ForegroundColor Green
Write-Host ""

# Set Pi5 credentials (update these with your actual Pi5 details)
$env:PI5_HOST = "192.168.1.100"  # Replace with your Pi5 IP address
$env:PI5_USER = "pi"              # Replace with your Pi5 username
$env:PI5_PASSWORD = "raspberry"   # Replace with your Pi5 password
$env:PI5_PORT = "22"              # Replace with your Pi5 SSH port

Write-Host "Pi5 Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $env:PI5_HOST"
Write-Host "  User: $env:PI5_USER"
Write-Host "  Port: $env:PI5_PORT"
Write-Host ""

# Check if sshpass is available
Write-Host "Checking for sshpass..." -ForegroundColor Yellow
try {
    $sshpassVersion = & sshpass -V 2>&1
    Write-Host "sshpass found: $sshpassVersion" -ForegroundColor Green
} catch {
    Write-Host "sshpass not found. Please install it first:" -ForegroundColor Red
    Write-Host "  - On Windows with WSL: sudo apt-get install sshpass" -ForegroundColor Red
    Write-Host "  - On Windows with Git Bash: Download from https://sourceforge.net/projects/sshpass/" -ForegroundColor Red
    Write-Host ""
    Write-Host "Continuing without sshpass (will try key-based auth)..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
Write-Host "The server will run on http://localhost:8080" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

# Start the Node.js server
node pi5-server.js












