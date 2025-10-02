#!/bin/bash
# Creates a Tombolo release branch (tombolo-NNN.MMM.PPP) from candidate-NNN.MMM.x
# Usage: ./create-release.sh [<version>] (e.g., 1.0.3)

# Colors
GREEN="\033[0;32m"
RED="\033[0;31m"
RESET="\033[0m"

ok() { echo -e "[${GREEN}OK${RESET}] $1"; }
error() { echo -e "[${RED}ERROR${RESET}] $1"; }

# Prompt for version if not provided
if [[ -z $1 ]]; then
    read -p "Enter the release version (e.g., 1.0.3): " version
else
    version=$1
fi

# Validate version format NNN.MMM.PPP
if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    error "Invalid version format: '$version' (expected NNN.MMM.PPP, e.g., 1.0.3)"
    exit 2
fi

# Extract candidate branch (NNN.MMM.x)
candidate_branch="candidate-$(echo $version | cut -d. -f1,2).x"
release_branch="tombolo-$version"
tag="v$version"

git fetch origin

# Check candidate branch exists locally or remotely
if ! git show-ref --verify --quiet "refs/heads/$candidate_branch" &&
   ! git ls-remote --exit-code --heads origin "$candidate_branch" &>/dev/null; then
    error "Candidate branch '$candidate_branch' does not exist locally or on remote."
    exit 1
fi

# Check if release branch already exists locally
if git show-ref --verify --quiet "refs/heads/$release_branch"; then
    error "Release branch '$release_branch' already exists locally."
    exit 1
fi

# Check if release branch already exists remotely
if git ls-remote --exit-code --heads origin "$release_branch" &>/dev/null; then
    error "Release branch '$release_branch' already exists on remote."
    exit 1
fi

# Check if tag already exists
if git rev-parse "$tag" >/dev/null 2>&1; then
    error "Tag '$tag' already exists."
    exit 1
fi

# Checkout candidate branch and update
git checkout "$candidate_branch"
if [ $? -ne 0 ]; then
    error "Failed to check out candidate branch '$candidate_branch'."
    exit 1
fi

git merge origin/"$candidate_branch" --ff-only
if [ $? -ne 0 ]; then
    error "Candidate branch '$candidate_branch' is inconsistent with origin/$candidate_branch."
    exit 1
fi

ok "Creating release branch '$release_branch' from '$candidate_branch'"
git checkout -b "$release_branch"
if [ $? -ne 0 ]; then
    error "Failed to create release branch '$release_branch'."
    exit 1
fi

# Tag the release
git tag "$tag"
git push origin "$release_branch" "$tag"
ok "Created release branch '$release_branch' and tagged '$tag'"
