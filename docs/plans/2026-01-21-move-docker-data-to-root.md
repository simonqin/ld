# Move Docker Data To Root Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move all docker-local data/config mounts to `.data/` at repo root and stop tracking `docker/` templates.

**Architecture:** Update docker-compose paths to point at `../.data/...` and remove `docker/dev-configs` from the repo. Add `.data/` to `.gitignore` so local state stays untracked.

**Tech Stack:** Docker Compose, git, `.gitignore`.

### Task 1: Inventory docker-local mounts and template files

**Files:**
- Modify: `docker/docker-compose.dev.yml`
- Remove: `docker/dev-configs/`

**Step 1: List docker-local mounts**

Run: `rg -n "./dev-configs|./gitea" docker/docker-compose.dev.yml`
Expected: Paths under `docker/` used as bind mounts.

**Step 2: Confirm template directory contents**

Run: `ls -la docker/dev-configs`
Expected: See the config files currently mounted by compose.

**Step 3: Commit inventory note**

Run:
```bash
git status -sb
```
Expected: Clean (no changes yet).

### Task 2: Update docker-compose to use `.data/` paths

**Files:**
- Modify: `docker/docker-compose.dev.yml`

**Step 1: Update gitea mount**

Change:
```yaml
      - ./gitea:/data
```
To:
```yaml
      - ../.data/gitea:/data
```

**Step 2: Update other dev-configs mounts**

Change any remaining:
```yaml
      - ./dev-configs/...
```
To:
```yaml
      - ../.data/dev-configs/...
```

**Step 3: Sanity check**

Run: `rg -n "./dev-configs|./gitea" docker/docker-compose.dev.yml`
Expected: No results.

**Step 5: Commit compose changes**

Run:
```bash
git add docker/docker-compose.dev.yml
git commit -m "chore: move docker dev mounts to .data"
```

### Task 3: Remove docker templates from repo and ignore `.data`

**Files:**
- Remove: `docker/dev-configs/`
- Modify: `.gitignore`

**Step 1: Remove template directory from git**

Run:
```bash
git rm -r docker/dev-configs
```

**Step 2: Ignore `.data`**

Add to `.gitignore`:
```
.data/
```

**Step 3: Commit removal and ignore**

Run:
```bash
git add .gitignore
git commit -m "chore: drop docker dev templates and ignore .data"
```

### Task 4: Verify local setup instructions

**Files:**
- Optional: `docker/CLAUDE.md` (only if it references removed templates)

**Step 1: Search for references**

Run: `rg -n "dev-configs|gitea" docker/CLAUDE.md docker/docker-compose.dev.yml`
Expected: No references to removed template paths remain.

**Step 2: Update docs if needed**

If references exist, update them to point to `.data/...`.

**Step 3: Commit doc updates (if any)**

Run:
```bash
git add docker/CLAUDE.md
git commit -m "docs: update docker dev config paths"
```
