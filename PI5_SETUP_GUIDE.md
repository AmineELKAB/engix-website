# Pi5 Setup Guide for DexiMind Integration

This guide will help you set up your Pi5 device to work with the DexiMind web interface.

## Prerequisites

- Raspberry Pi 5 device
- Python 3.6 or higher installed on Pi5
- Network connectivity between your computer and Pi5

## Step 1: Find Your Pi5's IP Address

### Method 1: From Pi5 directly
```bash
# On your Pi5, run:
ip addr show
# or
hostname -I
```

### Method 2: From your computer
```bash
# Scan your network (replace 192.168.1 with your network range)
nmap -sn 192.168.1.0/24 | grep -B2 "Raspberry Pi"
```

### Method 3: Check your router
- Log into your router's admin panel
- Look for connected devices named "raspberrypi" or similar

## Step 2: Set Up Pi5 API Server

### Copy the server script to your Pi5:
```bash
# Copy pi5-server.py to your Pi5 (replace with your Pi5's IP)
scp pi5-server.py pi@192.168.1.100:/home/pi/
```

### Or create the file directly on Pi5:
```bash
# SSH into your Pi5
ssh pi@192.168.1.100

# Create the server file
nano pi5-server.py
# Copy and paste the contents from pi5-server.py
```

### Make the script executable:
```bash
chmod +x pi5-server.py
```

### Install required Python packages (if needed):
```bash
# Usually not needed as these are built-in modules
pip3 install --upgrade pip
```

## Step 3: Run the Pi5 API Server

### Start the server:
```bash
# On your Pi5, run:
python3 pi5-server.py

# Or specify custom host/port:
python3 pi5-server.py 0.0.0.0 8080
```

### Test the server:
```bash
# From your computer, test the endpoints:
curl http://192.168.1.100:8080/api/status
curl http://192.168.1.100:8080/api/serial
curl http://192.168.1.100:8080/api/network
```

## Step 4: Configure DexiMind Web Interface

### Update the Pi5 configuration:
1. Open `pi5-config.js` in your web project
2. Update the IP address and port:

```javascript
const PI5_CONFIG = {
    device: {
        host: '192.168.1.100', // Replace with your Pi5's IP
        port: '8080',          // Replace with your Pi5's port
        timeout: 5000,
        checkInterval: 30000
    },
    // ... rest of config
};
```

## Step 5: Make Pi5 Server Start Automatically (Optional)

### Create a systemd service:
```bash
# On your Pi5, create service file:
sudo nano /etc/systemd/system/pi5-api.service
```

### Add this content:
```ini
[Unit]
Description=Pi5 API Server for DexiMind
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/python3 /home/pi/pi5-server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pi5-api.service
sudo systemctl start pi5-api.service

# Check status:
sudo systemctl status pi5-api.service
```

## Step 6: Test the Integration

1. Start your web server:
   ```bash
   cd "C:\Users\hp\Documents\00-ENGIX"
   python -m http.server 8000
   ```

2. Open `http://localhost:8000/deximind.html`

3. Login/Subscribe to access the chat interface

4. Verify the toggle is ON (should be green)

5. Check the Pi5 status bar at the top:
   - Should show "Pi5 Connected" with green dot
   - Should display the real Pi5 serial number
   - Should show last check timestamp

## Troubleshooting

### Pi5 Server Not Starting
```bash
# Check if port is already in use:
sudo netstat -tlnp | grep :8080

# Kill process using the port:
sudo kill -9 <PID>

# Check Python version:
python3 --version
```

### Connection Timeout
- Verify Pi5 IP address is correct
- Check firewall settings on Pi5
- Ensure both devices are on the same network
- Test with ping: `ping 192.168.1.100`

### Serial Number Not Found
```bash
# On Pi5, check if serial is available:
cat /proc/cpuinfo | grep Serial
cat /proc/device-tree/serial-number
```

### CORS Issues
- The server includes CORS headers
- If you still have issues, check browser console for errors

## API Endpoints

The Pi5 server provides these endpoints:

- `GET /api/status` - Device health, uptime, temperature
- `GET /api/serial` - Pi5 serial number
- `GET /api/network` - Network connectivity status
- `GET /api/cpuinfo` - Full CPU information

## Security Notes

- The server runs on all interfaces (0.0.0.0) for testing
- For production, consider restricting to specific IPs
- Add authentication if needed
- Use HTTPS in production environments

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check the Pi5 server logs
3. Verify network connectivity
4. Test API endpoints directly with curl
