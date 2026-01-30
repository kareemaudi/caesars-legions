# Deploy to GitHub Pages

## Quick Deploy (5 minutes)

### 1. Create GitHub Repository

Go to: https://github.com/new

- **Repository name:** `caesars-legions`
- **Description:** "Caesar's Legions - AI-Powered Cold Email Service"
- **Public** (required for free GitHub Pages)
- **DON'T** initialize with README (we already have one)

Click **Create repository**

### 2. Push to GitHub

Copy the commands from GitHub's "…or push an existing repository from the command line" section:

```bash
git remote add origin https://github.com/YOUR_USERNAME/caesars-legions.git
git branch -M main
git push -u origin main
```

**OR run from PowerShell in this directory:**

```powershell
cd C:\Users\Asus\clawd\caesars-legions
git remote add origin https://github.com/YOUR_USERNAME/caesars-legions.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repo: `https://github.com/YOUR_USERNAME/caesars-legions`
2. Click **Settings** tab
3. Click **Pages** in left sidebar
4. Under "Source", select: **main** branch
5. Click **Save**

**Done!** Your site will be live at:
```
https://YOUR_USERNAME.github.io/caesars-legions/
```

(Takes 1-2 minutes to build)

---

## Update Site Later

Just edit `index.html`, commit, and push:

```bash
git add index.html
git commit -m "Update landing page"
git push
```

GitHub Pages auto-deploys in ~1 minute.

---

## Custom Domain (Optional)

To use `promptabusiness.com`:

1. In GitHub repo → Settings → Pages
2. Under "Custom domain", enter: `promptabusiness.com`
3. Click Save
4. In GoDaddy DNS settings, add:
   - Type: **CNAME**
   - Name: **www**
   - Value: **YOUR_USERNAME.github.io**
   
5. Add A records pointing to GitHub:
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153

Wait 10-60 minutes for DNS propagation.

---

**Status:** Ready to deploy! 🚀
