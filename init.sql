-- Initialize database for Network Automation System
CREATE DATABASE IF NOT EXISTS networking;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    ip_address INET UNIQUE NOT NULL,
    mac_address VARCHAR(17),
    hostname VARCHAR(100),
    vendor VARCHAR(100),
    device_type VARCHAR(100),
    os VARCHAR(100),
    snmp_version VARCHAR(10),
    community VARCHAR(100),
    username VARCHAR(100),
    password_encrypted TEXT,
    location VARCHAR(200),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'unknown',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create config_backups table
CREATE TABLE IF NOT EXISTS config_backups (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    config TEXT NOT NULL,
    version VARCHAR(50),
    tags VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create telemetry_data table
CREATE TABLE IF NOT EXISTS telemetry_data (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    metric VARCHAR(100) NOT NULL,
    value DECIMAL(15,6) NOT NULL,
    unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create discovery_jobs table
CREATE TABLE IF NOT EXISTS discovery_jobs (
    id SERIAL PRIMARY KEY,
    subnet VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    results TEXT,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create network_alerts table
CREATE TABLE IF NOT EXISTS network_alerts (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'KES',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create marketplace_products table
CREATE TABLE IF NOT EXISTS marketplace_products (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    category VARCHAR(50),
    config_file TEXT, -- Optional networking config snippet
    image_url VARCHAR(255),
    stock INTEGER DEFAULT 1,
    whatsapp_link VARCHAR(255),
    telegram_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    post_type VARCHAR(20) DEFAULT 'discussion', -- 'discussion', 'challenge', 'solution', 'announcement', 'config'
    tags VARCHAR(200),
    upvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id),
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'top-up', 'purchase', 'sale', 'withdrawal'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    payment_method VARCHAR(50), -- 'mpesa', 'credit', 'crypto'
    reference VARCHAR(100), -- Daraja CheckoutID or similar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscribers table (ISP/WISP Clients)
CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL, -- PPPoE/Hotspot Username
    password VARCHAR(100),
    ip_address INET,
    mac_address VARCHAR(17),
    access_plan VARCHAR(50), -- e.g., '10Mbps_OLED', 'Citadel_Infinite'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'expired'
    location VARCHAR(200),
    billing_day INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create migration_jobs table
CREATE TABLE IF NOT EXISTS migration_jobs (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL, -- 'mikrotik', 'csv', 'radius'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    total_clients INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@networking.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_ip_address ON devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_timestamp ON telemetry_data(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_metric ON telemetry_data(metric);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON network_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON network_alerts(resolved);

-- Enable row level security (optional, for multi-tenant scenarios)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE config_backups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE telemetry_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE network_alerts ENABLE ROW LEVEL SECURITY;
