# ElectricSQL Setup Guide for Claudia

## Overview

ElectricSQL is a sync engine that enables real-time, reactive, local-first apps. Your app needs the ELECTRIC_URL to connect to the Electric sync service.

## Setup Options

### Option 1: Electric Cloud (Easiest)
Sign up for Electric Cloud for managed hosting:
1. Visit https://electric-sql.com
2. Sign up for Electric Cloud
3. Create a new project
4. You'll get a URL like: `https://your-project.electric-sql.com`

### Option 2: Self-Host on Fly.io (Recommended for Production)
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Create app
fly launch --image electricsql/electric:latest --name claudia-electric

# Set your Neon database URL
fly secrets set DATABASE_URL="postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Deploy
fly deploy

# Your ELECTRIC_URL will be: https://claudia-electric.fly.dev
```

### Option 3: Local Development with ngrok
```bash
# Run Electric locally
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require" \
  electricsql/electric:latest

# Expose with ngrok
ngrok http 3000

# Your ELECTRIC_URL will be the ngrok URL
```

### Option 4: Deploy on Railway/Render
Both platforms support Docker deployments:
- Railway: https://railway.app
- Render: https://render.com

Use the Docker image: `electricsql/electric:latest`
Set DATABASE_URL environment variable

## Setting Up Electric for Your Neon Database

Since you're using Neon (which I see from your .env file), here's the specific setup:

1. **Ensure your Neon database has logical replication enabled**:
   ```sql
   -- Connect to your Neon database and run:
   ALTER SYSTEM SET wal_level = logical;
   ```

2. **Create Electric-specific tables** (if needed):
   ```sql
   -- Electric will create its own metadata tables automatically
   ```

3. **Configure Electric environment**:
   ```bash
   DATABASE_URL=postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ELECTRIC_WRITE_TO_PG_MODE=direct_writes
   ```

## Vercel Deployment Configuration

Once you have your Electric service running, add the URL to Vercel:

```bash
# Add your Electric URL
vercel env add ELECTRIC_URL production
# Enter your Electric service URL (e.g., https://claudia-electric.fly.dev)

# Also update your server URL if you've deployed it
vercel env add NEXT_PUBLIC_SERVER_URL production
# Enter your server URL (e.g., https://claudia-server.vercel.app)

# Your database URL is already set
vercel env add DATABASE_URL production
# Use: postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Redeploy
vercel --prod
```

## Quick Start (Without Electric)

If you want to get your app running first without Electric features:

1. **Create a minimal Electric mock** in your app:
   ```typescript
   // src/lib/electric-mock.ts
   export const electricMock = {
     connect: () => Promise.resolve({}),
     sync: () => ({ subscribe: () => {} })
   };
   ```

2. **Set a placeholder URL**:
   ```bash
   vercel env add ELECTRIC_URL production
   # Enter: https://electric-placeholder.local
   ```

3. **Update your app to handle missing Electric gracefully**

## Testing Your Setup

After setting up Electric, test the connection:

```bash
# Test Electric HTTP API
curl -i 'YOUR_ELECTRIC_URL/v1/shape?table=your_table&offset=-1'

# Should return shape data or an error message
```

## Next Steps

1. **Claim your Neon database** before it expires (Thu, 17 Jul 2025)
2. **Choose a deployment option** for Electric
3. **Set environment variables** in Vercel
4. **Redeploy your app**

## Resources

- Electric Docs: https://electric-sql.com/docs
- Electric Discord: https://discord.electric-sql.com
- Neon + Electric Guide: https://neon.com/guides/electric-sql