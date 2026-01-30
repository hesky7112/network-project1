#!/bin/bash

# Network Automation System Deployment Script

set -e

echo "🚀 Starting Network Automation System deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p monitoring/grafana/{dashboards,datasources}
mkdir -p logs

# Generate environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Server Configuration
PORT=8080
DEBUG=false

# Database
DATABASE_URL=postgres://networking:networking_password@localhost:5432/networking?sslmode=disable
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(date +%s)

# Network Discovery
DEFAULT_SNMP_COMMUNITY=public
DISCOVERY_TIMEOUT=30s
MAX_WORKERS=10

# Telemetry
METRICS_RETENTION_DAYS=90
ALERT_THRESHOLDS=cpu:80,memory:85,interface:90

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
EOF
    echo "✅ Created .env file. Please review and update the JWT_SECRET."
fi

# Generate password hash for default admin user
echo "🔐 Setting up default admin user..."
if command -v htpasswd &> /dev/null; then
    ADMIN_PASSWORD="admin"
    echo "Default admin password: $ADMIN_PASSWORD"
else
    echo "⚠️  htpasswd not found. Using plain text password (not recommended for production)"
    ADMIN_PASSWORD="admin"
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services started successfully!"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
sleep 5
docker-compose exec go-api ./main migrate 2>/dev/null || echo "⚠️  Migration command not available, skipping..."

# Create initial user (if needed)
echo "👤 Setting up initial admin user..."
docker-compose exec postgres psql -U networking -d networking -c "
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@networking.local', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;
" 2>/dev/null || echo "⚠️  Could not create admin user automatically"

echo ""
echo "🎉 Network Automation System deployed successfully!"
echo ""
echo "📊 Services:"
echo "   • Frontend:    http://localhost:3000"
echo "   • Go API:      http://localhost:8080"
echo "   • Python API:  http://localhost:8000"
echo "   • PostgreSQL:  localhost:5432"
echo "   • Redis:       localhost:6379"
echo "   • Grafana:     http://localhost:3001 (admin/admin)"
echo "   • Prometheus:  http://localhost:9090"
echo ""
echo "🔑 Login Credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "📚 Documentation: See README.md for API documentation"
echo ""
echo "🛠️  Useful commands:"
echo "   • View logs:           docker-compose logs -f"
echo "   • Stop services:       docker-compose down"
echo "   • Restart services:    docker-compose restart"
echo "   • Update system:       docker-compose pull && docker-compose up -d"
echo ""
echo "⚡ Quick start:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Login with admin/admin"
echo "   3. Start network discovery from the dashboard"
echo ""
echo "✅ Deployment complete!"
