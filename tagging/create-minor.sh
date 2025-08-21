#!/bin/bash
# Creates a new minor version candidate branch
# Usage: ./create-minor.sh [<source-major.minor.x>] [<new-minor-number>]
# Example: ./create-minor.sh 1.0.x 4

# Colors
GREEN="\033[0;32m"
RED="\033[0;31m"
RESET="\033[0m"

ok() { echo -e "[${GREEN}OK${RESET}] $1"; }
error() { echo -e "[${RED}ERROR${RESET}] $1"; }

# Prompt for source version if not provided
if [[ -z $1 ]]; then
    read -p "Enter the source version (e.g., 1.0.x): " source_version
else
    source_version=$1
fi

# Validate source version format
if [[ -z $source_version || ! $source_version =~ ^[0-9]+\.[0-9]+\.x$ ]]; then
    error "Invalid source version format: '$source_version' (expected e.g., 1.0.x)"
    exit 2
fi

# Extract major version from source
source_major=$(echo "$source_version" | cut -d. -f1)

# Prompt for new minor number if not provided
if [[ -z $2 ]]; then
    read -p "Enter the new minor version (e.g., 4 to create candidate-${source_major}.4.x): " new_minor
else
    new_minor=$2
fi

# Validate that the minor version is a single number
if [[ -z $new_minor || ! $new_minor =~ ^[0-9]+$ ]]; then
    error "Invalid minor version number: '$new_minor' (expected a single number like 4)"
    exit 2
fi

# Construct full new version
new_version="${source_major}.${new_minor}.x"
source_branch="candidate-${source_version}"
new_branch="candidate-${new_version}"

# Fetch remote branches
git fetch origin --quiet

# Check if source branch exists locally or remotely
if ! git show-ref --verify --quiet "refs/heads/$source_branch" &&
   ! git ls-remote --exit-code --heads origin "$source_branch" &>/dev/null; then
    error "Source branch '$source_branch' does not exist locally or on remote."
    exit 1
fi

# Check if new branch already exists locally or remotely
if git show-ref --verify --quiet "refs/heads/$new_branch" ||
   git ls-remote --exit-code --heads origin "$new_branch" &>/dev/null; then
    error "Branch '$new_branch' already exists locally or on remote."
    exit 1
fi

# Checkout source branch from local or remote
if git show-ref --verify --quiet "refs/heads/$source_branch"; then
    git checkout "$source_branch" || { error "Failed to check out '$source_branch'"; exit 1; }
else
    git checkout -b "$source_branch" origin/"$source_branch" || { error "Failed to check out remote '$source_branch'"; exit 1; }
fi

# Merge from remote to ensure it’s up to date
git merge origin/"$source_branch" --ff-only || { error "Source branch '$source_branch' is inconsistent with origin/$source_branch"; exit 1; }

# Create and push new branch
ok "Creating new minor branch $new_branch from $source_branch"
git checkout -b "$new_branch" || { error "Failed to create $new_branch"; exit 1; }
git push origin "$new_branch" || { error "Failed to push $new_branch"; exit 1; }

ok "Created and pushed $new_branch"
