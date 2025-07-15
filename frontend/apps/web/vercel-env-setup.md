# Vercel Environment Variables Setup

Based on your local environment, here are the values to use for Vercel:

## Required Environment Variables

### 1. DATABASE_URL
```
postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```
**Note**: This is your Neon database. Make sure to claim it to your account before Thu, 17 Jul 2025 23:38:13 GMT at https://neon.new/database/0953d60b-b62b-4292-a624-f084e96e4dac

### 2. NEXT_PUBLIC_SERVER_URL
For production, you'll need to deploy your server first. For now, you can use:
- Option A: Deploy server to Vercel separately and use that URL
- Option B: Use a placeholder: `https://api-claudia.vercel.app`
- Option C: For testing only: `http://localhost:3000` (won't work in production)

### 3. ELECTRIC_URL
You need to set up ElectricSQL. Options:
- **Option A**: Sign up at https://electric-sql.com (recommended)
- **Option B**: Self-host ElectricSQL and expose it publicly
- **Option C**: For testing, use placeholder: `https://electric.example.com`

## Quick Setup Commands

Run these commands to set up your Vercel environment:

```bash
# Set database URL (using your Neon database)
vercel env add DATABASE_URL production
# Paste: postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Set server URL (placeholder for now)
vercel env add NEXT_PUBLIC_SERVER_URL production
# Enter: https://api-claudia.vercel.app

# Set Electric URL (placeholder for now)
vercel env add ELECTRIC_URL production
# Enter: https://electric.example.com

# Optional: Add Inngest keys if you have them
vercel env add INNGEST_EVENT_KEY production
vercel env add INNGEST_SIGNING_KEY production
```

## Alternative: Use Vercel Dashboard

1. Go to your project at https://vercel.com/dashboard
2. Navigate to Settings → Environment Variables
3. Add the variables above

## After Setting Variables

Redeploy your application:
```bash
vercel --prod
```

## Setting Up ElectricSQL (Recommended)

Since your app uses ElectricSQL for real-time sync, you should set it up properly:

1. **Local Development** (temporary):
   ```bash
   docker run -p 5133:5133 -e DATABASE_URL="postgresql://..." electricsql/electric
   ```

2. **Production** (recommended):
   - Sign up at https://electric-sql.com
   - Create a new project
   - Use your Neon database URL
   - Get your production ELECTRIC_URL

## Next Steps

1. Set the environment variables using the commands above
2. Redeploy your app
3. Your app should now work without the 404 error
4. Consider setting up a proper ElectricSQL instance for real-time features