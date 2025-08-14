#!/bin/bash
# Creates a new major version candidate branch from master
# Usage: ./create-major.sh [<major-number>] (e.g., 3)

# Colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

# Functions for colored messages
ok() { echo -e "[${GREEN}OK${RESET}] $1"; }
error() { echo -e "[${RED}ERROR${RESET}] $1"; }
warn() { echo -e "[${YELLOW}WARN${RESET}] $1"; }

# Prompt for major number if not provided
if [[ -z $1 ]]; then
    read -p "Enter the new major version number (e.g., 3 to create candidate-3.0.x): " major
else
    major=$1
fi

# Validate input: must be a number
if [[ -z $major || ! $major =~ ^[0-9]+$ ]]; then
    error "Invalid major version number: '$major' (expected a single number like 3)"
    exit 2
fi

version="${major}.0.x"
new_branch="candidate-$version"

# Always fetch latest remote branches
git fetch origin --quiet

# Check for uncommitted changes before any branch operation
WORKING_DIR_DIRTY=$(git status --porcelain)
if [[ -n "$WORKING_DIR_DIRTY" ]]; then
    error "You have uncommitted changes. Please commit or stash them before creating a new branch."
    echo "$WORKING_DIR_DIRTY" | while read -r line; do
        echo "  $line"
    done
    exit 1
fi

# Check if master exists locally or remotely
if ! git show-ref --verify --quiet "refs/heads/master" &&
   ! git ls-remote --exit-code --heads origin master &>/dev/null; then
    error "Branch 'master' does not exist locally or on remote."
    exit 1
fi

# Check if new branch already exists locally or remotely
if git show-ref --verify --quiet "refs/heads/$new_branch" ||
   git ls-remote --exit-code --heads origin "$new_branch" &>/dev/null; then
    error "Branch '$new_branch' already exists locally or on remote."
    exit 1
fi

# Checkout master from local or remote
if git show-ref --verify --quiet "refs/heads/master"; then
    git checkout master || { error "Failed to check out local 'master'"; exit 1; }
else
    git checkout -b master origin/master || { error "Failed to check out remote 'master'"; exit 1; }
fi

# Merge from remote to ensure it’s up to date
git merge origin/master --ff-only || { error "Branch 'master' is inconsistent with origin/master"; exit 1; }

# Create and push new branch
ok "Creating new major branch $new_branch from master"
git checkout -b "$new_branch" || { error "Failed to create $new_branch"; exit 1; }
git push origin "$new_branch" || { error "Failed to push $new_branch"; exit 1; }

ok "Created and pushed $new_branch"
