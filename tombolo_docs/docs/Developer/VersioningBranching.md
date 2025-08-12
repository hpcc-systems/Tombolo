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
