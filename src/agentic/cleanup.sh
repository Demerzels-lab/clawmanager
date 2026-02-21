#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
CLEANUP_LOG="./logs/cleanup.log"
TEMP_DIR="./tmp"
CACHE_DIR="./cache"
BUILD_DIR="./build"
NODE_MODULES_DIR="./node_modules"
UPLOAD_DIR="./uploads"
BACKUP_RETENTION_DAYS=30
DRY_RUN=false

function log_cleanup() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$CLEANUP_LOG"
    echo "$message"
}

function setup_cleanup_environment() {
    mkdir -p "$(dirname "$CLEANUP_LOG")"
    mkdir -p "$TEMP_DIR"
    mkdir -p "$CACHE_DIR"
}

function cleanup_temp_files() {
    log_cleanup "Starting temporary files cleanup..."

    local temp_files_count=0
    local temp_space_saved=0

    # Clean system temp files related to the project
    if [ -d "$TEMP_DIR" ]; then
        local files_before=$(find "$TEMP_DIR" -type f | wc -l)
        local space_before=$(du -s "$TEMP_DIR" 2>/dev/null | cut -f1 || echo 0)

        find "$TEMP_DIR" -name "*.tmp" -type f -mtime +1 -delete
        find "$TEMP_DIR" -name "*.log" -type f -mtime +7 -delete
        find "$TEMP_DIR" -name "*.cache" -type f -mtime +3 -delete
        find "$TEMP_DIR" -empty -type d -delete

        local files_after=$(find "$TEMP_DIR" -type f | wc -l)
        local space_after=$(du -s "$TEMP_DIR" 2>/dev/null | cut -f1 || echo 0)

        temp_files_count=$((files_before - files_after))
        temp_space_saved=$((space_before - space_after))
    fi

    # Clean OS temp files
    if command -v tmpreaper &> /dev/null; then
        tmpreaper 1d /tmp/ 2>/dev/null || true
    fi

    log_cleanup "Cleaned $temp_files_count temporary files, saved ${temp_space_saved}KB"
}

function cleanup_cache_files() {
    log_cleanup "Starting cache cleanup..."

    local cache_files_count=0
    local cache_space_saved=0

    # Clean application cache
    if [ -d "$CACHE_DIR" ]; then
        local space_before=$(du -s "$CACHE_DIR" 2>/dev/null | cut -f1 || echo 0)

        find "$CACHE_DIR" -name "*.cache" -type f -mtime +7 -delete
        find "$CACHE_DIR" -name "*.session" -type f -mtime +1 -delete
        find "$CACHE_DIR" -name "*-old" -type f -mtime +30 -delete
        find "$CACHE_DIR" -empty -type d -delete

        local space_after=$(du -s "$CACHE_DIR" 2>/dev/null | cut -f1 || echo 0)
        cache_space_saved=$((space_before - space_after))
    fi

    # Clean npm cache if available
    if command -v npm &> /dev/null && [ -d "$NODE_MODULES_DIR" ]; then
        npm cache clean --force 2>/dev/null || true
        log_cleanup "Cleaned npm cache"
    fi

    # Clean yarn cache if available
    if command -v yarn &> /dev/null && [ -d "$NODE_MODULES_DIR" ]; then
        yarn cache clean 2>/dev/null || true
        log_cleanup "Cleaned yarn cache"
    fi

    log_cleanup "Cache cleanup completed, saved ${cache_space_saved}KB"
}

function cleanup_build_artifacts() {
    log_cleanup "Starting build artifacts cleanup..."

    local build_files_count=0
    local build_space_saved=0

    if [ -d "$BUILD_DIR" ]; then
        local space_before=$(du -s "$BUILD_DIR" 2>/dev/null | cut -f1 || echo 0)

        # Remove old build artifacts (keep last 3 builds)
        find "$BUILD_DIR" -maxdepth 1 -type d -name "build-*" | \
            sort -r | \
            tail -n +4 | \
            xargs -r rm -rf

        # Clean build cache
        find "$BUILD_DIR" -name "*.tmp" -type f -delete
        find "$BUILD_DIR" -name "*.log" -type f -mtime +7 -delete
        find "$BUILD_DIR" -empty -type d -delete

        local space_after=$(du -s "$BUILD_DIR" 2>/dev/null | cut -f1 || echo 0)
        build_space_saved=$((space_before - space_after))
    fi

    # Clean dist directories
    find . -name "dist" -type d -exec find {} -name "*.map" -type f -mtime +30 -delete \; 2>/dev/null || true

    log_cleanup "Build cleanup completed, saved ${build_space_saved}KB"
}

