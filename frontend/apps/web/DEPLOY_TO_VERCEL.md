# Deploying to Vercel

This Next.js application can be deployed to Vercel with the following steps:

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Environment variables configured

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. From the project root (`/frontend`), run:
   ```bash
   cd apps/web
   vercel
   ```

2. Follow the prompts:
   - Link to existing project or create new
   - Select the `apps/web` directory
   - Use the detected Next.js framework settings

3. Set environment variables in Vercel Dashboard:
   - `NEXT_PUBLIC_SERVER_URL` - Your backend API URL
   - `DATABASE_URL` - PostgreSQL connection string
   - `ELECTRIC_URL` - ElectricSQL service URL
   - `INNGEST_EVENT_KEY` - Inngest event key (optional)
   - `INNGEST_SIGNING_KEY` - Inngest signing key (optional)

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub
2. Import the repository in Vercel Dashboard
3. Configure:
   - Root Directory: `frontend/apps/web`
   - Framework Preset: Next.js
   - Build Command: `cd ../.. && npm run build --workspace=web`
   - Install Command: `cd ../.. && bun install`

### Option 3: Deploy from Monorepo Root

Since this is a monorepo, you can also deploy from the root:

1. Create a `vercel.json` in the monorepo root:
   ```json
   {
     "projects": {
       "web": {
         "root": "frontend/apps/web"
       }
     }
   }
   ```

2. Run `vercel` from the monorepo root

## Environment Variables

Configure these in your Vercel project settings:

### Required:
- `NEXT_PUBLIC_SERVER_URL` - The URL of your backend API server
- `DATABASE_URL` - PostgreSQL database connection string
- `ELECTRIC_URL` - ElectricSQL sync service URL

### Optional:
- `INNGEST_EVENT_KEY` - For background job processing
- `INNGEST_SIGNING_KEY` - For Inngest webhook security
- `NEXT_PUBLIC_POSTHOG_KEY` - For analytics
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog instance URL

## Post-Deployment

1. Verify the deployment at your Vercel URL
2. Set up custom domain (optional)
3. Configure preview deployments for pull requests
4. Set up deployment notifications

## Troubleshooting

### Build Errors
- Ensure all dependencies are in `package.json`
- Check that environment variables are set correctly
- Verify the build works locally: `npm run build`

### Runtime Errors
- Check Vercel function logs
- Ensure database is accessible from Vercel's network
- Verify CORS settings if API is on different domain

### Monorepo Issues
- Make sure `vercel.json` points to correct directories
- Use workspace commands for building
- Check that Turbo cache is configured properly

## Alternative: Cloudflare Deployment

This app is also configured for Cloudflare Pages deployment:
```bash
npm run deploy  # Uses OpenNext.js Cloudflare adapter
```

See `wrangler.jsonc` for Cloudflare-specific configuration.