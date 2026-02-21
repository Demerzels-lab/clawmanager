#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
UPDATE_LOG="./logs/update.log"
BACKUP_DIR="./backups/pre-update"
ROLLBACK_DIR="./backups/rollback"
UPDATE_LOCK_FILE="./.update_lock"
VERSION_FILE="./version.json"
ROLLBACK_ENABLED=true

function log_update() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$UPDATE_LOG"
    echo "$message"
}

function acquire_update_lock() {
    if [ -f "$UPDATE_LOCK_FILE" ]; then
        local lock_pid=$(cat "$UPDATE_LOCK_FILE")
        if kill -0 "$lock_pid" 2>/dev/null; then
            log_update "Update already in progress (PID: $lock_pid)"
            exit 1
        else
            log_update "Removing stale lock file"
            rm -f "$UPDATE_LOCK_FILE"
        fi
    fi

    echo $$ > "$UPDATE_LOCK_FILE"
    trap 'release_update_lock' EXIT
}

function release_update_lock() {
    rm -f "$UPDATE_LOCK_FILE"
}

function setup_update_environment() {
    mkdir -p "$(dirname "$UPDATE_LOG")"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$ROLLBACK_DIR"
}

function create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/backup_$timestamp.tar.gz"

    log_update "Creating pre-update backup..."

    # Backup critical files and directories
    tar -czf "$backup_file" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='logs' \
        --exclude='tmp' \
        --exclude='cache' \
        --exclude='uploads' \
        . 2>/dev/null || true

    echo "$backup_file" > "$ROLLBACK_DIR/latest_backup.txt"

    log_update "Backup created: $backup_file"
}

function check_system_requirements() {
    log_update "Checking system requirements..."

    # Check disk space (need at least 1GB free)
    local free_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$free_space" -lt 1 ]; then
        log_update "ERROR: Insufficient disk space (${free_space}GB free, need 1GB)"
        return 1
    fi

    # Check memory
    local total_mem=$(free -g | grep '^Mem:' | awk '{print $2}')
    if [ "$total_mem" -lt 2 ]; then
        log_update "WARNING: Low memory (${total_mem}GB total)"
    fi

    # Check if services are running
    if command -v docker &> /dev/null && docker ps | grep -q clawmanager; then
        log_update "Services are running, will stop them for update"
    fi

    log_update "System requirements check passed"
}

function update_system_packages() {
    log_update "Updating system packages..."

    if command -v apt &> /dev/null; then
        apt update && apt upgrade -y
        log_update "Updated Ubuntu/Debian packages"
    elif command -v yum &> /dev/null; then
        yum update -y
        log_update "Updated CentOS/RHEL packages"
    elif command -v brew &> /dev/null; then
        brew update && brew upgrade
        log_update "Updated Homebrew packages"
    else
        log_update "No supported package manager found"
    fi
}

function update_nodejs_dependencies() {
    log_update "Updating Node.js dependencies..."

    if [ -f "package.json" ]; then
        # Backup package-lock.json or yarn.lock
        if [ -f "package-lock.json" ]; then
            cp package-lock.json "$BACKUP_DIR/package-lock.json.backup"
        fi
        if [ -f "yarn.lock" ]; then
            cp yarn.lock "$BACKUP_DIR/yarn.lock.backup"
        fi

        # Update dependencies
        if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
            yarn upgrade
            log_update "Updated dependencies with Yarn"
        elif command -v npm &> /dev/null; then
            npm update
            npm audit fix
            log_update "Updated dependencies with npm"
        else
            log_update "No package manager found for Node.js"
        fi
    else
        log_update "No package.json found, skipping Node.js updates"
    fi
}

function update_python_dependencies() {
    log_update "Updating Python dependencies..."

    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "Pipfile" ]; then
        # Backup requirements files
        cp requirements.txt "$BACKUP_DIR/requirements.txt.backup" 2>/dev/null || true
        cp pyproject.toml "$BACKUP_DIR/pyproject.toml.backup" 2>/dev/null || true
        cp Pipfile "$BACKUP_DIR/Pipfile.backup" 2>/dev/null || true

        # Update Python packages
        if command -v pipenv &> /dev/null && [ -f "Pipfile" ]; then
            pipenv update
            log_update "Updated Python dependencies with Pipenv"
        elif command -v poetry &> /dev/null && [ -f "pyproject.toml" ]; then
            poetry update
            log_update "Updated Python dependencies with Poetry"
        elif command -v pip &> /dev/null && [ -f "requirements.txt" ]; then
            pip install --upgrade -r requirements.txt
            log_update "Updated Python dependencies with pip"
        fi

        # Update pip itself
        pip install --upgrade pip
    else
        log_update "No Python dependency files found"
    fi
}

