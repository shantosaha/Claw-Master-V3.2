---
description: Resolve 'refusing to merge unrelated histories' error when pushing to remote
---

## Overview
When you see the error `fatal: refusing to merge unrelated histories` while trying to push, it means the local repository and the remote repository have completely different commit histories. This often happens when:
- You initialized a new repo locally and then added a remote that already has commits.
- The remote was recreated or force‑pushed, losing the original history.
- You are pushing to a branch that never existed on the remote.

## Step‑by‑Step Workflow
1. **Verify the remote URL**
   ```bash
   git remote -v
   ```
   Ensure the URL points to the correct repository.

2. **Fetch the remote branches**
   ```bash
   git fetch origin
   ```
   This updates your local view of the remote without merging.

3. **Inspect the remote `main` (or target) branch**
   ```bash
   git log origin/main --oneline --graph --decorate
   ```
   Confirm that the remote branch has a different history.

4. **Merge with `--allow-unrelated-histories`** (recommended if you want to keep both histories)
   ```bash
   git merge origin/main --allow-unrelated-histories
   ```
   Resolve any merge conflicts, commit the merge, then push:
   ```bash
   git push origin HEAD
   ```

   *Alternatively, if you intend to replace the remote history with your local one:*   
   ```bash
   git push --force origin main
   ```
   **Caution:** This overwrites the remote history and can affect collaborators.

5. **Set the upstream branch (if not already set)**
   ```bash
   git branch --set-upstream-to=origin/main
   ```
   After this, a simple `git push` will work.

6. **Verify the push succeeded**
   ```bash
   git status
   git log --oneline -5
   ```
   You should see no pending changes and the latest commits reflected on the remote.

## Quick Reference Commands
| Action | Command |
|--------|---------|
| Check remote | `git remote -v` |
| Fetch remote | `git fetch origin` |
| Merge unrelated histories | `git merge origin/main --allow-unrelated-histories` |
| Force‑push (override remote) | `git push --force origin main` |
| Set upstream | `git branch --set-upstream-to=origin/main` |

## Tips
- **Backup**: Before a force‑push, consider creating a tag on the current remote state: `git tag backup-$(date +%F) origin/main && git push origin backup-$(date +%F)`.
- **Collaboration**: Communicate with teammates before rewriting history.
- **Avoid future issues**: Clone the repository directly instead of initializing a new repo locally when starting work.

---

*This workflow can be executed manually or automated via a script. Save it in the `.agent/workflows` directory for future reference.*
