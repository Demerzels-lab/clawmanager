#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
ENV_FILE=".env"
CONFIG_DIR="./config"
LOG_DIR="./logs"
DATA_DIR="./data"
BACKUP_DIR="./backups"
TEMP_DIR="./tmp"

function check_system_requirements() {
    echo "Checking system requirements..."

    if ! command -v node &> /dev/null; then
        echo "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        echo "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi

    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

function create_directory_structure() {
    echo "Creating directory structure..."

    mkdir -p "$CONFIG_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$TEMP_DIR"
    mkdir -p ./medea_memory
    mkdir -p ./artifacts
    mkdir -p ./ssl
    mkdir -p ./nginx/conf.d
    mkdir -p ./nginx/ssl
}

function generate_ssl_certificates() {
    if [ ! -f ./ssl/cert.pem ]; then
        echo "Generating SSL certificates..."
        openssl req -x509 -newkey rsa:4096 -keyout ./ssl/key.pem -out ./ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=ClawManager/CN=localhost"
        cp ./ssl/cert.pem ./nginx/ssl/
        cp ./ssl/key.pem ./nginx/ssl/
    fi
}

function create_nginx_config() {
    if [ ! -f ./nginx/conf.d/default.conf ]; then
        cat > ./nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name localhost;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name localhost;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://api:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    fi
}

function create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        echo "Creating environment configuration..."
        cat > "$ENV_FILE" << EOF
NODE_ENV=production
PORT=3000
API_PORT=8000
DATABASE_URL=postgresql://clawmanager:password@db:5432/clawmanager
REDIS_URL=redis://redis:6379
JWT_SECRET=$(openssl rand -hex 32)
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
MEDEA_API_KEY=your-medea-api-key-here
CLAW_NETWORK_ENDPOINT=https://api.clawnetwork.com
LOG_LEVEL=info
MAX_WORKERS=4
MEMORY_LIMIT=1GB
TIMEOUT=30000
EOF
        echo "Environment file created. Please edit $ENV_FILE with your actual values."
    fi
}

function setup_database() {
    echo "Setting up database..."

    if [ ! -f ./init.sql ]; then
        cat > ./init.sql << EOF
CREATE DATABASE IF NOT EXISTS clawmanager;
CREATE USER IF NOT EXISTS clawmanager WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE clawmanager TO clawmanager;
EOF
    fi

    if [ ! -f ./schema.sql ]; then
        cat > ./schema.sql << EOF
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    balance DECIMAL(36,18) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reward DECIMAL(36,18) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    user_address VARCHAR(42) NOT NULL,
    content TEXT,
    score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_submissions_task_id ON submissions(task_id);
CREATE INDEX idx_submissions_user ON submissions(user_address);
EOF
    fi
}

function configure_firewall() {
    if command -v ufw &> /dev/null; then
        echo "Configuring firewall..."
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 5432/tcp
        sudo ufw allow 6379/tcp
        sudo ufw --force enable
    elif command -v firewall-cmd &> /dev/null; then
        echo "Configuring firewalld..."
        sudo firewall-cmd --permanent --add-port=22/tcp
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --permanent --add-port=5432/tcp
        sudo firewall-cmd --permanent --add-port=6379/tcp
        sudo firewall-cmd --reload
    fi
}

function install_dependencies() {
    echo "Installing dependencies..."
    pnpm install --frozen-lockfile

    if [ -f requirements.txt ]; then
        pip install -r requirements.txt
    fi
}

function build_application() {
    echo "Building application..."
    pnpm run build
}

function create_docker_compose() {
    if [ ! -f docker-compose.yml ]; then
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
      - redis
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
      - redis
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=clawmanager
      - POSTGRES_USER=clawmanager
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF
    fi
}

function setup_monitoring() {
    echo "Setting up monitoring..."

    if [ ! -f docker-compose.monitoring.yml ]; then
        cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana_data:
EOF
    fi

    mkdir -p ./monitoring
    if [ ! -f ./monitoring/prometheus.yml ]; then
        cat > ./monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'clawmanager'
    static_configs:
      - targets: ['app:3000', 'api:8000', 'db:5432']
EOF
    fi
}

function initialize_system() {
    check_system_requirements
    create_directory_structure
    generate_ssl_certificates
    create_nginx_config
    create_env_file
    setup_database
    configure_firewall
    install_dependencies
    build_application
    create_docker_compose
    setup_monitoring
    echo "System initialization completed successfully!"
}

function show_help() {
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  init     Initialize the entire system"
    echo "  deps     Install dependencies only"
    echo "  build    Build application only"
    echo "  ssl      Generate SSL certificates only"
    echo "  config   Create configuration files only"
    echo "  help     Show this help message"
}

case "$1" in
    init)
        initialize_system
        ;;
    deps)
        install_dependencies
        ;;
    build)
        build_application
        ;;
    ssl)
        generate_ssl_certificates
        ;;
    config)
        create_env_file
        create_nginx_config
        create_docker_compose
        ;;
    help|*)
        show_help
        ;;
esac