function update_docker_images() {
    log_update "Updating Docker images..."

    if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
        # Stop services
        docker-compose down

        # Pull latest images
        docker-compose pull

        # Clean up old images
        docker image prune -f

        log_update "Updated Docker images"
    elif command -v docker &> /dev/null && [ -f "Dockerfile" ]; then
        # Rebuild local image
        docker build --no-cache -t clawmanager:latest .
        log_update "Rebuilt Docker image"
    else
        log_update "No Docker setup found"
    fi
}

function update_database_schema() {
    log_update "Updating database schema..."

    if [ -f "./migrations" ] || [ -d "./db/migrations" ]; then
        # Run database migrations
        if command -v npm &> /dev/null && grep -q "prisma" package.json 2>/dev/null; then
            npx prisma migrate deploy
            log_update "Applied Prisma migrations"
        elif command -v python &> /dev/null && [ -f "manage.py" ]; then
            python manage.py migrate
            log_update "Applied Django migrations"
        elif command -v dotnet &> /dev/null && [ -f "*.csproj" ]; then
            dotnet ef database update
            log_update "Applied Entity Framework migrations"
        else
            log_update "No migration tool detected"
        fi
    else
        log_update "No database migrations found"
    fi
}

function update_application_code() {
    log_update "Updating application code..."

    if [ -d ".git" ]; then
        # Check for uncommitted changes
        if ! git diff --quiet || ! git diff --staged --quiet; then
            log_update "WARNING: Uncommitted changes detected"
            git stash push -m "pre-update-$(date +%Y%m%d_%H%M%S)"
            echo "stashed" > "$ROLLBACK_DIR/git_stash.txt"
        fi

        # Pull latest changes
        git pull --rebase
        log_update "Pulled latest code changes"
    else
        log_update "Not a git repository, skipping code update"
    fi
}

function rebuild_application() {
    log_update "Rebuilding application..."

    if [ -f "package.json" ]; then
        if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
            yarn install && yarn build
        elif command -v npm &> /dev/null; then
            npm install && npm run build
        fi
        log_update "Rebuilt Node.js application"
    elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        # Python rebuild (if needed)
        log_update "Python application rebuild not required"
    elif [ -f "*.csproj" ] && command -v dotnet &> /dev/null; then
        dotnet build --configuration Release
        log_update "Rebuilt .NET application"
    fi
}

function run_tests() {
    log_update "Running tests..."

    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test
        log_update "Ran Node.js tests"
    elif [ -f "pytest.ini" ] || [ -f "tests" ] && command -v python &> /dev/null; then
        python -m pytest
        log_update "Ran Python tests"
    elif [ -f "*.csproj" ] && command -v dotnet &> /dev/null; then
        dotnet test
        log_update "Ran .NET tests"
    else
        log_update "No test suite found"
    fi
}

function restart_services() {
    log_update "Restarting services..."

    if [ -f "docker-compose.yml" ] && command -v docker &> /dev/null; then
        docker-compose up -d
        log_update "Restarted Docker services"
    elif [ -f "package.json" ] && grep -q '"start"' package.json; then
        # Restart Node.js service (assuming PM2 or similar)
        if command -v pm2 &> /dev/null; then
            pm2 restart all
            log_update "Restarted Node.js services with PM2"
        else
            log_update "Manual service restart required"
        fi
    else
        log_update "No service restart configuration found"
    fi
}

function verify_update() {
    log_update "Verifying update..."

    # Check if services are running
    if [ -f "docker-compose.yml" ] && command -v docker &> /dev/null; then
        if docker-compose ps | grep -q "Up"; then
            log_update "✓ Services are running"
        else
            log_update "✗ Services failed to start"
            return 1
        fi
    fi

    # Check application health
    if [ -f "package.json" ] && grep -q '"health"' package.json; then
        npm run health
    fi

    # Check database connectivity
    if command -v psql &> /dev/null; then
        export PGPASSWORD="${DATABASE_PASSWORD:-}"
        if psql -h "${DATABASE_HOST:-localhost}" -U "${DATABASE_USER:-postgres}" -d "${DATABASE_NAME:-clawmanager}" -c "SELECT 1;" &>/dev/null; then
            log_update "✓ Database connection successful"
        else
            log_update "✗ Database connection failed"
            return 1
        fi
    fi

    log_update "Update verification completed successfully"
}

