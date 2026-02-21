#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
DOCKER_IMAGE="clawnetwork/medea-agent:v4.0.5"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

function check_dependencies() {
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install Docker first."
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

function create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/clawmanager
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
EOF
        echo "Created $ENV_FILE. Please edit it with your actual values."
    fi
}

function setup_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p ./medea_memory
    mkdir -p ./artifacts
}

function build_images() {
    echo "Building Docker images..."
    docker build -t "$DOCKER_IMAGE" .
}

function start_services() {
    echo "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
}

function wait_for_services() {
    echo "Waiting for services to be ready..."
    sleep 30
    docker-compose -f "$COMPOSE_FILE" ps
}

function run_migrations() {
    echo "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" exec web python manage.py migrate
}

function create_superuser() {
    echo "Creating superuser..."
    docker-compose -f "$COMPOSE_FILE" exec web python manage.py createsuperuser --noinput
}

function setup_ssl() {
    if [ ! -f ./ssl/cert.pem ]; then
        mkdir -p ./ssl
        openssl req -x509 -newkey rsa:4096 -keyout ./ssl/key.pem -out ./ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        echo "SSL certificates created."
    fi
}

function configure_firewall() {
    if command -v ufw &> /dev/null; then
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 5432/tcp
        sudo ufw allow 6379/tcp
        sudo ufw --force enable
        echo "Firewall configured."
    fi
}

function setup_monitoring() {
    echo "Setting up monitoring..."
    docker-compose -f "$COMPOSE_FILE" up -d prometheus grafana
}

function deploy() {
    check_dependencies
    create_env_file
    setup_directories
    build_images
    start_services
    wait_for_services
    run_migrations
    create_superuser
    setup_ssl
    configure_firewall
    setup_monitoring
    echo "Deployment completed successfully!"
}

function rollback() {
    echo "Rolling back deployment..."
    docker-compose -f "$COMPOSE_FILE" down
    if [ -d "$BACKUP_DIR/latest" ]; then
        cp -r "$BACKUP_DIR/latest"/* ./
        start_services
        echo "Rollback completed."
    else
        echo "No backup found for rollback."
    fi
}

function cleanup() {
    echo "Cleaning up old containers and images..."
    docker system prune -f
    docker image prune -f
}

function health_check() {
    echo "Performing health check..."
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        echo "All services are running."
        return 0
    else
        echo "Some services are not running."
        return 1
    fi
}

function logs() {
    docker-compose -f "$COMPOSE_FILE" logs -f
}

function restart() {
    echo "Restarting services..."
    docker-compose -f "$COMPOSE_FILE" restart
}

function stop() {
    echo "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down
}

function backup() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
    mkdir -p "$BACKUP_PATH"
    docker-compose -f "$COMPOSE_FILE" exec db pg_dump -U postgres clawmanager > "$BACKUP_PATH/database.sql"
    cp -r ./medea_memory "$BACKUP_PATH/"
    cp -r ./artifacts "$BACKUP_PATH/"
    cp "$ENV_FILE" "$BACKUP_PATH/"
    ln -sf "$BACKUP_PATH" "$BACKUP_DIR/latest"
    echo "Backup created at $BACKUP_PATH"
}

function restore() {
    if [ -z "$1" ]; then
        echo "Usage: $0 restore <backup_timestamp>"
        exit 1
    fi
    BACKUP_PATH="$BACKUP_DIR/$1"
    if [ ! -d "$BACKUP_PATH" ]; then
        echo "Backup $1 not found."
        exit 1
    fi
    stop
    docker-compose -f "$COMPOSE_FILE" exec db psql -U postgres -d clawmanager < "$BACKUP_PATH/database.sql"
    cp -r "$BACKUP_PATH/medea_memory"/* ./medea_memory/ 2>/dev/null || true
    cp -r "$BACKUP_PATH/artifacts"/* ./artifacts/ 2>/dev/null || true
    cp "$BACKUP_PATH/$ENV_FILE" ./
    start_services
    echo "Restore completed from $BACKUP_PATH"
}

function update() {
    echo "Updating application..."
    git pull origin main
    build_images
    docker-compose -f "$COMPOSE_FILE" up -d --build
    run_migrations
    echo "Update completed."
}

function scale() {
    if [ -z "$2" ]; then
        echo "Usage: $0 scale <service> <replicas>"
        exit 1
    fi
    docker-compose -f "$COMPOSE_FILE" up -d --scale "$1=$2"
}

function status() {
    docker-compose -f "$COMPOSE_FILE" ps
    echo "Disk usage:"
    df -h
    echo "Memory usage:"
    free -h
}

case "$1" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    cleanup)
        cleanup
        ;;
    health)
        health_check
        ;;
    logs)
        logs
        ;;
    restart)
        restart
        ;;
    stop)
        stop
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    update)
        update
        ;;
    scale)
        scale "$2" "$3"
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|cleanup|health|logs|restart|stop|backup|restore|update|scale|status}"
        exit 1
        ;;
esac