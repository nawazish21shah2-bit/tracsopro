# Remove Secret from Git History

## The Problem

The Stripe secret key is still in commit `05948ab` in your git history. Even though we fixed it in a new commit, GitHub scans all commits being pushed.

## Solution: Rewrite the Commit

We need to edit that commit to remove the secret. Here's how:

### Step 1: Interactive Rebase

```bash
git rebase -i 05948ab^
```

This will open an editor. Change the line for commit `05948ab` from:
```
pick 05948ab payments
```
to:
```
edit 05948ab payments
```

Save and close.

### Step 2: Fix the File

The rebase will stop at that commit. Now fix the file:

```bash
# The file will have the old content with the secret
# Edit it to remove the secret (or use the fixed version)
git checkout HEAD -- STRIPE_KEYS_CONFIGURED.md
# Then manually edit to remove the secret, or:
# Copy the fixed content from the current version
```

### Step 3: Amend the Commit

```bash
git add STRIPE_KEYS_CONFIGURED.md
git commit --amend --no-edit
```

### Step 4: Continue Rebase

```bash
git rebase --continue
```

### Step 5: Force Push

```bash
git push --force-with-lease
```

## Alternative: Simpler Method (If Rebase is Complex)

### Option A: Use GitHub's Unblock URL (Easiest)

Since it's a **test key** (not a production key), you can safely allow it:
https://github.com/nawazish21shah2-bit/tracsopro/security/secret-scanning/unblock-secret/35mio4j1178KIrDoNSZbZXu1omS

Click the link and follow GitHub's instructions to allow the secret for this one-time push.

### Option B: Use git filter-branch (Advanced)

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch STRIPE_KEYS_CONFIGURED.md" \
  --prune-empty --tag-name-filter cat -- --all

# Then force push
git push --force-with-lease
```

## Recommended: Use GitHub's Unblock URL

For test keys, the easiest solution is to use GitHub's unblock feature. It's safe because:
- It's a test key (not production)
- GitHub will still scan for it in the future
- You've already fixed the file in new commits

## After Fixing

Once you push successfully:
1. ✅ The secret is removed from future commits
2. ✅ Your `.env` file is safe (in `.gitignore`)
3. ✅ Documentation uses placeholders

