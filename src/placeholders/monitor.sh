#!/bin/bash

PROJECT_NAME="clawmanager"
LOG_FILE="./logs/monitor.log"
ALERT_FILE="./logs/alerts.log"
METRICS_FILE="./logs/metrics.log"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=80
THRESHOLD_DISK=90
MONITOR_INTERVAL=60

function log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

function alert_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: $1" | tee -a "$ALERT_FILE"
}

function collect_system_metrics() {
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    LOAD_AVERAGE=$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | xargs)
    
    echo "$(date '+%Y-%m-%d %H:%M:%S'),$CPU_USAGE,$MEMORY_USAGE,$DISK_USAGE,$LOAD_AVERAGE" >> "$METRICS_FILE"
}

function check_cpu_usage() {
    CPU_USAGE=$(echo "$1" | awk '{print int($1)}')
    if [ "$CPU_USAGE" -gt "$THRESHOLD_CPU" ]; then
        alert_message "High CPU usage: ${CPU_USAGE}%"
    fi
}

function check_memory_usage() {
    MEMORY_USAGE=$(echo "$1" | awk '{print int($1)}')
    if [ "$MEMORY_USAGE" -gt "$THRESHOLD_MEMORY" ]; then
        alert_message "High memory usage: ${MEMORY_USAGE}%"
    fi
}

function check_disk_usage() {
    DISK_USAGE="$1"
    if [ "$DISK_USAGE" -gt "$THRESHOLD_DISK" ]; then
        alert_message "High disk usage: ${DISK_USAGE}%"
    fi
}

function check_services() {
    if command -v docker-compose &> /dev/null; then
        if ! docker-compose ps | grep -q "Up"; then
            alert_message "Some Docker services are not running"
        fi
    fi
    
    if command -v systemctl &> /dev/null; then
        if ! systemctl is-active --quiet postgresql; then
            alert_message "PostgreSQL service is not running"
        fi
        if ! systemctl is-active --quiet redis-server; then
            alert_message "Redis service is not running"
        fi
    fi
}

function check_network() {
    if ! ping -c 1 google.com &> /dev/null; then
        alert_message "Network connectivity issue"
    fi
}

function check_application_health() {
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_message "Application health check passed"
    else
        alert_message "Application health check failed"
    fi
}

function check_database_connections() {
    if command -v psql &> /dev/null; then
        CONNECTIONS=$(psql -h localhost -U postgres -d clawmanager -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null)
        if [ $? -eq 0 ]; then
            log_message "Database connections: $CONNECTIONS"
            if [ "$CONNECTIONS" -gt 100 ]; then
                alert_message "High number of database connections: $CONNECTIONS"
            fi
        else
            alert_message "Database connection check failed"
        fi
    fi
}

function check_redis_memory() {
    if command -v redis-cli &> /dev/null; then
        REDIS_MEMORY=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | xargs)
        log_message "Redis memory usage: $REDIS_MEMORY"
    fi
}

function rotate_logs() {
    if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt 10485760 ]; then
        mv "$LOG_FILE" "$LOG_FILE.$(date '+%Y%m%d_%H%M%S')"
        touch "$LOG_FILE"
        log_message "Log file rotated"
    fi
}

function generate_report() {
    REPORT_FILE="./logs/daily_report_$(date '+%Y%m%d').txt"
    echo "Daily Monitoring Report - $(date)" > "$REPORT_FILE"
    echo "=================================" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "System Metrics Summary:" >> "$REPORT_FILE"
    tail -n 10 "$METRICS_FILE" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "Alerts Summary:" >> "$REPORT_FILE"
    if [ -f "$ALERT_FILE" ]; then
        tail -n 20 "$ALERT_FILE" >> "$REPORT_FILE"
    else
        echo "No alerts today" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
    
    echo "Service Status:" >> "$REPORT_FILE"
    if command -v docker-compose &> /dev/null; then
        docker-compose ps >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
    
    log_message "Daily report generated: $REPORT_FILE"
}

function cleanup_old_files() {
    find ./logs -name "*.log.*" -mtime +30 -delete
    find ./logs -name "daily_report_*.txt" -mtime +90 -delete
    log_message "Old log files cleaned up"
}

function send_email_alert() {
    if command -v mail &> /dev/null && [ -n "$ADMIN_EMAIL" ]; then
        echo "$1" | mail -s "ClawManager Alert" "$ADMIN_EMAIL"
    fi
}

function monitor_once() {
    collect_system_metrics
    METRICS=$(tail -n 1 "$METRICS_FILE")
    CPU=$(echo "$METRICS" | cut -d, -f2)
    MEMORY=$(echo "$METRICS" | cut -d, -f3)
    DISK=$(echo "$METRICS" | cut -d, -f4)
    
    check_cpu_usage "$CPU"
    check_memory_usage "$MEMORY"
    check_disk_usage "$DISK"
    check_services
    check_network
    check_application_health
    check_database_connections
    check_redis_memory
    
    log_message "Monitoring cycle completed"
}

function monitor_continuous() {
    log_message "Starting continuous monitoring (interval: ${MONITOR_INTERVAL}s)"
    while true; do
        monitor_once
        rotate_logs
        sleep "$MONITOR_INTERVAL"
    done
}

function show_status() {
    echo "=== ClawManager Monitoring Status ==="
    echo "Log file: $LOG_FILE"
    echo "Alerts file: $ALERT_FILE"
    echo "Metrics file: $METRICS_FILE"
    echo ""
    echo "Recent metrics:"
    tail -n 5 "$METRICS_FILE" 2>/dev/null || echo "No metrics collected yet"
    echo ""
    echo "Recent alerts:"
    tail -n 5 "$ALERT_FILE" 2>/dev/null || echo "No alerts yet"
    echo ""
    echo "Service status:"
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        echo "Docker Compose not available"
    fi
}

function show_help() {
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  start     Start continuous monitoring"
    echo "  stop      Stop continuous monitoring"
    echo "  once      Run monitoring checks once"
    echo "  status    Show current monitoring status"
    echo "  report    Generate daily report"
    echo "  cleanup   Clean up old log files"
    echo "  help      Show this help message"
}

mkdir -p ./logs

case "$1" in
    start)
        if [ -f /tmp/monitor.pid ] && kill -0 $(cat /tmp/monitor.pid) 2>/dev/null; then
            echo "Monitoring is already running (PID: $(cat /tmp/monitor.pid))"
            exit 1
        fi
        monitor_continuous &
        echo $! > /tmp/monitor.pid
        echo "Monitoring started (PID: $!)"
        ;;
    stop)
        if [ -f /tmp/monitor.pid ]; then
            kill $(cat /tmp/monitor.pid) 2>/dev/null && rm /tmp/monitor.pid
            echo "Monitoring stopped"
        else
            echo "Monitoring is not running"
        fi
        ;;
    once)
        monitor_once
        ;;
    status)
        show_status
        ;;
    report)
        generate_report
        ;;
    cleanup)
        cleanup_old_files
        ;;
    help|*)
        show_help
        ;;
esac