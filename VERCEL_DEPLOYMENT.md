# Vercel Deployment Guide

## Setup Complete ✅

The following changes have been made to support Vercel deployment:

### 1. **Fixed UUID Module Error**
   - Downgraded from `uuid@13.0.0` to `uuid@9.0.1` (CommonJS compatible)
   - Updated `tsconfig.json` to use CommonJS modules

### 2. **Serverless Handler**
   - Modified `src/main.ts` to export a serverless `handler` function
   - Uses Express adapter for Vercel compatibility
   - Maintains local development with `bootstrap()` function

### 3. **Vercel Configuration**
   - Created `vercel.json` pointing to `api/index.js`
   - Created `api/index.js` as entry point for Vercel
   - Configured routes to forward all requests to the handler

### 4. **Dependencies**
   - Added `express` package
   - All dependencies are compatible with serverless environment

## Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin dev
```

### Step 2: Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

**Required Variables:**
```env
# Database
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
POSTGRES_USERNAME=your-db-username
POSTGRES_PASSWORD=your-db-password
POSTGRES_DATABASE=your-db-name

# JWT
JWT_SECRET=your-jwt-secret-key

# AWS S3 (for file uploads)
AWS_S3_BUCKET=your-s3-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
```

### Step 3: Deploy
Vercel will automatically deploy when you push to the connected branch.

## Important Notes

### Database Connection
- The app uses Sequelize with PostgreSQL
- Make sure your database allows connections from Vercel's IP ranges
- Consider using a connection pooler (like PgBouncer) for better performance

### Cold Starts
- First request may take 1-3 seconds (cold start)
- Subsequent requests are fast due to caching
- Consider upgrading to Vercel Pro for better cold start handling

### Function Timeout
- Default timeout is 10 seconds
- Increase in Vercel settings if needed
- Current max duration configured: 30 seconds

## Migration Commands

After deployment, run migrations using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Run migrations in production
vercel env pull .env.production
# Then run: npx sequelize-cli db:migrate
```

## Local Development

```bash
# Start development server
npm run start:dev

# Start production build locally
npm run build
npm run start:prod
```

## Troubleshooting

### Error: "Please install pg package manually"
- Make sure `pg` is in dependencies (it should be)
- Vercel will bundle it automatically

### Error: "Database connection failed"
- Check environment variables are set correctly
- Verify database allows Vercel IPs
- Check SSL configuration in `src/datasources/postgres.ts`

### Error: "No exports found in module"
- The handler is now properly exported in `dist/main.js`
- Entry point is `api/index.js`

## Build Output

The build creates:
- `dist/main.js` - Main application entry (exports handler)
- `api/index.js` - Vercel entry point
- All compiled JavaScript in CommonJS format

## API Endpoints

After deployment, your endpoints will be available at:
- `https://your-project.vercel.app/auth/login`
- `https://your-project.vercel.app/user/interests`
- `https://your-project.vercel.app/system/health`
- etc.

## Monitoring

- Check Vercel dashboard for deployment logs
- Monitor function execution logs
- Set up alerts for errors

## Next Steps

1. Deploy to Vercel
2. Run database migrations
3. Test all endpoints
4. Monitor performance
5. Set up custom domain (optional)
