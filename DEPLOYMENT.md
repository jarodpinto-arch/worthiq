# WorthIQ Deployment Guide - Bootstrap SaaS

This guide will help you deploy WorthIQ as a production SaaS application with minimal costs.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Railway       │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│   FREE          │     │   $5/mo         │     │   Included      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │   Plaid API     │
         │              │   (Pay as go)   │
         │              └─────────────────┘
         ▼
┌─────────────────┐
│   Cloudflare    │
│   (Domain/SSL)  │
│   FREE          │
└─────────────────┘
```

## Estimated Monthly Costs (Bootstrap)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel (Frontend) | $0 | Free tier - 100GB bandwidth |
| Railway (Backend + DB) | $5 | Hobby plan - includes PostgreSQL |
| Cloudflare (Domain/SSL) | $0 | Free tier DNS + SSL |
| Plaid API | $0-100+ | Free development, pay per user in production |
| **Total** | **~$5/mo** | Until you scale |

---

## Step 1: Prepare Your Repository

### 1.1 Create a GitHub Repository

```bash
cd /path/to/financial-app
git init
git add .
git commit -m "Initial commit - WorthIQ financial dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/worthiq.git
git push -u origin main
```

### 1.2 Create a `.gitignore` (if not exists)

Make sure sensitive files are not committed:
```
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.production

# Build
dist/
build/

# IDE
.idea/
.vscode/

# Logs
*.log
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Sign up at [vercel.com](https://vercel.com)

1. Connect your GitHub account
2. Import your repository
3. Select the `frontend` directory as the root

### 2.2 Configure Build Settings

- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

### 2.3 Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_PLAID_ENV=sandbox  (change to 'production' later)
```

---

## Step 3: Deploy Backend to Railway

### 3.1 Sign up at [railway.app](https://railway.app)

1. Connect your GitHub account
2. Create a new project
3. Add your repository

### 3.2 Configure the Service

1. Select the `backend` directory as root
2. Railway will auto-detect NestJS

### 3.3 Add PostgreSQL

1. Click "New" → "Database" → "PostgreSQL"
2. Railway automatically sets `DATABASE_URL`

### 3.4 Set Environment Variables

In Railway Dashboard → Variables:

```
# Database (auto-set by Railway)
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-super-secure-secret-key-min-32-chars

# Plaid API (from dashboard.plaid.com)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# CORS
FRONTEND_URL=https://your-app.vercel.app

# Server
PORT=3001
```

### 3.5 Add Start Command

In Railway Settings:
- **Start Command**: `npm run start:prod`

---

## Step 4: Set Up Custom Domain (Optional but Recommended)

### 4.1 Register a Domain

Affordable options:
- Namecheap (~$10/year for .com)
- Cloudflare Registrar (at cost)
- Porkbun (~$9/year)

### 4.2 Configure DNS with Cloudflare (Free)

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Update nameservers at your registrar

### 4.3 Add DNS Records

```
# For Vercel frontend
Type: CNAME
Name: @
Target: cname.vercel-dns.com

# For Railway backend API
Type: CNAME
Name: api
Target: your-project.railway.app
```

### 4.4 Update Environment Variables

After domain setup:
- Vercel: `REACT_APP_API_URL=https://api.worthiq.com`
- Railway: `FRONTEND_URL=https://worthiq.com`

---

## Step 5: Production Checklist

### Security
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS only (handled by Vercel/Railway)
- [ ] Update CORS to only allow your domain
- [ ] Remove any console.log statements

### Database
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Create database indexes for performance
- [ ] Set up database backups (Railway does this automatically)

### Plaid
- [ ] Apply for Plaid Production access
- [ ] Update PLAID_ENV to 'production'
- [ ] Configure webhook URLs

### Monitoring
- [ ] Set up error tracking (Sentry - free tier)
- [ ] Add analytics (Plausible/Umami - privacy-friendly)

---

## Step 6: GitHub Actions CI/CD

The included workflow file (`.github/workflows/deploy.yml`) will:
1. Run tests on every push
2. Auto-deploy to production on merge to `main`

---

## Scaling Up Later

When you're ready to scale:

| Growth Stage | Upgrade Path |
|--------------|-------------|
| 100+ users | Railway Pro ($20/mo) |
| 1000+ users | Dedicated database |
| 10000+ users | Consider AWS/GCP |

---

## Troubleshooting

### Backend won't start
```bash
# Check logs in Railway dashboard
# Common issues:
# - Missing environment variables
# - Database connection issues
# - Prisma schema not migrated
```

### CORS errors
```bash
# Ensure FRONTEND_URL matches exactly (including https://)
# Check there's no trailing slash
```

### Plaid not connecting
```bash
# Verify PLAID_ENV matches your Plaid dashboard environment
# Check client ID and secret are correct
```

---

## Support & Resources

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Plaid Docs](https://plaid.com/docs)
- [NestJS Deployment](https://docs.nestjs.com/deployment)

---

Built with ❤️ by WorthIQ Team