function rollback_update() {
    log_update "Starting rollback..."

    # Restore from backup
    if [ -f "$ROLLBACK_DIR/latest_backup.txt" ]; then
        local backup_file=$(cat "$ROLLBACK_DIR/latest_backup.txt")
        if [ -f "$backup_file" ]; then
            tar -xzf "$backup_file"
            log_update "Restored from backup: $backup_file"
        fi
    fi

    # Restore git stash if needed
    if [ -f "$ROLLBACK_DIR/git_stash.txt" ]; then
        git stash pop
        log_update "Restored git changes"
    fi

    # Restart services
    restart_services

    log_update "Rollback completed"
}

function update_version_info() {
    if [ ! -f "$VERSION_FILE" ]; then
        cat > "$VERSION_FILE" << EOF
{
  "version": "1.0.0",
  "last_update": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "update_method": "manual"
}
EOF
    else
        local current_version=$(jq -r '.version' "$VERSION_FILE")
        local new_version="$current_version"
        # Simple version increment (patch)
        new_version=$(echo "$current_version" | awk -F. '{$3=$3+1; print $1"."$2"."$3}')

        jq --arg version "$new_version" --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
           '.version = $version | .last_update = $timestamp | .update_method = "script"' \
           "$VERSION_FILE" > "${VERSION_FILE}.tmp" && mv "${VERSION_FILE}.tmp" "$VERSION_FILE"
    fi

    log_update "Updated version info to $(jq -r '.version' "$VERSION_FILE")"
}

function show_update_status() {
    echo "=== Update Status ==="
    echo "Project: $PROJECT_NAME"
    echo "Log File: $UPDATE_LOG"
    echo "Lock File: $UPDATE_LOCK_FILE"
    echo ""

    if [ -f "$VERSION_FILE" ]; then
        echo "Current Version:"
        jq . "$VERSION_FILE" 2>/dev/null || cat "$VERSION_FILE"
        echo ""
    fi

    echo "Update History:"
    if [ -f "$UPDATE_LOG" ]; then
        tail -20 "$UPDATE_LOG" | sed 's/^/  /'
    else
        echo "  No update history found"
    fi

    echo ""
    echo "Available Backups:"
    ls -la "$BACKUP_DIR" 2>/dev/null | grep -v '^total' | sed 's/^/  /' || echo "  No backups found"
}

function perform_full_update() {
    log_update "=== Starting Full Update ==="

    check_system_requirements
    create_backup
    update_system_packages
    update_application_code
    update_nodejs_dependencies
    update_python_dependencies
    update_docker_images
    update_database_schema
    rebuild_application
    run_tests
    update_version_info
    restart_services
    verify_update

    log_update "=== Full Update Completed Successfully ==="
}

function show_help() {
    echo "Usage: $0 [command] [options]"
    echo "Commands:"
    echo "  full           Perform full update (all operations)"
    echo "  system         Update system packages only"
    echo "  code           Update application code only"
    echo "  deps           Update dependencies only"
    echo "  docker         Update Docker images only"
    echo "  db             Update database schema only"
    echo "  build          Rebuild application only"
    echo "  test           Run tests only"
    echo "  restart        Restart services only"
    echo "  verify         Verify update status only"
    echo "  rollback       Rollback to previous version"
    echo "  status         Show update status"
    echo "  help           Show this help message"
    echo ""
    echo "Options:"
    echo "  --no-rollback  Disable automatic rollback on failure"
    echo "  --force        Force update even if requirements not met"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-rollback)
            ROLLBACK_ENABLED=false
            shift
            ;;
        --force)
            shift
            ;;
        *)
            break
            ;;
    esac
done

setup_update_environment
acquire_update_lock

# Trap errors for rollback
if [ "$ROLLBACK_ENABLED" = true ]; then
    trap 'log_update "Update failed, initiating rollback..."; rollback_update' ERR
fi

case "$1" in
    full)
        perform_full_update
        ;;
    system)
        update_system_packages
        ;;
    code)
        update_application_code
        ;;
    deps)
        update_nodejs_dependencies
        update_python_dependencies
        ;;
    docker)
        update_docker_images
        ;;
    db)
        update_database_schema
        ;;
    build)
        rebuild_application
        ;;
    test)
        run_tests
        ;;
    restart)
        restart_services
        ;;
    verify)
        verify_update
        ;;
    rollback)
        rollback_update
        ;;
    status)
        show_update_status
        ;;
    help|*)
        show_help
        ;;
esac