function cleanup_upload_files() {
    log_cleanup "Starting upload files cleanup..."

    local upload_files_count=0
    local upload_space_saved=0

    if [ -d "$UPLOAD_DIR" ]; then
        local space_before=$(du -s "$UPLOAD_DIR" 2>/dev/null | cut -f1 || echo 0)

        # Remove temporary upload files
        find "$UPLOAD_DIR" -name "*.tmp" -type f -mtime +1 -delete

        # Remove old uploaded files (customize retention as needed)
        find "$UPLOAD_DIR" -type f -mtime +90 -delete

        # Clean empty directories
        find "$UPLOAD_DIR" -empty -type d -delete

        local space_after=$(du -s "$UPLOAD_DIR" 2>/dev/null | cut -f1 || echo 0)
        upload_space_saved=$((space_before - space_after))
    fi

    log_cleanup "Upload cleanup completed, saved ${upload_space_saved}KB"
}

function cleanup_old_backups() {
    log_cleanup "Starting old backups cleanup..."

    local backup_files_count=0

    # Clean config backups
    if [ -d "./config/backups" ]; then
        backup_files_count=$(find "./config/backups" -name "*.tar.gz" -mtime +"$BACKUP_RETENTION_DAYS" | wc -l)
        find "./config/backups" -name "*.tar.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete
    fi

    # Clean database backups
    if [ -d "./backups" ]; then
        find "./backups" -name "*.sql.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete
        find "./backups" -name "*.dump" -mtime +"$BACKUP_RETENTION_DAYS" -delete
    fi

    # Clean log archives
    if [ -d "./logs/archive" ]; then
        find "./logs/archive" -name "*.gz" -mtime +"$((BACKUP_RETENTION_DAYS * 2))" -delete
    fi

    log_cleanup "Cleaned $backup_files_count old backup files"
}

function cleanup_docker_resources() {
    log_cleanup "Starting Docker resources cleanup..."

    if command -v docker &> /dev/null; then
        # Remove dangling images
        local dangling_images=$(docker images -f "dangling=true" -q | wc -l)
        if [ "$dangling_images" -gt 0 ]; then
            docker image prune -f
            log_cleanup "Removed $dangling_images dangling Docker images"
        fi

        # Remove stopped containers older than 7 days
        local old_containers=$(docker ps -a --filter "status=exited" --filter "status=created" --format "{{.ID}} {{.CreatedAt}}" | \
            awk '$2 <= "'$(date -d '7 days ago' +%Y-%m-%d)'" {print $1}' | wc -l)
        if [ "$old_containers" -gt 0 ]; then
            docker container prune --filter "until=168h" -f
            log_cleanup "Removed old Docker containers"
        fi

        # Remove unused volumes
        docker volume prune -f
        log_cleanup "Cleaned unused Docker volumes"
    else
        log_cleanup "Docker not found, skipping Docker cleanup"
    fi
}

function cleanup_package_manager_cache() {
    log_cleanup "Starting package manager cache cleanup..."

    # Clean apt cache (Ubuntu/Debian)
    if command -v apt &> /dev/null; then
        apt autoremove -y 2>/dev/null || true
        apt autoclean -y 2>/dev/null || true
        log_cleanup "Cleaned apt cache"
    fi

    # Clean yum cache (CentOS/RHEL)
    if command -v yum &> /dev/null; then
        yum clean all -y 2>/dev/null || true
        log_cleanup "Cleaned yum cache"
    fi

    # Clean Homebrew cache (macOS)
    if command -v brew &> /dev/null; then
        brew cleanup 2>/dev/null || true
        log_cleanup "Cleaned Homebrew cache"
    fi
}

function cleanup_logs() {
    log_cleanup "Starting log cleanup..."

    local log_files_count=0

    # Clean application logs
    if [ -d "./logs" ]; then
        # Keep logs for 30 days
        find "./logs" -name "*.log" -type f -mtime +30 -delete
        find "./logs" -name "*.log.*" -type f -mtime +30 -delete

        # Compress old logs
        find "./logs" -name "*.log" -type f -mtime +7 -exec gzip {} \; 2>/dev/null || true

        log_files_count=$(find "./logs" -name "*.log" -type f -mtime +30 | wc -l)
    fi

    log_cleanup "Log cleanup completed, removed $log_files_count old log files"
}

