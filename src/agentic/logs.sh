#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
LOG_DIR="./logs"
ARCHIVE_DIR="./logs/archive"
ANALYSIS_DIR="./logs/analysis"
CONFIG_FILE="./log-config.json"
RETENTION_DAYS=30
MAX_LOG_SIZE="100M"
COMPRESSION_LEVEL=6

function setup_log_directories() {
    mkdir -p "$LOG_DIR"
    mkdir -p "$ARCHIVE_DIR"
    mkdir -p "$ANALYSIS_DIR"
    mkdir -p "$LOG_DIR/app"
    mkdir -p "$LOG_DIR/api"
    mkdir -p "$LOG_DIR/db"
    mkdir -p "$LOG_DIR/nginx"
    mkdir -p "$LOG_DIR/monitoring"
}

function create_log_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        cat > "$CONFIG_FILE" << EOF
{
  "log_levels": {
    "error": "ERROR",
    "warn": "WARN",
    "info": "INFO",
    "debug": "DEBUG"
  },
  "log_format": "json",
  "max_file_size": "100M",
  "max_files": 10,
  "compression": "gzip",
  "retention_days": 30,
  "log_sources": [
    {
      "name": "app",
      "path": "./logs/app/*.log",
      "pattern": "timestamp level message"
    },
    {
      "name": "api",
      "path": "./logs/api/*.log",
      "pattern": "timestamp method url status duration"
    },
    {
      "name": "db",
      "path": "./logs/db/*.log",
      "pattern": "timestamp query duration"
    },
    {
      "name": "nginx",
      "path": "./logs/nginx/*.log",
      "pattern": "timestamp remote_addr method url status body_bytes_sent"
    }
  ],
  "alert_rules": [
    {
      "name": "high_error_rate",
      "condition": "error_count > 10",
      "action": "email_admin"
    },
    {
      "name": "slow_requests",
      "condition": "avg_response_time > 5000",
      "action": "log_warning"
    }
  ]
}
EOF
    fi
}

