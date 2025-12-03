#!/bin/bash

# GitHub Repository Setup Script for Claw Master V3
# This script will help you push your project to GitHub

echo "🚀 Claw Master V3 - GitHub Setup"
echo "================================"
echo ""

# Get repository name from user
echo "📝 Enter your GitHub repository name (default: claw-master-v3):"
read -r REPO_NAME
REPO_NAME=${REPO_NAME:-claw-master-v3}

# GitHub username (detected from git config)
GITHUB_USER="shantosaha"

echo ""
echo "Repository Details:"
echo "  Username: $GITHUB_USER"
echo "  Repository: $REPO_NAME"
echo "  URL: https://github.com/$GITHUB_USER/$REPO_NAME.git"
echo ""

# Confirm before proceeding
echo "⚠️  Make sure you have created the repository on GitHub first!"
echo "   Go to: https://github.com/new"
echo ""
echo "Continue? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Setup cancelled"
    exit 1
fi

# Add remote origin
echo ""
echo "🔗 Adding remote origin..."
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

if [ $? -eq 0 ]; then
    echo "✅ Remote origin added successfully"
else
    echo "⚠️  Remote origin might already exist. Trying to update..."
    git remote set-url origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Your repository is now available at:"
    echo "   https://github.com/$GITHUB_USER/$REPO_NAME"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   1. Repository exists on GitHub"
    echo "   2. You have the correct permissions"
    echo "   3. Your GitHub credentials are configured"
    echo ""
    echo "You may need to authenticate with GitHub."
    echo "Try running: gh auth login"
fi
