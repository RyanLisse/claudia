# Electric Cloud Authentication Setup

## ⚠️ IMPORTANT SECURITY NOTE

Your Electric source secret should **NEVER** be exposed in client-side code or environment variables prefixed with `NEXT_PUBLIC_`.

## Current Setup Status

From your Electric Cloud dashboard:
- **Source ID**: `cebafeb7-feee-4fab-9333-57e4e8de641e` 
- **Source Secret**: `eyJ***vCvk` (keep this secret!)
- **API Endpoint**: `https://api.electric-sql.cloud`

## Step 1: Add Secret Environment Variables to Vercel

Run these commands to add the secret variables (NOT prefixed with NEXT_PUBLIC):

```bash
# Add your Electric source ID (safe to expose)
vercel env add ELECTRIC_SOURCE_ID production
# Enter: cebafeb7-feee-4fab-9333-57e4e8de641e

# Add your Electric secret (MUST be kept server-side only)
vercel env add ELECTRIC_SECRET production
# Enter: [paste your full secret that starts with eyJ]

# Also add the source ID as public for client reference
vercel env add NEXT_PUBLIC_ELECTRIC_SOURCE_ID production
# Enter: cebafeb7-feee-4fab-9333-57e4e8de641e
```

## Step 2: Update Your Environment Files

Create `.env.local` for local development:

```env
# Public variables (safe for client)
NEXT_PUBLIC_ELECTRIC_URL=https://api.electric-sql.cloud
NEXT_PUBLIC_ELECTRIC_SOURCE_ID=cebafeb7-feee-4fab-9333-57e4e8de641e
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Secret variables (server-only)
ELECTRIC_SOURCE_ID=cebafeb7-feee-4fab-9333-57e4e8de641e
ELECTRIC_SECRET=eyJ... [your full secret]
DATABASE_URL=postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

## Step 3: Use the Secure API Route

Instead of connecting directly to Electric Cloud from the client, use the API route:

```typescript
// In your React components
async function fetchTableData(table: string) {
  // Use your API route, not Electric directly
  const response = await fetch(`/api/electric?table=${table}`);
  const data = await response.json();
  return data;
}
```

## Step 4: Example Hook for Real-time Data

```typescript
// src/hooks/use-electric-shape.ts
import { useEffect, useState } from 'react';

export function useElectricShape(table: string) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchShape() {
      try {
        const response = await fetch(`/api/electric?table=${table}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      }
    }
    
    fetchShape();
  }, [table]);
  
  return { data, error };
}
```

## Security Checklist

- [ ] Electric secret is NOT in any `NEXT_PUBLIC_` variable
- [ ] Electric secret is only accessed in server-side code
- [ ] Client code uses `/api/electric` proxy route
- [ ] Vercel has `ELECTRIC_SECRET` as a production variable
- [ ] Local `.env.local` has the secret for development

## Next Steps

1. Add the secret environment variables to Vercel
2. Redeploy your application
3. Test the `/api/electric` endpoint
4. Implement proper error handling and loading states
5. Consider adding rate limiting to your API route

## Troubleshooting

If you get authentication errors:
1. Check that `ELECTRIC_SECRET` is set in Vercel
2. Verify the secret matches exactly (no extra spaces)
3. Check Vercel function logs for detailed errors
4. Test locally with `.env.local` first