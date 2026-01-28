
---

## Daily Workflow (Most Common)
```bash
git checkout your-branch-name
git pull

# make your changes

git add .
git commit -m "short message"
git push
```

---

## Update Your Branch When `main` Changes
Use this when someone else merged to `main` and you need the latest changes.

### Option 1 (simple): merge `main` into your branch
```bash
git checkout main
git pull
git checkout your-branch-name
git merge main
```




---

## Create a New Branch (for a new task)
```bash
git checkout main
git pull
git checkout -b new-branch-name
```

---

## Common Scenarios & Fixes

### Scenario A: “rejected (non-fast-forward)” or “Updates were rejected”
**Cause:** Someone pushed new commits to the branch before you.

**Fix:** Pull, then push again.
```bash
git pull --rebase
git push
```

---

### Scenario B: Merge conflict after pull/merge
**Fix:** Resolve conflicts, then finish.
```bash
git status
# edit files to resolve conflicts
git add <resolved-file>
git commit -m "resolve conflict"
git push
```

---

### Scenario C: “There is no tracking information for the current branch”
**Fix:** Set upstream once.
```bash
git branch --set-upstream-to=origin/your-branch-name
git pull
```

---

### Scenario D: “fatal: '<name>' does not appear to be a git repository”
**Cause:** You typed a **branch** name where a **remote** name is expected.

**Fix:** Use the remote (usually `origin`).
```bash
git remote -v
git push origin your-branch-name
```

---

### Scenario E: You accidentally edited `main`
**Fix:** Move your commits to a new branch.
```bash
git checkout -b your-branch-name
git push --set-upstream origin your-branch-name
```

---

## Create a Pull Request (PR)
1. Push your branch to GitHub.
2. Open the repository on GitHub.
3. Click **Compare & pull request**.
4. Ensure **base** is `main` and **compare** is your branch.
5. Add title/description (what you changed + why).
6. Click **Create pull request**.

After review, the owner will merge it into `main`.

---

## Handy Commands
```bash
git status
git log --oneline --graph --decorate -n 10
git branch
git branch -a
git remote -v
```

