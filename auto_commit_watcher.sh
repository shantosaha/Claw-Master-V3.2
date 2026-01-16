#!/bin/bash

# ============================================================
# Auto Commit Watcher Script
# ============================================================
# This script watches for file changes and auto-commits after:
#   - 5+ files have been modified, OR
#   - A major change is detected (new files, deletions, etc.)
#
# It auto-generates commit messages based on the changed files.
# It does NOT push automatically - you push manually when ready.
#
# Usage: ./auto_commit_watcher.sh
# To stop: Press Ctrl+C or kill the process
# ============================================================

PROJECT_DIR="/Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3"
CHANGE_THRESHOLD=5
CHECK_INTERVAL=30  # seconds between checks
LOG_FILE="$PROJECT_DIR/.git/auto_commit.log"

cd "$PROJECT_DIR" || { echo "Failed to cd to $PROJECT_DIR"; exit 1; }

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

generate_commit_message() {
    # Get list of changed files
    local staged_files=$(git diff --cached --name-only 2>/dev/null)
    local changed_count=$(echo "$staged_files" | grep -v '^$' | wc -l | tr -d ' ')
    
    if [ "$changed_count" -eq 0 ]; then
        echo "chore: minor updates"
        return
    fi
    
    # Analyze the changes to generate a meaningful message
    local has_components=$(echo "$staged_files" | grep -c "src/components/" || true)
    local has_pages=$(echo "$staged_files" | grep -c "src/app/" || true)
    local has_services=$(echo "$staged_files" | grep -c "src/services/" || true)
    local has_types=$(echo "$staged_files" | grep -c "src/types/" || true)
    local has_api=$(echo "$staged_files" | grep -c "api/" || true)
    local has_styles=$(echo "$staged_files" | grep -cE "\.(css|scss)$" || true)
    
    # Get the most commonly changed directory
    local main_dir=$(echo "$staged_files" | grep "^src/" | head -1 | cut -d'/' -f2-3 | head -1)
    
    # Build commit type
    local commit_type="chore"
    local commit_scope=""
    local commit_desc=""
    
    # Determine type based on changes
    if [ "$has_styles" -gt 0 ]; then
        commit_type="style"
    elif [ "$has_components" -gt 0 ] || [ "$has_pages" -gt 0 ]; then
        commit_type="feat"
    elif [ "$has_services" -gt 0 ] || [ "$has_api" -gt 0 ]; then
        commit_type="feat"
    elif [ "$has_types" -gt 0 ]; then
        commit_type="refactor"
    fi
    
    # Determine scope
    if [ "$has_pages" -gt 0 ]; then
        # Extract page name from first matching file
        local page_name=$(echo "$staged_files" | grep "src/app/" | head -1 | sed 's|src/app/||' | cut -d'/' -f1)
        if [ -n "$page_name" ] && [ "$page_name" != "page.tsx" ]; then
            commit_scope="$page_name"
        fi
    elif [ "$has_components" -gt 0 ]; then
        local comp_dir=$(echo "$staged_files" | grep "src/components/" | head -1 | sed 's|src/components/||' | cut -d'/' -f1)
        if [ -n "$comp_dir" ]; then
            commit_scope="$comp_dir"
        fi
    elif [ "$has_services" -gt 0 ]; then
        commit_scope="services"
    fi
    
    # Generate description
    if [ "$changed_count" -eq 1 ]; then
        local single_file=$(echo "$staged_files" | head -1 | xargs basename)
        commit_desc="update $single_file"
    else
        commit_desc="update $changed_count files"
    fi
    
    # Build final message
    if [ -n "$commit_scope" ]; then
        echo "${commit_type}(${commit_scope}): ${commit_desc}"
    else
        echo "${commit_type}: ${commit_desc}"
    fi
}

check_and_commit() {
    # Get status of working directory
    local modified_files=$(git status --porcelain 2>/dev/null | grep -v '^??' | wc -l | tr -d ' ')
    local new_files=$(git status --porcelain 2>/dev/null | grep '^??' | wc -l | tr -d ' ')
    local deleted_files=$(git status --porcelain 2>/dev/null | grep '^ D\|^D ' | wc -l | tr -d ' ')
    
    local total_changes=$((modified_files + new_files + deleted_files))
    
    if [ "$total_changes" -eq 0 ]; then
        return 0  # No changes
    fi
    
    # Check if we should commit
    local should_commit=false
    local reason=""
    
    if [ "$total_changes" -ge "$CHANGE_THRESHOLD" ]; then
        should_commit=true
        reason="$total_changes files changed (threshold: $CHANGE_THRESHOLD)"
    elif [ "$new_files" -gt 0 ]; then
        should_commit=true
        reason="$new_files new file(s) added"
    elif [ "$deleted_files" -gt 0 ]; then
        should_commit=true
        reason="$deleted_files file(s) deleted"
    fi
    
    if [ "$should_commit" = true ]; then
        log "Triggering auto-commit: $reason"
        
        # Stage all changes
        git add -A
        
        # Generate commit message
        local commit_msg=$(generate_commit_message)
        
        # Add timestamp to message
        local timestamp=$(date '+%Y-%m-%d %H:%M')
        commit_msg="$commit_msg [$timestamp]"
        
        # Commit (but don't push!)
        if git commit -m "$commit_msg"; then
            log "✅ Committed: $commit_msg"
            log "📌 Ready to push when you want (git push)"
        else
            log "❌ Commit failed"
        fi
    fi
}

# Main loop
log "🚀 Auto-commit watcher started"
log "📁 Watching: $PROJECT_DIR"
log "📊 Commit threshold: $CHANGE_THRESHOLD files"
log "⏱️  Check interval: ${CHECK_INTERVAL}s"
log "⚠️  Auto-push is DISABLED - you push manually"
log "---"

while true; do
    check_and_commit
    sleep "$CHECK_INTERVAL"
done
