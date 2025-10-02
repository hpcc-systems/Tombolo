---
sidebar_position: -97
pagination_next: null
pagination_prev: null
title: Versioning and Git Branching
---

# Versioning and Git Branching Strategy

---

## Versioning

In general, Tombolo uses `major.minor.point` (`NNN.MMM.PPP`) semantic versioning. `point` is sometimes
referred to as `patch`.

Major changes in functionality, or significant backward compatibility issues, will trigger a
release of a new `major` version. Otherwise, releases will be rolled into a new `minor` version.
Bug fixes and security updates will be rolled into a new `point` version.

For managing these versions, there are scripts available. See [Git Version Management Scripts](#git-version-management-scripts) for the scripts.
.

---

## Git Branching Strategy

Our Git branches follow a hierarchical structure, organized by levels of stability and release readiness:

```text
master                            <--- working branch for unspecified version work
  └── candidate-NNN.MMM.x         <--- working branch for all NNN.MMM versions
        └── tombolo-NNN.MMM.PPP   <--- release branch, immutable
```

---

### Branch Descriptions

- **master**  
  The root of the hierarchy. This branch reflects the latest code, plus new features that are not
  yet targeted to a specific version. It is the default branch for the Github repo and therefore
  it is the branch that is checked by Dependabot and related tools.

- **candidate-NNN.MMM.x**  
  A branch containing staged features for a pending `major.minor.point` release. Used for
  final polishing and testing before a release candidate becomes official. Development
  of brand-new features for a specific version occur in this branch. All changes to this
  branch are isolated into pull requests which are then merged up into later `NNN.MMM.X`
  branches and to the master branch when a related `NNN.MMM.PPP` branch is released.

- **tombolo-NNN.MMM.PPP**  
  A stable, versioned release branch deployed to production. These branches should
  be immutable after release.

---

### Candidate Branch Creation

Candidate branches in the format `candidate-NNN.MMM.x` are created whenever
development needs to target the next major or minor version of Tombolo. Both bug fixes and
new feature development that target a specific version occur in this branch.
In general, there should **always** be a candidate branch naming an unreleased
Tombolo version.

---

### Release Process

Releasing a new Tombolo version means branching the associated `candidate-NNN.MMM.x`
branch as `tombolo-NNN.MMM.PPP`. This branch is then considered immutable. Tombolo's
version is generally known as `NNN.MMM` with the greatest `PPP` representing the
latest, and presumably the most stable, release of that version. New `PPP` branches
may be created, even for older versions, in order to apply bug fixes or security patches.

---

### Pull Request Guidelines

Pull requests should always target a `candidate-NNN.MMM.x` branch. The
exception would be the development of features that are not targeted to a specific
release (which might happen if the feature is extensive and likely to span several
version releases); that work would target the `master` branch.

**Pull requests should contain only one commit** when they are merged into their target
branch. Multiple commits are fine, and even encouraged while the PR is being
reviewed, but multiple commits must be squashed prior to merging.

Pull requests will be migrated upwards (upmerging) in version when release branches
are created. For example, assuming this current branch state:

```text
master
  └── candidate-2.0.x
        └── tombolo-2.0.0
  └── candidate-1.0.x
        └── tombolo-1.0.2
        └── tombolo-1.0.1
        └── tombolo-1.0.0
```

Then:

- We need to apply a bug fix for a customer's 1.0.2 Tombolo.
- The bug fix will go into the existing candidate-1.0.x branch.
- A tombolo-1.0.3 branch will be created and tested.
- Once released, the PR for the bug fix will be upmerged to candidate-2.0.x and also to master.
  This may also trigger a new 2.0.1 release branch, so v2.0 customers can receive the bug patch as well.

---

## Development Targets

To which versions/branches should changes be applied? The following gives some examples
of the types of changes and which version they would be most relevant to target.

### "master" branch (not directly tied to any specific version):

- New features.
- Bug fixes that will change the semantics of existing behavior or functionality.
- Refactoring.
- Performance improvements (unless simple and safe).

### unreleased candidate-NNN.MMM.x branch:

- New features.
- Bug fixes that will change the semantics of existing behavior or functionality.
- Refactoring.
- Performance improvements (unless simple and safe).

### current candidate-NNN.MMM.x branch:

- Bug fixes that do not change behavior or only change behavior where it previously
  crashed, or had undefined behavior.
  (If well defined but wrong need to have very strong justification to change.)
- Fixes for race conditions (the behavior was previously indeterminate so less of an argument against it changing).
- Data corruption fixes - on a case by case basis if they change existing query results.
- Missing functionality that prevents features from working.
- Changes for tech-preview work that only effect those who are using it.
- Regressions.
- Improvements to logging and error messages (possibly in "previous" if simple and added to help diagnose problems).
- Occasional simple refactoring that makes up-merging simpler.
- Changes to improve backward compatibility of new features.
- Performance improvements - if simple and safe.

### older candidate-NNN.MMM.x branch:

- Simple bug fixes that do not change behavior.
- Simple changes for missing functionality.
- Regressions with simple fixes (but care is needed if it caused a change in behavior).
- Serious regressions.
- Complex security fixes.

---

<h1 id="git-version-management-scripts">Git Version Management Scripts</h1>

The tagging directory at the root of the project contains a set of Bash scripts to help manage versioned candidate branches, major/minor releases, upmerges, and cherry-picking commits in a Git repository.

> It is required to use the scripts below for the actions mentioned, and recommended to run the commands without arguments so the scripts can prompt you with examples.

## create-major.sh

Creates a new **major version** candidate branch from `master`.

```bash
# Run without arguments and the script will prompt you
bash create-major.sh

# Or provide the major number as an argument
bash create-major.sh <major-number>
```

```bash
bash create-major.sh
# Prompts: Enter the new major version number (e.g., 3 to create candidate-3.0.x)
# Then creates candidate-<entered>.0.x from master and pushes it to origin

bash create-major.sh 3
# Creates candidate-3.0.x from master and pushes it to origin
```

## create-minor.sh

Creates a new **minor version** candidate branch from an existing candidate branch.

```bash
# Run without arguments and the script will prompt you
bash create-minor.sh

# Or provide source version and new minor number as arguments
bash create-minor.sh <source-version> <new-minor-number>
```

```bash
bash create-minor.sh
# Prompts:
# Enter the source version (e.g., 1.2.x)
# Enter the new minor version (e.g., 4 to create 1.4.x)
# Then creates candidate-<source-major>.<new-minor>.x from the source branch and pushes it to origin

bash create-minor.sh 1.2.x 4
# Creates candidate-1.4.x from candidate-1.2.x and pushes it to origin
```

## create-release.sh

Creates a **Tombolo release** branch (tombolo-NNN.MMM.PPP) from an existing candidate branch (candidate-NNN.MMM.x) and tags it.

```bash
# Run without arguments and the script will prompt you
bash create-release.sh

# Or provide the release version as an argument
bash create-release.sh <version>

```

```bash
bash create-release.sh
# Prompts: Enter the release version (e.g., 1.0.3)
# Then creates tombolo-<entered> from the corresponding candidate branch, tags it, and pushes both to origin

# Creates release branch tombolo-1.0.3 from candidate-1.0.x, tags it as v1.0.3, and pushes both to origin
bash create-release.sh 1.0.3
```

## upmerge.sh

Upmerges changes from a **source candidate branch** into a **target branch** (another candidate branch or master).  
It automatically commits and pushes the merged changes. The script will stop if there are uncommitted changes in the working directory.

```bash

# Run without arguments and the script will prompt you
bash upmerge.sh

# Or provide source and target branches as arguments
bash upmerge.sh <source-version> <target-version>
```

```bash
bash upmerge.sh
# Prompts:
# Enter the source version (e.g., 1.0.x)
# Enter the target version (e.g., 1.1.x or master)
# Then performs the upmerge

bash upmerge.sh 1.0.x 1.1.x
# Merges changes from candidate-1.0.x into candidate-1.1.x, commits, and pushes to origin

bash upmerge.sh 1.0.x master
# Merges changes from candidate-1.0.x into master, commits, and pushes to origin

```

## cherry-pick-fix.sh

Cherry-picks a specific commit from a **source branch** to a **target branch**.  
Displays the latest commits from the source branch (hash, message, date, time) and ensures the target branch is clean before cherry-picking.

```bash
# Or run without arguments and the script will prompt you
bash cherry-pick-fix.sh

# Provide source branch, target branch, optional --show-commit, and optional --list=N
bash cherry-pick-fix.sh <source-branch> <target-branch> [--show-commit] [--list=N]
```

```bash
bash cherry-pick-fix.sh
# Prompts:
# Enter the source branch (e.g., candidate-1.0.x)
# Enter the commit hash to cherry-pick
# Enter the target branch (e.g., master or candidate-1.0.x)
# Then cherry-picks the commit

bash cherry-pick-fix.sh candidate-1.0.x master
# Displays the last 10 commits from candidate-1.0.x
# Prompts: Enter the commit hash to cherry-pick
# Then cherry-picks the commit to master and pushes it to origin

bash cherry-pick-fix.sh candidate-1.0.x master --list=5 --show-commit
# Displays the last 5 commits from candidate-1.0.x with commit info
# Prompts for commit hash and cherry-picks to master
```
