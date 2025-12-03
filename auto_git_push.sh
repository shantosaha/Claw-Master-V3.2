#!/bin/bash

# Auto Git Commit & Push every 5 minutes
# ------------------------------------------------------------
# This script adds all changes, creates a commit with a timestamped
# message, and pushes to the remote "origin" (main branch).
# It is intended to be run via a cron job:
#   */5 * * * * /absolute/path/to/auto_git_push.sh >> /absolute/path/to/auto_git_push.log 2>&1
# ------------------------------------------------------------

# Change to the project directory (absolute path)
PROJECT_DIR="/Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3"
cd "$PROJECT_DIR" || { echo "Failed to cd to $PROJECT_DIR"; exit 1; }

# Ensure we are on the main branch (adjust if you use a different default)
git checkout main >/dev/null 2>&1

# Add all changes (including deletions)
git add .

# Create a commit with a timestamped message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')
COMMIT_MSG="Auto commit: $TIMESTAMP"
# Only commit if there are changes
if git diff-index --quiet HEAD --; then
  echo "[$TIMESTAMP] No changes to commit."
else
  git commit -m "$COMMIT_MSG"
  echo "[$TIMESTAMP] Committed: $COMMIT_MSG"
fi

# Push to origin (main)
# If push fails (e.g., auth), log the error but continue
if git push origin main; then
  echo "[$TIMESTAMP] Push successful."
else
  echo "[$TIMESTAMP] Push failed. Check credentials or remote status."
fi

# End of script
