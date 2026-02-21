#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
BACKUP_ROOT="./backups"
LOG_FILE="./logs/backup.log"
CONFIG_FILE="./backup.conf"
RETENTION_DAYS=30
COMPRESSION_LEVEL=6

function log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

function create_backup_directory() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    echo "$BACKUP_DIR"
}

function backup_database() {
    BACKUP_DIR="$1"
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-clawmanager}"
    DB_USER="${DB_USER:-postgres}"
    
    log_message "Starting database backup"
    
    if command -v pg_dump &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -b -v -f "$BACKUP_DIR/database.dump"
        log_message "PostgreSQL database backup completed"
    elif command -v mysqldump &> /dev/null; then
        mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_DIR/database.sql"
        log_message "MySQL database backup completed"
    else
        log_message "No supported database client found"
        return 1
    fi
}

function backup_files() {
    BACKUP_DIR="$1"
    SOURCE_DIRS=("./medea_memory" "./artifacts" "./logs" "./config")
    
    log_message "Starting file backup"
    
    for dir in "${SOURCE_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            DEST_DIR="$BACKUP_DIR/files/$(basename "$dir")"
            mkdir -p "$DEST_DIR"
            cp -r "$dir"/* "$DEST_DIR/" 2>/dev/null || true
            log_message "Backed up directory: $dir"
        fi
    done
}

function backup_docker_volumes() {
    BACKUP_DIR="$1"
    
    if command -v docker &> /dev/null; then
        log_message "Starting Docker volume backup"
        
        VOLUMES=("clawmanager_postgres_data" "clawmanager_redis_data")
        
        for volume in "${VOLUMES[@]}"; do
            if docker volume ls | grep -q "$volume"; then
                docker run --rm -v "$volume":/source -v "$BACKUP_DIR":/backup alpine tar czf "/backup/${volume}.tar.gz" -C /source .
                log_message "Backed up Docker volume: $volume"
            fi
        done
    fi
}

function backup_configuration() {
    BACKUP_DIR="$1"
    
    log_message "Starting configuration backup"
    
    CONFIG_FILES=(".env" "docker-compose.yml" "nginx.conf" "supervisor.conf")
    
    for file in "${CONFIG_FILES[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$BACKUP_DIR/config/"
            log_message "Backed up config file: $file"
        fi
    done
}

function compress_backup() {
    BACKUP_DIR="$1"
    ARCHIVE_NAME="$(basename "$BACKUP_DIR").tar.gz"
    ARCHIVE_PATH="$BACKUP_ROOT/$ARCHIVE_NAME"
    
    log_message "Compressing backup"
    
    tar -czf "$ARCHIVE_PATH" -C "$BACKUP_ROOT" "$(basename "$BACKUP_DIR")"
    rm -rf "$BACKUP_DIR"
    
    log_message "Backup compressed: $ARCHIVE_PATH"
    echo "$ARCHIVE_PATH"
}

function encrypt_backup() {
    ARCHIVE_PATH="$1"
    
    if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        log_message "Encrypting backup"
        openssl enc -aes-256-cbc -salt -in "$ARCHIVE_PATH" -out "${ARCHIVE_PATH}.enc" -k "$BACKUP_ENCRYPTION_KEY"
        rm "$ARCHIVE_PATH"
        ARCHIVE_PATH="${ARCHIVE_PATH}.enc"
        log_message "Backup encrypted"
    fi
    
    echo "$ARCHIVE_PATH"
}

function upload_to_remote() {
    ARCHIVE_PATH="$1"
    
    if [ -n "$REMOTE_HOST" ] && [ -n "$REMOTE_PATH" ]; then
        log_message "Uploading backup to remote storage"
        
        if [ -n "$REMOTE_USER" ]; then
            scp "$ARCHIVE_PATH" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
        else
            scp "$ARCHIVE_PATH" "$REMOTE_HOST:$REMOTE_PATH/"
        fi
        
        log_message "Backup uploaded to remote storage"
    fi
}

function verify_backup() {
    ARCHIVE_PATH="$1"
    
    log_message "Verifying backup integrity"
    
    if [ "${ARCHIVE_PATH##*.}" = "enc" ]; then
        log_message "Skipping verification for encrypted backup"
        return 0
    fi
    
    if tar -tzf "$ARCHIVE_PATH" &> /dev/null; then
        log_message "Backup verification successful"
        return 0
    else
        log_message "Backup verification failed"
        return 1
    fi
}

function cleanup_old_backups() {
    log_message "Cleaning up old backups (retention: ${RETENTION_DAYS} days)"
    
    find "$BACKUP_ROOT" -name "*.tar.gz*" -mtime +"$RETENTION_DAYS" -delete
    find "$BACKUP_ROOT" -type d -empty -delete
    
    log_message "Old backups cleaned up"
}

function load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
        log_message "Configuration loaded from $CONFIG_FILE"
    fi
}

function create_config_template() {
    if [ ! -f "$CONFIG_FILE" ]; then
        cat > "$CONFIG_FILE" << EOF
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clawmanager
DB_USER=postgres
DB_PASSWORD=your_password_here

# Remote backup configuration
REMOTE_HOST=
REMOTE_USER=
REMOTE_PATH=/backups

# Encryption
BACKUP_ENCRYPTION_KEY=

# Retention (days)
RETENTION_DAYS=30

# Compression level (1-9)
COMPRESSION_LEVEL=6
EOF
        log_message "Created configuration template: $CONFIG_FILE"
    fi
}

function full_backup() {
    log_message "Starting full backup"
    
    BACKUP_DIR=$(create_backup_directory)
    mkdir -p "$BACKUP_DIR/config"
    
    backup_database "$BACKUP_DIR"
    backup_files "$BACKUP_DIR"
    backup_docker_volumes "$BACKUP_DIR"
    backup_configuration "$BACKUP_DIR"
    
    ARCHIVE_PATH=$(compress_backup "$BACKUP_DIR")
    ARCHIVE_PATH=$(encrypt_backup "$ARCHIVE_PATH")
    
    upload_to_remote "$ARCHIVE_PATH"
    
    if verify_backup "$ARCHIVE_PATH"; then
        log_message "Full backup completed successfully"
        echo "$ARCHIVE_PATH"
    else
        log_message "Full backup failed verification"
        return 1
    fi
}

function incremental_backup() {
    log_message "Starting incremental backup"
    
    # For simplicity, this is the same as full backup
    # In a real implementation, you'd track changes since last backup
    full_backup
}

function restore_database() {
    BACKUP_FILE="$1"
    
    if [ -z "$BACKUP_FILE" ]; then
        echo "Usage: $0 restore-db <backup_file>"
        exit 1
    fi
    
    log_message "Starting database restore from $BACKUP_FILE"
    
    if [[ "$BACKUP_FILE" == *.dump ]]; then
        PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c -v "$BACKUP_FILE"
    elif [[ "$BACKUP_FILE" == *.sql ]]; then
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$BACKUP_FILE"
    fi
    
    log_message "Database restore completed"
}

function restore_files() {
    BACKUP_FILE="$1"
    RESTORE_DIR="${2:-.}"
    
    if [ -z "$BACKUP_FILE" ]; then
        echo "Usage: $0 restore-files <backup_file> [restore_directory]"
        exit 1
    fi
    
    log_message "Starting file restore from $BACKUP_FILE to $RESTORE_DIR"
    
    mkdir -p "$RESTORE_DIR"
    tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"
    
    log_message "File restore completed"
}

function list_backups() {
    echo "Available backups:"
    ls -la "$BACKUP_ROOT"/*.tar.gz* 2>/dev/null || echo "No backups found"
}

function show_backup_info() {
    BACKUP_FILE="$1"
    
    if [ -z "$BACKUP_FILE" ]; then
        echo "Usage: $0 info <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    echo "Backup file: $BACKUP_FILE"
    echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo "Created: $(stat -c %y "$BACKUP_FILE")"
    
    if [[ "$BACKUP_FILE" != *.enc ]]; then
        echo "Contents:"
        tar -tzf "$BACKUP_FILE" | head -20
    else
        echo "Encrypted backup - contents not available"
    fi
}

function show_help() {
    echo "Usage: $0 [command] [options]"
    echo "Commands:"
    echo "  full       Perform full backup"
    echo "  incremental Perform incremental backup"
    echo "  restore-db <file>    Restore database from backup"
    echo "  restore-files <file> [dir]  Restore files from backup"
    echo "  list       List available backups"
    echo "  info <file> Show information about a backup"
    echo "  cleanup    Clean up old backups"
    echo "  config     Create configuration template"
    echo "  help       Show this help message"
}

mkdir -p "$BACKUP_ROOT"
mkdir -p "./logs"

load_config
create_config_template

case "$1" in
    full)
        full_backup
        ;;
    incremental)
        incremental_backup
        ;;
    restore-db)
        restore_database "$2"
        ;;
    restore-files)
        restore_files "$2" "$3"
        ;;
    list)
        list_backups
        ;;
    info)
        show_backup_info "$2"
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    config)
        create_config_template
        ;;
    help|*)
        show_help
        ;;
esac