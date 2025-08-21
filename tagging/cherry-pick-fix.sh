#!/bin/bash
# Cherry-picks a commit to a target branch
# Usage: ./cherry-pick-fix.sh [<source-branch>] [<target-branch>] [--show-commit] [--list=N]

# Colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

ok() { echo -e "[${GREEN}OK${RESET}] $1"; }
error() { echo -e "[${RED}ERROR${RESET}] $1"; }
warn() { echo -e "[${YELLOW}WARN${RESET}] $1"; }

SHOW_COMMIT=false
LIST_COMMITS=10   # default number of commits to display

# Parse flags
for arg in "$@"; do
    if [[ "$arg" == "--show-commit" ]]; then
        SHOW_COMMIT=true
    elif [[ "$arg" == --list=* ]]; then
        LIST_COMMITS=$(echo "$arg" | cut -d= -f2)
    fi
done

# Prompt for source branch
if [[ -z $1 ]]; then
    read -p "Enter the source branch (e.g., candidate-1.0.x): " SOURCE_BRANCH
else
    SOURCE_BRANCH=$1
fi

# Check local source branch exists
if ! git show-ref --verify --quiet "refs/heads/$SOURCE_BRANCH"; then
    error "Source branch '$SOURCE_BRANCH' does not exist locally."
    exit 1
fi

# Display latest commits from local branch with green hash, message, date, and time
echo "Latest $LIST_COMMITS commits on branch '$SOURCE_BRANCH':"
git log "$SOURCE_BRANCH" -n "$LIST_COMMITS" --pretty=format:$'  \033[0;32m%h\033[0m  %s  %ad' --date=format:'%Y-%m-%d %H:%M:%S'

# Prompt for commit hash
read -p "Enter the commit hash to cherry-pick: " COMMIT_HASH

# Prompt for target branch
if [[ -z $2 ]]; then
    read -p "Enter the target branch (e.g., master or candidate-1.0.x): " TARGET_BRANCH
else
    TARGET_BRANCH=$2
fi

# Validate input
if [[ -z $COMMIT_HASH ]]; then
    error "No commit hash provided."
    exit 2
fi
if [[ -z $TARGET_BRANCH ]]; then
    error "No target branch provided."
    exit 2
fi

# Check working tree is clean
if ! git diff-index --quiet HEAD --; then
    warn "Changes not staged for commit:"
    git status --short | sed 's/^/  /'
    error "Please commit or stash changes before cherry-picking."
    exit 1
fi

# Fetch remote for target branch
git fetch origin --quiet

# Checkout target branch
git checkout "$TARGET_BRANCH"
if [ $? -ne 0 ]; then
    error "Failed to check out target branch '$TARGET_BRANCH'."
    exit 1
fi

# Fast-forward target branch to remote
git merge --ff-only origin/"$TARGET_BRANCH" &>/dev/null
ok "Target branch '$TARGET_BRANCH' is up to date with origin/$TARGET_BRANCH"

# Check if commit is already in target
if git merge-base --is-ancestor "$COMMIT_HASH" "$TARGET_BRANCH"; then
    if [[ "$SHOW_COMMIT" == true ]]; then
        commit_info=$(git log -n 1 --pretty=format:"%h %s" "$COMMIT_HASH")
        warn "Commit $commit_info is already included in '$TARGET_BRANCH'. Nothing to cherry-pick."
    else
        warn "Commit '$COMMIT_HASH' is already included in '$TARGET_BRANCH'. Nothing to cherry-pick."
    fi
    exit 0
fi

# Cherry-pick the commit
ok "Cherry-picking commit $COMMIT_HASH to '$TARGET_BRANCH'..."
git cherry-pick "$COMMIT_HASH"
if [ $? -ne 0 ]; then
    error "Conflicts detected during cherry-pick. Please resolve manually."
    exit 1
fi

git push origin "$TARGET_BRANCH"
ok "Cherry-picked commit $COMMIT_HASH to '$TARGET_BRANCH'"