function rotate_logs() {
    echo "Rotating log files..."

    for log_file in "$LOG_DIR"/*/*.log; do
        if [ -f "$log_file" ]; then
            file_size=$(stat -c%s "$log_file" 2>/dev/null || stat -f%z "$log_file" 2>/dev/null)
            max_size=$(numfmt --from=iec "$MAX_LOG_SIZE")

            if [ "$file_size" -gt "$max_size" ]; then
                timestamp=$(date +%Y%m%d_%H%M%S)
                archive_name="$(basename "$log_file" .log)_$timestamp.log"

                mv "$log_file" "$ARCHIVE_DIR/$archive_name"
                touch "$log_file"

                echo "Rotated $log_file to $ARCHIVE_DIR/$archive_name"
            fi
        fi
    done
}

function compress_old_logs() {
    echo "Compressing old log files..."

    find "$ARCHIVE_DIR" -name "*.log" -mtime +1 -exec gzip -"$COMPRESSION_LEVEL" {} \;

    echo "Compressed old log files"
}

function analyze_logs() {
    local analysis_file="$ANALYSIS_DIR/analysis_$(date +%Y%m%d).txt"

    echo "Analyzing log files..."
    echo "Log Analysis Report - $(date)" > "$analysis_file"
    echo "=================================" >> "$analysis_file"
    echo "" >> "$analysis_file"

    echo "1. Error Summary:" >> "$analysis_file"
    for log_source in $(jq -r '.log_sources[].name' "$CONFIG_FILE" 2>/dev/null || echo "app api db nginx"); do
        if [ -d "$LOG_DIR/$log_source" ]; then
            error_count=$(grep -r "ERROR" "$LOG_DIR/$log_source" 2>/dev/null | wc -l)
            echo "  $log_source: $error_count errors" >> "$analysis_file"
        fi
    done
    echo "" >> "$analysis_file"

    echo "2. Request Statistics:" >> "$analysis_file"
    if [ -d "$LOG_DIR/api" ]; then
        total_requests=$(find "$LOG_DIR/api" -name "*.log" -exec grep -c "HTTP" {} \; 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "0")
        echo "  Total API requests: $total_requests" >> "$analysis_file"

        status_200=$(find "$LOG_DIR/api" -name "*.log" -exec grep -c " 200 " {} \; 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "0")
        status_400=$(find "$LOG_DIR/api" -name "*.log" -exec grep -c " 400 " {} \; 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "0")
        status_500=$(find "$LOG_DIR/api" -name "*.log" -exec grep -c " 500 " {} \; 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "0")

        echo "  200 OK: $status_200" >> "$analysis_file"
        echo "  400 Bad Request: $status_400" >> "$analysis_file"
        echo "  500 Internal Server Error: $status_500" >> "$analysis_file"
    fi
    echo "" >> "$analysis_file"

    echo "3. Performance Metrics:" >> "$analysis_file"
    if [ -d "$LOG_DIR/api" ]; then
        avg_response_time=$(find "$LOG_DIR/api" -name "*.log" -exec grep -o " [0-9]*ms" {} \; 2>/dev/null | grep -o "[0-9]*" | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        echo "  Average response time: ${avg_response_time}ms" >> "$analysis_file"
    fi
    echo "" >> "$analysis_file"

    echo "4. Top Error Messages:" >> "$analysis_file"
    for log_source in $(jq -r '.log_sources[].name' "$CONFIG_FILE" 2>/dev/null || echo "app api db nginx"); do
        if [ -d "$LOG_DIR/$log_source" ]; then
            echo "  $log_source:" >> "$analysis_file"
            grep -r "ERROR" "$LOG_DIR/$log_source" 2>/dev/null | \
                sed 's/.*ERROR //' | \
                sort | uniq -c | sort -nr | head -5 | \
                sed 's/^/    /' >> "$analysis_file"
        fi
    done
    echo "" >> "$analysis_file"

    echo "5. System Resource Usage:" >> "$analysis_file"
    if command -v docker &> /dev/null && docker ps | grep -q clawmanager; then
        echo "  Docker containers:" >> "$analysis_file"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -10 >> "$analysis_file"
    fi
    echo "" >> "$analysis_file"

    echo "Analysis completed: $analysis_file"
}

function search_logs() {
    local search_term="$1"
    local log_source="$2"
    local time_range="$3"

    if [ -z "$search_term" ]; then
        echo "Usage: $0 search <term> [source] [time_range]"
        return 1
    fi

    echo "Searching for '$search_term' in logs..."

    find_cmd="find $LOG_DIR"
    if [ -n "$log_source" ]; then
        find_cmd="$find_cmd/$log_source"
    fi
    find_cmd="$find_cmd -name \"*.log\" -type f"

    if [ -n "$time_range" ]; then
        case "$time_range" in
            today)
                find_cmd="$find_cmd -newermt \$(date +%Y-%m-%d)"
                ;;
            yesterday)
                find_cmd="$find_cmd -newermt \$(date -d yesterday +%Y-%m-%d) ! -newermt \$(date +%Y-%m-%d)"
                ;;
            week)
                find_cmd="$find_cmd -newermt \$(date -d '7 days ago' +%Y-%m-%d)"
                ;;
            month)
                find_cmd="$find_cmd -newermt \$(date -d '30 days ago' +%Y-%m-%d)"
                ;;
        esac
    fi

    eval "$find_cmd -exec grep -l \"$search_term\" {} \;" | while read -r file; do
        echo "Found in: $file"
        grep -n "$search_term" "$file" | head -5
        echo "---"
    done
}

function export_logs() {
    local export_dir="$1"
    local start_date="$2"
    local end_date="$3"

    if [ -z "$export_dir" ]; then
        export_dir="./logs/export/$(date +%Y%m%d_%H%M%S)"
    fi

    mkdir -p "$export_dir"

    echo "Exporting logs to $export_dir..."

    find "$LOG_DIR" -name "*.log" -type f | while read -r file; do
        file_date=$(stat -c %y "$file" | cut -d' ' -f1 2>/dev/null || stat -f %Sm -t %Y-%m-%d "$file" 2>/dev/null)

        if [ -n "$start_date" ] && [ "$file_date" \< "$start_date" ]; then
            continue
        fi

        if [ -n "$end_date" ] && [ "$file_date" \> "$end_date" ]; then
            continue
        fi

        relative_path="${file#$LOG_DIR/}"
        export_path="$export_dir/$relative_path"

        mkdir -p "$(dirname "$export_path")"
        cp "$file" "$export_path"
    done

    if [ -n "$start_date" ] || [ -n "$end_date" ]; then
        tar -czf "${export_dir}.tar.gz" -C "$(dirname "$export_dir")" "$(basename "$export_dir")"
        rm -rf "$export_dir"
        echo "Logs exported to ${export_dir}.tar.gz"
    else
        echo "Logs exported to $export_dir"
    fi
}

function monitor_logs() {
    echo "Monitoring logs in real-time..."
    echo "Press Ctrl+C to stop"

    tail -f "$LOG_DIR"/*/*.log 2>/dev/null || echo "No log files found to monitor"
}

