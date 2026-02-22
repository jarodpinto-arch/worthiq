# WorthIQ - Quick Deployment Guide ⚡

Get WorthIQ live in production in under 30 minutes!

## Prerequisites

- GitHub account
- Credit card (for Plaid production later - not charged yet)

---

## 🚀 5-Step Deployment

### Step 1: Push to GitHub (5 min)

```bash
# Navigate to your project
cd /path/to/financial-app

# Initialize Git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial WorthIQ deployment"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/worthiq.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend on Railway (10 min)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub

2. Click **"New Project"** → **"Deploy from GitHub Repo"**

3. Select your `worthiq` repository

4. Click **"Configure"** and set:
   - **Root Directory**: `backend`

5. Click **"Add Service"** → **"Database"** → **"PostgreSQL"**

6. Go to **Variables** tab and add:
   ```
   JWT_SECRET=<generate at: https://generate-secret.vercel.app/32>
   PLAID_CLIENT_ID=<from dashboard.plaid.com>
   PLAID_SECRET=<from dashboard.plaid.com>
   PLAID_ENV=sandbox
   FRONTEND_URL=<leave blank for now, update after Vercel>
   ```

7. Click **"Deploy"** and wait for green checkmark ✅

8. Copy your Railway URL: `https://your-app.railway.app`

---

### Step 3: Deploy Frontend on Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub

2. Click **"Add New Project"** → Import your `worthiq` repo

3. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`

4. Add **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-app.railway.app  (from Step 2)
   REACT_APP_PLAID_ENV=sandbox
   ```

5. Click **"Deploy"** ✅

6. Copy your Vercel URL: `https://your-app.vercel.app`

---

### Step 4: Update Railway CORS (2 min)

1. Go back to Railway dashboard

2. Update the `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```

3. Railway will auto-redeploy ✅

---

### Step 5: Test Your App (3 min)

1. Open `https://your-app.vercel.app`

2. Click **"Register"** to create an account

3. Click **"Connect Bank Account"**

4. Use Plaid Sandbox credentials:
   - Username: `user_good`
   - Password: `pass_good`

5. See your transactions appear! 🎉

---

## 📊 What You've Deployed

```
Your Live Stack:
├── Frontend (Vercel) ─────── https://your-app.vercel.app
├── Backend API (Railway) ── https://your-app.railway.app
├── Database (Railway) ───── PostgreSQL (included)
└── Bank Data (Plaid) ────── Sandbox mode
```

---

## 💰 Current Costs

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | $0/mo |
| Railway | Hobby | $5/mo |
| Plaid | Development | $0/mo |
| **Total** | | **$5/mo** |

---

## 🎯 Next Steps for Launch

### Week 1: Polish
- [ ] Add custom domain ($10/year)
- [ ] Set up Cloudflare SSL (free)
- [ ] Add error tracking with Sentry (free)

### Week 2: Legal
- [ ] Create Terms of Service
- [ ] Create Privacy Policy
- [ ] Apply for Plaid Production access

### Week 3: Monetization
- [ ] Add Stripe subscription ($0 until revenue)
- [ ] Create pricing page
- [ ] Set up customer support (Crisp - free)

### Week 4: Launch! 🚀
- [ ] Post on Product Hunt
- [ ] Share on Twitter/LinkedIn
- [ ] Submit to BetaList

---

## 🆘 Need Help?

- **Railway Issues**: Check deploy logs in dashboard
- **Vercel Issues**: Check function logs in dashboard
- **Plaid Issues**: Verify credentials at dashboard.plaid.com

---

**You're now running a real SaaS business! 🎉**
