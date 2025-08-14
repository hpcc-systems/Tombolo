#!/bin/bash
# Upmerges changes from source to target branch
# Usage: ./upmerge.sh [<source-version>] [<target-version>] (e.g., 1.0.x 1.1.x or master)

# Colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

ok() { echo -e "[${GREEN}OK${RESET}] $1"; }
error() { echo -e "[${RED}ERROR${RESET}] $1"; }
warn() { echo -e "[${YELLOW}WARN${RESET}] $1"; }

# Prompt for source version if missing
if [[ -z $1 ]]; then
    read -p "Enter the source version (e.g., 1.0.x): " source_version
else
    source_version=$1
fi

# Prompt for target version if missing
if [[ -z $2 ]]; then
    read -p "Enter the target version (e.g., 1.1.x or master): " target_input
else
    target_input=$2
fi

# Normalize branch names
source_branch="candidate-$source_version"
if [[ "$target_input" == "master" ]]; then
    target_branch="master"
else
    target_branch="candidate-$target_input"
fi

# Validate candidate version format
candidate_regex='^[0-9]+\.[0-9]+\.x$'
if [[ ! $source_version =~ $candidate_regex ]]; then
    error "Invalid source version: '$source_version' (expected NNN.MMM.x)"
    exit 2
fi
if [[ "$target_branch" != "master" && ! $target_input =~ $candidate_regex ]]; then
    error "Invalid target version: '$target_input' (expected NNN.MMM.x or master)"
    exit 2
fi

git fetch origin --quiet

# Check for uncommitted changes before switching
UNSTAGED=$(git status --porcelain)
if [[ -n $UNSTAGED ]]; then
    warn "You have uncommitted changes:"
    echo "$UNSTAGED" | awk '{print "  " $0}'
    error "Please commit or stash changes before running upmerge."
    exit 1
fi

# Check if source branch exists locally or remotely
if ! git show-ref --verify --quiet "refs/heads/$source_branch" &&
   ! git ls-remote --exit-code --heads origin "$source_branch" &>/dev/null; then
    error "Source branch '$source_branch' does not exist locally or remotely."
    exit 1
fi

# Check if target branch exists locally or remotely
if ! git show-ref --verify --quiet "refs/heads/$target_branch" &&
   ! git ls-remote --exit-code --heads origin "$target_branch" &>/dev/null; then
    error "Target branch '$target_branch' does not exist locally or remotely."
    exit 1
fi

# Checkout target branch
if git show-ref --verify --quiet "refs/heads/$target_branch"; then
    git checkout "$target_branch" || { error "Failed to check out '$target_branch'"; exit 1; }
else
    git checkout -b "$target_branch" "origin/$target_branch" || { error "Failed to check out remote '$target_branch'"; exit 1; }
fi

# Fast-forward target branch from remote
git merge --ff-only "origin/$target_branch" &>/dev/null
ok "Target branch '$target_branch' is up to date with 'origin/$target_branch'"

# Attempt merge quietly
ok "Checking for changes to merge from '$source_branch' into '$target_branch'"
git merge "$source_branch" --no-commit --no-ff &>/dev/null
MERGE_STATUS=$?

if [[ $MERGE_STATUS -eq 0 ]]; then
    # Check if there are actual changes
    if git diff-index --quiet HEAD --; then
        warn "Target branch '$target_branch' is already up-to-date with '$source_branch'. Nothing to merge."
        git merge --abort &>/dev/null
        exit 0
    fi

    git commit -s --no-edit &>/dev/null
    git push origin "$target_branch" &>/dev/null
    ok "Upmerge completed to '$target_branch'"
else
    error "Merge conflicts detected during upmerge. Please resolve manually."
    exit 1
fi

# Warn about untracked files after merge
UNTRACKED_COUNT=$(git ls-files --others --exclude-standard | wc -l | xargs)
if [[ $UNTRACKED_COUNT -gt 0 ]]; then
    warn "There are still $UNTRACKED_COUNT untracked files after upmerge."
fi
