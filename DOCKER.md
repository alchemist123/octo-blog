# Docker Setup for TPD Backend

This project includes Docker Compose configuration for running the NestJS application with PostgreSQL and Redis.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js 18+ (for local development)

## Quick Start

### Production Environment

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Update the .env file with your configuration:**
   - Change the JWT_SECRET to a secure random string
   - Update database credentials if needed
   - Configure AWS credentials if using AWS services

3. **Build and start the services:**
   ```bash
   npm run docker:build
   npm run docker:up
   ```

4. **Check logs:**
   ```bash
   npm run docker:logs
   ```

### Development Environment

For development with hot reload:

```bash
npm run docker:dev
```

This will:
- Start PostgreSQL on port 5432
- Start the NestJS app on port 3000 with hot reload
- Mount your local source code for live updates

## Services

### PostgreSQL Database
- **Container:** `tpd-postgres`
- **Port:** 5432
- **Database:** `tpd_backend`
- **Username:** `postgres`
- **Password:** `postgres123`

### NestJS Application
- **Container:** `tpd-backend`
- **Port:** 3000
- **Environment:** Production

### Redis (Optional)
- **Container:** `tpd-redis`
- **Port:** 6379
- **Purpose:** Caching and session storage

## Available Commands

```bash
# Production
npm run docker:build      # Build Docker images
npm run docker:up         # Start services in background
npm run docker:down       # Stop and remove containers
npm run docker:logs       # View all logs
npm run docker:logs:app   # View app logs only

# Development
npm run docker:dev        # Start development environment
npm run docker:dev:build  # Build development images
```

## Database Management

### Running Migrations

To run database migrations:

```bash
# Access the app container
docker exec -it tpd-backend bash

# Run migrations
npm run migration:run
```

### Database Access

Connect to PostgreSQL directly:

```bash
# Using psql
docker exec -it tpd-postgres psql -U postgres -d tpd_backend

# Or connect from host
psql -h localhost -p 5432 -U postgres -d tpd_backend
```

## Environment Variables

Key environment variables (see `.env.example`):

- `POSTGRES_HOST`: Database host (use `postgres` in Docker)
- `POSTGRES_PORT`: Database port (5432)
- `POSTGRES_USERNAME`: Database username
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DATABASE`: Database name
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment (development/production)

## Troubleshooting

### Common Issues

1. **Port conflicts:** Make sure ports 3000, 5432, and 6379 are available
2. **Permission issues:** Ensure Docker has proper permissions
3. **Database connection:** Check if PostgreSQL container is running

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v
docker system prune -f

# Rebuild and start
npm run docker:build
npm run docker:up
```

### View Container Status

```bash
docker-compose ps
```

## File Structure

```
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev              # Development Docker image
├── init.sql                    # PostgreSQL initialization script
└── .env.example                # Environment variables template
```
