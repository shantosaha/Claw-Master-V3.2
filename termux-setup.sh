#!/bin/bash

echo "Starting Termux Setup for Claw-Master-V3..."

# 1. Update packages
pkg update && pkg upgrade -y

# 2. Install core dependencies
pkg install nodejs python git -y

# 3. Set environment variables to skip problematic packages on mobile
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 4. Install Python dependencies for the API
pip install fastapi uvicorn

# 4. Success message
echo "-----------------------------------------------"
echo "Setup complete!"
echo "Next steps:"
echo "1. Run 'npm install'"
echo "2. Run './start-termux.sh'"
echo "-----------------------------------------------"
