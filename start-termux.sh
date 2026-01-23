#!/bin/bash

# This script helps start both the Next.js app and the Python API on Termux.

# You can run this script, then open a NEW session in Termux to run the Python part manually
# OR run them together like this:

echo "Starting Claw Master V3..."

# Start Next.js
npm run dev
