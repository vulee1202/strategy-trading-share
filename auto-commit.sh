#!/bin/bash

# Directory of your Git repository (use relative path since it's within the project)
REPO_DIR=$(pwd)

# Monitor the directory for changes
while true; do
    inotifywait -r -e modify,create,delete "$REPO_DIR"
    cd "$REPO_DIR"
    
    # Stage all changes
    git add .
    
    # Commit with a timestamp
    git commit -m "Auto-commit on $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Push to the remote repository
    git push origin main  # Replace 'main' with your actual branch name

    # Wait for 10 minutes before the next commit
    sleep 600  # 600 seconds = 10 minutes
done