function cleanup_logs() {
    echo "Cleaning up old log files (retention: ${RETENTION_DAYS} days)..."

    find "$LOG_DIR" -name "*.log" -mtime +"$RETENTION_DAYS" -delete
    find "$ARCHIVE_DIR" -name "*.gz" -mtime +"$((RETENTION_DAYS * 2))" -delete
    find "$ANALYSIS_DIR" -name "*.txt" -mtime +"$((RETENTION_DAYS * 3))" -delete

    echo "Log cleanup completed"
}

function show_log_stats() {
    echo "=== Log Statistics ==="
    echo "Log Directory: $LOG_DIR"
    echo "Archive Directory: $ARCHIVE_DIR"
    echo "Analysis Directory: $ANALYSIS_DIR"
    echo ""

    echo "Current log files:"
    find "$LOG_DIR" -name "*.log" -type f | while read -r file; do
        size=$(du -h "$file" | cut -f1)
        lines=$(wc -l < "$file")
        echo "  $file: $size, $lines lines"
    done

    echo ""
    echo "Archived logs:"
    find "$ARCHIVE_DIR" -name "*.gz" | wc -l | xargs echo "  Compressed files:"

    echo ""
    echo "Disk usage:"
    du -sh "$LOG_DIR" "$ARCHIVE_DIR" "$ANALYSIS_DIR" 2>/dev/null || echo "  Unable to calculate disk usage"
}

function show_help() {
    echo "Usage: $0 [command] [options]"
    echo "Commands:"
    echo "  rotate     Rotate log files if they exceed max size"
    echo "  compress   Compress old log archives"
    echo "  analyze    Generate log analysis report"
    echo "  search <term> [source] [time]  Search logs for a term"
    echo "  export [dir] [start_date] [end_date]  Export logs to directory"
    echo "  monitor    Monitor logs in real-time"
    echo "  cleanup    Clean up old log files"
    echo "  stats      Show log statistics"
    echo "  setup      Setup log directories and configuration"
    echo "  help       Show this help message"
    echo ""
    echo "Time ranges: today, yesterday, week, month"
    echo "Sources: app, api, db, nginx, monitoring"
}

setup_log_directories
create_log_config

case "$1" in
    rotate)
        rotate_logs
        ;;
    compress)
        compress_old_logs
        ;;
    analyze)
        analyze_logs
        ;;
    search)
        search_logs "$2" "$3" "$4"
        ;;
    export)
        export_logs "$2" "$3" "$4"
        ;;
    monitor)
        monitor_logs
        ;;
    cleanup)
        cleanup_logs
        ;;
    stats)
        show_log_stats
        ;;
    setup)
        setup_log_directories
        create_log_config
        ;;
    help|*)
        show_help
        ;;
esac