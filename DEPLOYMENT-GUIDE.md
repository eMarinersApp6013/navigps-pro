# NaviGPS Pro — Deployment Guide
## gps.nodesurge.tech via GitHub + Hostinger

---

## STEP 1: Create GitHub Repository

1. Go to **https://github.com/new**
2. Fill in:
   - Repository name: `navigps-pro`
   - Description: `Maritime GPS Position System`
   - Select: **Public**
   - Check: **Add a README file**
3. Click **Create repository**

---

## STEP 2: Upload the HTML File

### Option A: Via GitHub Web (Easiest)
1. In your new repo, click **Add file** → **Upload files**
2. Drag and drop the `index.html` file
3. Click **Commit changes**

### Option B: Via Claude Code (Terminal)
```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/navigps-pro.git
cd navigps-pro

# Copy the index.html into the repo folder
# (paste or save the HTML file as index.html here)

# Push to GitHub
git add .
git commit -m "Initial NaviGPS Pro deployment"
git push origin main
```

---

## STEP 3: Enable GitHub Pages (Free Hosting)

1. Go to your repo: `https://github.com/YOUR_USERNAME/navigps-pro`
2. Click **Settings** (top tab)
3. In left sidebar, click **Pages**
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes
7. Your site is now live at: `https://YOUR_USERNAME.github.io/navigps-pro/`

---

## STEP 4: Connect Subdomain on Hostinger

### 4a. Add Subdomain in Hostinger
1. Login to **Hostinger hPanel**
2. Go to **Domains** → **nodesurge.tech**
3. Click **DNS / Nameservers** or **DNS Zone Editor**

### 4b. Add DNS Records
Add these DNS records:

**Option 1: CNAME Record (Recommended)**
```
Type:  CNAME
Name:  gps
Value: YOUR_USERNAME.github.io
TTL:   3600
```

**Option 2: If CNAME doesn't work, use A Records**
```
Type:  A
Name:  gps
Value: 185.199.108.153
TTL:   3600

Type:  A
Name:  gps
Value: 185.199.109.153
TTL:   3600

Type:  A
Name:  gps
Value: 185.199.110.153
TTL:   3600

Type:  A
Name:  gps
Value: 185.199.111.153
TTL:   3600
```

### 4c. Configure Custom Domain in GitHub
1. Go back to your repo **Settings** → **Pages**
2. Under **Custom domain**, type: `gps.nodesurge.tech`
3. Click **Save**
4. Check **Enforce HTTPS** (wait for DNS to propagate, may take 5-30 min)

### 4d. Add CNAME File to Repo
1. In your repo, click **Add file** → **Create new file**
2. Name it: `CNAME`
3. Content (just one line):
```
gps.nodesurge.tech
```
4. Click **Commit changes**

---

## STEP 5: Verify

1. Wait 5-30 minutes for DNS propagation
2. Open: **https://gps.nodesurge.tech**
3. You should see NaviGPS Pro
4. Test on mobile — allow GPS permission when prompted
5. Test on PC — try the RECEIVE function

---

## File Structure in Your Repo

```
navigps-pro/
├── index.html      ← The main app (single file)
├── CNAME           ← Custom domain pointer
└── README.md       ← Optional description
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Site shows 404 | Check GitHub Pages is enabled on `main` branch |
| Custom domain not working | DNS propagation takes up to 30 min. Check CNAME record |
| HTTPS not available | Wait for GitHub to issue SSL cert (can take 1 hour) |
| GPS not working on phone | Must use HTTPS. Allow location permission |
| Compass not working on iPhone | Tap anywhere on screen first (iOS permission trigger) |
| Share code not connecting | Both devices need internet. Check if PeerJS CDN loads |

---

## Future Updates

To update the app, simply:
1. Edit `index.html` in your repo (or upload new version)
2. Commit changes
3. GitHub Pages auto-deploys in ~1 minute

---

## Quick Test Before Deployment

Open index.html directly in your browser from your computer.
- On Chrome/Edge: File → Open → select index.html
- GPS will work if you allow location permission
- Compass works only on mobile devices
- Share feature requires internet (PeerJS CDN)
