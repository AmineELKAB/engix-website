#!/usr/bin/env python3
"""
Start DexiMind P6 UI Server
===========================

This script starts the DexiMind P6 UI server for production deployment.
It handles the standalone P6 UI server that provides the web interface
accessible at https://engix.dev/deximind-p6-ui.html

Author: DexiMind Development Team
Date: 2025-01-15
Version: 1.0.0
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def start_p6_ui_server():
    """Start the P6 UI server"""
    try:
        # Check if standalone_p6_ui.py exists
        script_path = Path("standalone_p6_ui.py")
        if not script_path.exists():
            logger.error("❌ standalone_p6_ui.py not found!")
            return False
        
        logger.info("🚀 Starting DexiMind P6 UI Server...")
        logger.info("📡 Server will be available at: http://localhost:8001")
        logger.info("🌐 Web interface: https://engix.dev/deximind-p6-ui.html")
        
        # Start the server
        subprocess.run([sys.executable, "standalone_p6_ui.py"], check=True)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to start P6 UI server: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Error starting P6 UI server: {e}")
        return False

if __name__ == "__main__":
    logger.info("🎬 DexiMind P6 UI Server Startup")
    logger.info("=" * 50)
    
    success = start_p6_ui_server()
    
    if success:
        logger.info("✅ P6 UI Server started successfully")
    else:
        logger.error("❌ Failed to start P6 UI Server")
        sys.exit(1)
