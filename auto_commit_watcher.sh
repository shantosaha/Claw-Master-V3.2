#!/bin/bash

# ============================================================
# Smart Auto Commit Watcher Script
# ============================================================
# This script runs every 5 MINUTES and auto-commits when:
#   - 5+ files have been modified, OR
#   - A major change is detected (new files, deletions, renames)
#
# It auto-generates commit messages based on the changed files.
# It does NOT push automatically - you push manually when ready.
#
# Auto-starts when you open the project in VS Code.
# ============================================================

PROJECT_DIR="/Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3"
CHANGE_THRESHOLD=5
CHECK_INTERVAL=300  # 5 minutes in seconds
LOG_FILE="$PROJECT_DIR/.git/auto_commit.log"
PID_FILE="$PROJECT_DIR/.git/auto_commit.pid"

# Ensure only one instance runs
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Auto-commit watcher already running (PID: $OLD_PID)"
        exit 0
    fi
fi

# Save current PID
echo $$ > "$PID_FILE"

cd "$PROJECT_DIR" || { echo "Failed to cd to $PROJECT_DIR"; exit 1; }

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

generate_commit_message() {
    local staged_files=$(git diff --cached --name-only 2>/dev/null)
    local changed_count=$(echo "$staged_files" | grep -v '^$' | wc -l | tr -d ' ')
    
    if [ "$changed_count" -eq 0 ]; then
        echo "chore: minor updates"
        return
    fi
    
    # Analyze changes for smart message generation
    local has_components=$(echo "$staged_files" | grep -c "src/components/" || echo 0)
    local has_pages=$(echo "$staged_files" | grep -c "src/app/" || echo 0)
    local has_services=$(echo "$staged_files" | grep -c "src/services/" || echo 0)
    local has_types=$(echo "$staged_files" | grep -c "src/types/" || echo 0)
    local has_api=$(echo "$staged_files" | grep -c "api/" || echo 0)
    local has_styles=$(echo "$staged_files" | grep -cE "\.(css|scss)$" || echo 0)
    local has_config=$(echo "$staged_files" | grep -cE "(package|tsconfig|next\.config)" || echo 0)
    
    # Determine commit type
    local commit_type="chore"
    if [ "$has_styles" -gt 0 ]; then
        commit_type="style"
    elif [ "$has_config" -gt 0 ]; then
        commit_type="build"
    elif [ "$has_components" -gt 0 ] || [ "$has_pages" -gt 0 ]; then
        commit_type="feat"
    elif [ "$has_services" -gt 0 ] || [ "$has_api" -gt 0 ]; then
        commit_type="feat"
    elif [ "$has_types" -gt 0 ]; then
        commit_type="refactor"
    fi
    
    # Determine scope from most changed area
    local commit_scope=""
    if [ "$has_pages" -gt 0 ]; then
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
    local commit_desc=""
    if [ "$changed_count" -eq 1 ]; then
        local single_file=$(echo "$staged_files" | head -1 | xargs basename)
        commit_desc="update $single_file"
    elif [ "$changed_count" -le 3 ]; then
        local file_list=$(echo "$staged_files" | head -3 | xargs -I {} basename {} | tr '\n' ', ' | sed 's/,$//')
        commit_desc="update $file_list"
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
    # Get detailed status
    local status_output=$(git status --porcelain 2>/dev/null)
    
    local modified_count=$(echo "$status_output" | grep -c '^ M\|^M ' || echo 0)
    local added_count=$(echo "$status_output" | grep -c '^??' || echo 0)
    local deleted_count=$(echo "$status_output" | grep -c '^ D\|^D ' || echo 0)
    local renamed_count=$(echo "$status_output" | grep -c '^R' || echo 0)
    
    local total_changes=$((modified_count + added_count + deleted_count + renamed_count))
    
    if [ "$total_changes" -eq 0 ]; then
        return 0
    fi
    
    # Determine if we should commit
    local should_commit=false
    local reason=""
    
    # Rule 1: 5+ file changes
    if [ "$total_changes" -ge "$CHANGE_THRESHOLD" ]; then
        should_commit=true
        reason="📊 $total_changes files changed (threshold: $CHANGE_THRESHOLD)"
    fi
    
    # Rule 2: Any new files added (major change)
    if [ "$added_count" -gt 0 ]; then
        should_commit=true
        reason="➕ $added_count new file(s) added"
    fi
    
    # Rule 3: Any files deleted (major change)
    if [ "$deleted_count" -gt 0 ]; then
        should_commit=true
        reason="➖ $deleted_count file(s) deleted"
    fi
    
    # Rule 4: Any files renamed (major change)
    if [ "$renamed_count" -gt 0 ]; then
        should_commit=true
        reason="🔄 $renamed_count file(s) renamed"
    fi
    
    if [ "$should_commit" = true ]; then
        log "🔔 Triggering auto-commit: $reason"
        
        # Stage all changes
        git add -A
        
        # Generate smart commit message
        local commit_msg=$(generate_commit_message)
        
        # Commit (NO PUSH!)
        if git commit -m "$commit_msg"; then
            log "✅ Committed: $commit_msg"
            log "📌 Local commit ready - push manually with: git push"
            
            # macOS notification
            osascript -e "display notification \"$commit_msg\" with title \"Git Auto-Commit\" sound name \"Glass\"" 2>/dev/null || true
        else
            log "❌ Commit failed"
        fi
    else
        log "⏳ $total_changes change(s) pending (waiting for threshold or major change)"
    fi
}

cleanup() {
    log "🛑 Auto-commit watcher stopped"
    rm -f "$PID_FILE"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Startup
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🚀 Smart Auto-Commit Watcher Started"
log "📁 Project: $PROJECT_DIR"
log "📊 Threshold: $CHANGE_THRESHOLD files"
log "⏱️  Interval: 5 minutes"
log "🔔 Auto-commit on: 5+ files, new files, deletions, renames"
log "⚠️  Auto-push: DISABLED (you push manually)"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Initial check
check_and_commit

# Main loop - every 5 minutes
while true; do
    sleep "$CHECK_INTERVAL"
    check_and_commit
done
