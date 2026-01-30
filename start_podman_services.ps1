podman stop networking-postgres networking-redis networking-modules-engine
podman rm networking-postgres networking-redis networking-modules-engine

# Create volumes if they don't exist
podman volume create postgres_data
podman volume create redis_data

# Start PostgreSQL
Write-Host "Starting PostgreSQL..."
podman run -d --name networking-postgres `
  -p 5433:5432 `
  -e POSTGRES_USER=networking `
  -e POSTGRES_PASSWORD=networking_password `
  -e POSTGRES_DB=networking `
  -e POSTGRES_MAX_CONNECTIONS=200 `
  -e POSTGRES_SHARED_BUFFERS=256MB `
  -e POSTGRES_EFFECTIVE_CACHE_SIZE=1GB `
  -v postgres_data:/var/lib/postgresql/data `
  ankane/pgvector:v0.5.1

# Start Redis
Write-Host "Starting Redis..."
podman run -d --name networking-redis `
  -p 6380:6379 `
  -v redis_data:/data `
  redis:7-alpine `
  redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

# Start Modules Engine
Write-Host "Starting Modules Engine..."
podman build -t networking-modules-engine -f modules-engine/Dockerfile.modules ./modules-engine
podman run -d --name networking-modules-engine `
  -p 8082:8081 `
  -p 2718:2718 `
  -e MODULES_ENGINE_PORT=8081 `
  networking-modules-engine

Write-Host "Services started on ports 5433 (Postgres), 6380 (Redis), and 8081 (Modules Engine)"
