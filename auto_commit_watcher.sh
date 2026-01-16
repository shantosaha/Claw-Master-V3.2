#!/bin/bash

# ============================================================
# Smart Auto Commit Watcher Script (Ultralight Logic Mode)
# ============================================================
# 1. Triggers every 5 minutes OR on file events.
# 2. Uses pure Bash/Regex analysis for instant speed.
# 3. Detects: Types (fix/perf/feat), Scopes (app/components),
#    Context (function definitions), and Actions (API/Auth/Logs).
# 4. Plays sound on commit.
# ============================================================

PROJECT_DIR="/Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3"
CHANGE_THRESHOLD=5
CHECK_INTERVAL=300
LOG_FILE="$PROJECT_DIR/.git/auto_commit.log"
PID_FILE="$PROJECT_DIR/.git/auto_commit.pid"

if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        exit 0
    fi
fi

echo $$ > "$PID_FILE"
cd "$PROJECT_DIR" || exit 1

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

generate_commit_message() {
    local staged_files=$(git diff --cached --name-only 2>/dev/null)
    local full_diff=$(git diff --cached 2>/dev/null)
    local changed_count=$(echo "$staged_files" | grep -v '^$' | wc -l | tr -d '[:space:]')
    
    if [ "$changed_count" -eq 0 ]; then
        echo "chore: minor updates"
        return
    fi
    
    # 1. Determine commit type (Priority: fix > perf > feat > style > build > chore)
    local commit_type="chore"
    if echo "$full_diff" | grep -iqE "fix|bug|error|handle|resolve|patch"; then commit_type="fix"
    elif echo "$full_diff" | grep -iqE "perf|optimize|speed|fast|calc"; then commit_type="perf"
    elif echo "$staged_files" | grep -qE "\.(css|scss|less|sass)$"; then commit_type="style"
    elif echo "$staged_files" | grep -q "src/types/"; then commit_type="refactor"
    elif echo "$staged_files" | grep -qE "(package|tsconfig|next\.config|eslint)"; then commit_type="build"
    elif echo "$staged_files" | grep -qE "src/(components|app|services|hooks)"; then commit_type="feat"
    fi
    
    # 2. Determine Scope & Smart Grouping
    local commit_scope=""
    # Check if we have a matched pair (e.g. Header.tsx and Header.css)
    local base_names=$(echo "$staged_files" | sed -E 's/\.[^.]+$//' | sort | uniq -d)
    if [ -n "$base_names" ]; then
        # Use the name of the component that had both logic and style changes
        local scoped_name=$(basename "$(echo "$base_names" | head -1)")
        commit_scope="$scoped_name"
    elif echo "$staged_files" | grep -q "src/app/"; then
        local page_name=$(echo "$staged_files" | grep "src/app/" | grep -v "\.txt$" | head -1 | sed 's|src/app/||' | cut -d'/' -f1)
        if [[ -n "$page_name" && "$page_name" != "page.tsx" && "$page_name" != "globals.css" ]]; then
             commit_scope="$page_name"
        else
             commit_scope="app"
        fi
    elif echo "$staged_files" | grep -q "src/components/"; then
        commit_scope=$(echo "$staged_files" | grep "src/components/" | head -1 | sed 's|src/components/||' | cut -d'/' -f1)
    elif echo "$staged_files" | grep -q "src/services/"; then
        commit_scope="services"
    fi
    
    # 3. Generate Description
    local commit_desc=""
    
    # A. Detect specific actions on internals (API, Auth, Logging)
    if echo "$full_diff" | grep -iqE "api/|endpoint|axios|fetch|route"; then
        commit_desc="update API integration"
    elif echo "$full_diff" | grep -iqE "auth|login|permission|guard"; then
        commit_desc="update authentication logic"
    elif echo "$full_diff" | grep -iqE "console\.log|logger|debug"; then
        commit_desc="add debug logging"
    fi

    # B. Extract modified function context (Git diff hunk headers)
    # Looks for lines like: @@ -10,4 +10,5 @@ export function myFunc() {
    local method_context=$(echo "$full_diff" | grep "^@@" | sed -E 's/.*@@.* (export )?(function|const|class|let) ([a-zA-Z0-9_]+).*/\3/' | grep -v "@@" | head -1)
    
    # C. Detect New Exports
    local new_item=$(echo "$full_diff" | grep -E "^\+.*export (const|function|class|interface)" | head -1 | sed -E 's/^\+.*export (const|function|class|interface) ([a-zA-Z0-9_]+).*/\2/')
    
    local top_file=$(echo "$staged_files" | grep -v "\.txt$" | head -1)
    [ -z "$top_file" ] && top_file=$(echo "$staged_files" | head -1)
    local top_filename=$(basename "$top_file")

    # D. Construct the sentence
    if [ -n "$new_item" ] && [[ ! "$new_item" =~ ^(const|function|class|interface)$ ]]; then
        # Case: New Item Added
        if [ -n "$commit_desc" ]; then
            commit_desc="$commit_desc and implement $new_item"
        else
            commit_desc="add $new_item logic to $top_filename"
        fi
    elif [ -n "$method_context" ]; then
        # Case: Existing Function Modified
        if [ -n "$commit_desc" ]; then
            commit_desc="$commit_desc in $method_context"
        else
            commit_desc="update $method_context logic in $top_filename"
        fi
    fi

    # Fallback
    if [ -z "$commit_desc" ]; then
        commit_desc="update $top_filename"
        [ "$changed_count" -gt 1 ] && commit_desc="update $changed_count files"
    fi
    
    # Final String
    if [ -n "$commit_scope" ]; then
        echo "${commit_type}(${commit_scope}): ${commit_desc}"
    else
        echo "${commit_type}: ${commit_desc}"
    fi
}

check_and_commit() {
    local status_output=$(git status --porcelain 2>/dev/null)
    [ -z "$status_output" ] && return 0

    local total_changes=$(echo "$status_output" | wc -l | tr -d '[:space:]')
    local added_count=$(echo "$status_output" | grep -c '^??\|^A ' | tr -d '[:space:]' || echo 0)
    local deleted_count=$(echo "$status_output" | grep -c '^ D\|^D ' | tr -d '[:space:]' || echo 0)
    local renamed_count=$(echo "$status_output" | grep -c '^R' | tr -d '[:space:]' || echo 0)
    
    local should_commit=false
    local reason=""
    
    if [ "$total_changes" -ge "$CHANGE_THRESHOLD" ]; then
        should_commit=true
        reason="📊 $total_changes changes"
    elif [ "$added_count" -gt 0 ]; then
        should_commit=true
        reason="➕ New files"
    elif [ "$deleted_count" -gt 0 ]; then
        should_commit=true
        reason="➖ Deletions"
    elif [ "$renamed_count" -gt 0 ]; then
        should_commit=true
        reason="🔄 Renames"
    fi
    
    if [ "$should_commit" = true ]; then
        log "🔔 Triggering: $reason"
        git add -A
        local commit_msg=$(generate_commit_message)
        if git commit -m "$commit_msg"; then
            log "✅ Committed: $commit_msg"
            osascript -e "display notification \"$commit_msg\" with title \"Git Auto-Commit\"" 2>/dev/null || true
            afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
        fi
    fi
}

cleanup() {
    rm -f "$PID_FILE"
    exit 0
}

trap cleanup SIGINT SIGTERM

log "🚀 Watcher Active (Ultralight Logic Mode)"
check_and_commit

while true; do
    sleep "$CHECK_INTERVAL"
    check_and_commit
done
