#!/bin/bash

echo "Setting up Vercel environment variables for Claudia"
echo "=================================================="
echo ""
echo "This script will help you set up the required environment variables."
echo "You'll need to provide values for each variable."
echo ""
echo "Required variables:"
echo "1. ELECTRIC_URL - ElectricSQL sync service URL"
echo "2. DATABASE_URL - PostgreSQL connection string"
echo "3. NEXT_PUBLIC_SERVER_URL - Backend API URL"
echo ""
echo "For ELECTRIC_URL, you have these options:"
echo "- Sign up at https://electric-sql.com for a cloud instance"
echo "- Use a local instance: http://localhost:5133"
echo "- Use a placeholder for testing: https://electric.example.com"
echo ""

# Add environment variables
echo "Adding ELECTRIC_URL..."
vercel env add ELECTRIC_URL production

echo "Adding DATABASE_URL..."
vercel env add DATABASE_URL production

echo "Adding NEXT_PUBLIC_SERVER_URL..."
vercel env add NEXT_PUBLIC_SERVER_URL production

echo "Adding optional Inngest keys..."
vercel env add INNGEST_EVENT_KEY production
vercel env add INNGEST_SIGNING_KEY production

echo ""
echo "Environment variables set! Now redeploy your app:"
echo "vercel --prod"