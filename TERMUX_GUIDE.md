# Running Claw Master V3 on Android (Termux)

Follow this guide to run this project entirely on your Android phone.

## 1. Prerequisites
- Install **Termux** (Recommended: Download from **F-Droid**, not the Play Store).
- A GitHub account with your code pushed.

## 2. One-Time Setup
When you first open Termux, run these commands:

```bash
# Clone your code
git clone <your-repo-url>
cd Claw-Master-V3

# Make scripts executable
chmod +x termux-setup.sh start-termux.sh

# Run the setup script
./termux-setup.sh

# Install Node dependencies (Skipping Puppeteer/Chromium which fails on phone)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install
```

## 3. Running the App
Every time you want to use the app:

```bash
cd Claw-Master-V3
./start-termux.sh
```

Then open your phone browser to: `http://localhost:3000`

## 4. Troubleshooting Packages
If `npm install` fails for certain packages (like Syncfusion or Firebase):

1. **Check Node version**: `node -v`. Termux usually has the latest.
2. **Native Modules**: Some modules like `grpc` or `canvas` fail on ARM. If a package is only for the Mac (like a specific calendar), we can remove it from `package.json` to make the install succeed on the phone.
