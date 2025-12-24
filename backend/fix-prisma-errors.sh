#!/bin/bash

# Fix Prisma and tsx errors on server
# Run this on the Ubuntu server

echo "🔧 Fixing Prisma and dependency errors..."

cd /root/backend || cd backend

echo "1. Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

echo "2. Clearing npm cache..."
npm cache clean --force

echo "3. Installing dependencies..."
npm install

echo "4. Generating Prisma Client..."
npx prisma generate

echo "5. Restarting PM2 process..."
pm2 restart guard-tracking-api

echo "✅ Done! Check logs with: pm2 logs guard-tracking-api --lines 50"



