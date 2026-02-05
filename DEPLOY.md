# Caesar's Legions - Deployment Guide

## ⚠️ IMPORTANT: Two Repos, Two Purposes

| Repo | Folder | Branch | Deploys To |
|------|--------|--------|------------|
| `kareemaudi/caesars-legions` | `C:/Users/Asus/clawd/caesars-legions` | **master** | **promptabusiness.com** (LIVE SITE) |
| `kareemaudi/caesars-legions-backend` | `C:/Users/Asus/clawd/caesars-legions-backend` | gh-pages | kareemaudi.github.io (dev only) |

## Deploying to Live Site (promptabusiness.com)

```bash
cd C:/Users/Asus/clawd/caesars-legions
git add -A
git commit -m "Description of changes"
git push origin master
```

**Wait 1-2 minutes for GitHub Pages to deploy.**

## Why Deploys Get "Cancelled"

GitHub Actions cancels older workflows when a newer push happens. This is NORMAL behavior.

**If you see "Cancelled":**
1. Check if a newer commit succeeded
2. If not, push an empty commit to trigger fresh deploy:
   ```bash
   git commit --allow-empty -m "Trigger deploy"
   git push origin master
   ```

## Verifying Deployment

1. Check GitHub Actions: https://github.com/kareemaudi/caesars-legions/actions
2. Look for green checkmark on latest commit
3. Visit https://promptabusiness.com and hard refresh (Ctrl+Shift+R)

## Files in This Repo

- `index.html` - Main landing page
- `onboarding.html` - Client intake form
- `compare/` - SEO comparison pages (Instantly, Lemlist alternatives)
- `tools/` - Viral tools (ROI calculator, spam checker, etc.)
- `blog/` - Build-in-public blog posts
- `CNAME` - Points to promptabusiness.com
- `.nojekyll` - Disables Jekyll processing

## Do NOT

- Push website changes to `caesars-legions-backend`
- Use `gh-pages` branch for this repo (use master)
- Delete the CNAME file