function vacuum_database() {
    log_cleanup "Starting database vacuum..."

    if command -v psql &> /dev/null; then
        # PostgreSQL vacuum (requires database connection details)
        export PGPASSWORD="${DATABASE_PASSWORD:-}"
        psql -h "${DATABASE_HOST:-localhost}" -U "${DATABASE_USER:-postgres}" -d "${DATABASE_NAME:-clawmanager}" \
            -c "VACUUM ANALYZE;" 2>/dev/null || log_cleanup "Database vacuum failed - check connection details"
        log_cleanup "Database vacuum completed"
    else
        log_cleanup "PostgreSQL client not found, skipping database vacuum"
    fi
}

function optimize_storage() {
    log_cleanup "Starting storage optimization..."

    # Defragment filesystem if supported
    if command -v e4defrag &> /dev/null; then
        e4defrag / 2>/dev/null || true
        log_cleanup "Filesystem defragmentation completed"
    fi

    # Optimize disk usage
    if command -v ncdu &> /dev/null; then
        log_cleanup "Disk usage analysis available with: ncdu /path/to/analyze"
    fi
}

function show_cleanup_status() {
    echo "=== Cleanup Status ==="
    echo "Project: $PROJECT_NAME"
    echo "Log File: $CLEANUP_LOG"
    echo "Dry Run: $DRY_RUN"
    echo ""

    echo "Directory Sizes:"
    for dir in "$TEMP_DIR" "$CACHE_DIR" "$BUILD_DIR" "$UPLOAD_DIR" "./logs" "./backups" "./config/backups"; do
        if [ -d "$dir" ]; then
            du -sh "$dir" 2>/dev/null | sed 's/^/  /' || echo "  $dir: N/A"
        fi
    done

    echo ""
    echo "Recent Cleanup Activities:"
    if [ -f "$CLEANUP_LOG" ]; then
        tail -10 "$CLEANUP_LOG" | sed 's/^/  /'
    else
        echo "  No cleanup log found"
    fi
}

function perform_full_cleanup() {
    log_cleanup "=== Starting Full Cleanup ==="

    cleanup_temp_files
    cleanup_cache_files
    cleanup_build_artifacts
    cleanup_upload_files
    cleanup_old_backups
    cleanup_docker_resources
    cleanup_package_manager_cache
    cleanup_logs
    vacuum_database
    optimize_storage

    log_cleanup "=== Full Cleanup Completed ==="
}

function show_help() {
    echo "Usage: $0 [command] [options]"
    echo "Commands:"
    echo "  full           Perform full cleanup (all operations)"
    echo "  temp           Clean temporary files"
    echo "  cache          Clean cache files"
    echo "  build          Clean build artifacts"
    echo "  uploads        Clean upload files"
    echo "  backups        Clean old backups"
    echo "  docker         Clean Docker resources"
    echo "  packages       Clean package manager cache"
    echo "  logs           Clean old log files"
    echo "  db             Vacuum database"
    echo "  storage        Optimize storage"
    echo "  status         Show cleanup status"
    echo "  help           Show this help message"
    echo ""
    echo "Options:"
    echo "  --dry-run      Show what would be cleaned without actually doing it"
    echo "  --retention=N  Set backup retention days (default: 30)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --retention=*)
            BACKUP_RETENTION_DAYS="${1#*=}"
            shift
            ;;
        *)
            break
            ;;
    esac
done

setup_cleanup_environment

if [ "$DRY_RUN" = true ]; then
    echo "DRY RUN MODE - No files will be deleted"
    echo ""
fi

case "$1" in
    full)
        perform_full_cleanup
        ;;
    temp)
        cleanup_temp_files
        ;;
    cache)
        cleanup_cache_files
        ;;
    build)
        cleanup_build_artifacts
        ;;
    uploads)
        cleanup_upload_files
        ;;
    backups)
        cleanup_old_backups
        ;;
    docker)
        cleanup_docker_resources
        ;;
    packages)
        cleanup_package_manager_cache
        ;;
    logs)
        cleanup_logs
        ;;
    db)
        vacuum_database
        ;;
    storage)
        optimize_storage
        ;;
    status)
        show_cleanup_status
        ;;
    help|*)
        show_help
        ;;
esac