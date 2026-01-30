# Set Up promptabusiness.com Custom Domain

## Step 1: GitHub Settings

1. Go to: https://github.com/kareemaudi/caesars-legions/settings/pages
2. Under "Custom domain", enter: `promptabusiness.com`
3. Click **Save**
4. Check "Enforce HTTPS" (after DNS propagates)

## Step 2: GoDaddy DNS Settings

Go to GoDaddy DNS Management for promptabusiness.com:

### Add These Records:

**A Records (for root domain):**
```
Type: A
Name: @
Value: 185.199.108.153
TTL: 1 Hour
```

Add 3 more A records with same settings but different IPs:
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

**CNAME Record (for www):**
```
Type: CNAME
Name: www
Value: kareemaudi.github.io
TTL: 1 Hour
```

**Delete any conflicting records** (like parking page or default A records)

## Step 3: Wait

DNS propagation takes 10-60 minutes (usually ~15 min).

Check status: https://www.whatsmydns.net/#A/promptabusiness.com

## Step 4: Verify

Once propagated:
- http://promptabusiness.com → should redirect to https://promptabusiness.com
- https://www.promptabusiness.com → should work too

---

**Current URL (works now):** https://kareemaudi.github.io/caesars-legions/  
**Target URL (after DNS):** https://promptabusiness.com

---

## Quick Fix Option

If you want to launch NOW:
- Use GitHub Pages URL temporarily
- Set up custom domain in background
- Update all links once DNS propagates

The landing page works either way! 🏛️
