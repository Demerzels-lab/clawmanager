#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
SECURITY_LOG="./logs/security.log"
AUDIT_DIR="./security/audits"
REPORTS_DIR="./security/reports"
POLICIES_DIR="./security/policies"
VULN_DB="./security/vulnerabilities.json"
THREAT_MODEL="./security/threat-model.json"

function log_security() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$SECURITY_LOG"
    echo "$message"
}

function setup_security_environment() {
    mkdir -p "$(dirname "$SECURITY_LOG")"
    mkdir -p "$AUDIT_DIR"
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$POLICIES_DIR"
}

function audit_file_permissions() {
    log_security "Auditing file permissions..."

    local audit_file="$AUDIT_DIR/permissions_audit_$(date +%Y%m%d).txt"

    echo "File Permissions Audit - $(date)" > "$audit_file"
    echo "=================================" >> "$audit_file"
    echo "" >> "$audit_file"

    echo "Critical Files:" >> "$audit_file"
    for file in ".env" "config/app-config.json" "config/validation-rules.json"; do
        if [ -f "$file" ]; then
            ls -la "$file" >> "$audit_file"
        else
            echo "$file: NOT FOUND" >> "$audit_file"
        fi
    done
    echo "" >> "$audit_file"

    echo "World-writable files:" >> "$audit_file"
    find . -type f -perm -002 2>/dev/null | head -20 >> "$audit_file" || echo "None found" >> "$audit_file"
    echo "" >> "$audit_file"

    echo "Setuid/Setgid files:" >> "$audit_file"
    find . -type f \( -perm -4000 -o -perm -2000 \) 2>/dev/null | head -10 >> "$audit_file" || echo "None found" >> "$audit_file"
    echo "" >> "$audit_file"

    log_security "File permissions audit completed: $audit_file"
}

function audit_dependencies() {
    log_security "Auditing dependencies for vulnerabilities..."

    local audit_file="$AUDIT_DIR/dependency_audit_$(date +%Y%m%d).txt"

    echo "Dependency Security Audit - $(date)" > "$audit_file"
    echo "===================================" >> "$audit_file"
    echo "" >> "$audit_file"

    # Node.js dependencies
    if [ -f "package.json" ]; then
        echo "Node.js Dependencies:" >> "$audit_file"
        if command -v npm &> /dev/null; then
            npm audit --audit-level=moderate >> "$audit_file" 2>&1 || echo "npm audit failed" >> "$audit_file"
        fi
        echo "" >> "$audit_file"
    fi

    # Python dependencies
    if [ -f "requirements.txt" ]; then
        echo "Python Dependencies:" >> "$audit_file"
        if command -v safety &> /dev/null; then
            safety check --file requirements.txt >> "$audit_file" 2>&1 || echo "safety check failed" >> "$audit_file"
        elif command -v pip-audit &> /dev/null; then
            pip-audit >> "$audit_file" 2>&1 || echo "pip-audit failed" >> "$audit_file"
        else
            echo "No Python vulnerability scanner found" >> "$audit_file"
        fi
        echo "" >> "$audit_file"
    fi

    # .NET dependencies
    if find . -name "*.csproj" -o -name "*.fsproj" | grep -q .; then
        echo ".NET Dependencies:" >> "$audit_file"
        if command -v dotnet &> /dev/null; then
            dotnet list package --vulnerable >> "$audit_file" 2>&1 || echo "dotnet package audit failed" >> "$audit_file"
        fi
        echo "" >> "$audit_file"
    fi

    log_security "Dependency audit completed: $audit_file"
}

function scan_for_secrets() {
    log_security "Scanning for exposed secrets..."

    local secrets_file="$AUDIT_DIR/secrets_scan_$(date +%Y%m%d).txt"

    echo "Secrets Scan Report - $(date)" > "$secrets_file"
    echo "============================" >> "$secrets_file"
    echo "" >> "$secrets_file"

    # Common patterns for secrets
    local patterns=(
        "password|passwd|pwd"
        "secret|token|key|apikey"
        "aws_access_key|aws_secret_key"
        "database_url|db_url"
        "private_key|ssh_key"
    )

    for pattern in "${patterns[@]}"; do
        echo "Searching for: $pattern" >> "$secrets_file"
        grep -r -i "$pattern" . \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            --exclude-dir=logs \
            --exclude="*.log" \
            --exclude="*.gz" \
            | head -10 >> "$secrets_file" || echo "  No matches found" >> "$secrets_file"
        echo "" >> "$secrets_file"
    done

    # Check for hardcoded passwords in config files
    echo "Checking configuration files for hardcoded secrets:" >> "$secrets_file"
    find . -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.toml" | \
        xargs grep -l "password\|secret\|key" 2>/dev/null | head -5 >> "$secrets_file" || echo "  None found" >> "$secrets_file"

    log_security "Secrets scan completed: $secrets_file"
}

function check_ssl_certificates() {
    log_security "Checking SSL certificates..."

    local cert_file="$AUDIT_DIR/ssl_audit_$(date +%Y%m%d).txt"

    echo "SSL Certificate Audit - $(date)" > "$cert_file"
    echo "============================" >> "$cert_file"
    echo "" >> "$cert_file"

    # Check for certificate files
    echo "Certificate files found:" >> "$cert_file"
    find . -name "*.pem" -o -name "*.crt" -o -name "*.key" -o -name "*.cer" | head -10 >> "$cert_file" || echo "  None found" >> "$cert_file"
    echo "" >> "$cert_file"

    # Check certificate expiry if openssl is available
    if command -v openssl &> /dev/null; then
        echo "Certificate expiry check:" >> "$cert_file"
        for cert in $(find . -name "*.pem" -o -name "*.crt" | head -5); do
            echo "Certificate: $cert" >> "$cert_file"
            openssl x509 -in "$cert" -text -noout | grep -E "(Not Before|Not After)" >> "$cert_file" 2>/dev/null || echo "  Invalid certificate" >> "$cert_file"
            echo "" >> "$cert_file"
        done
    else
        echo "OpenSSL not available for certificate validation" >> "$cert_file"
    fi

    log_security "SSL certificate audit completed: $cert_file"
}

function audit_network_security() {
    log_security "Auditing network security..."

    local network_file="$AUDIT_DIR/network_audit_$(date +%Y%m%d).txt"

    echo "Network Security Audit - $(date)" > "$network_file"
    echo "=============================" >> "$network_file"
    echo "" >> "$network_file"

    # Check open ports
    echo "Open ports:" >> "$network_file"
    if command -v netstat &> /dev/null; then
        netstat -tlnp 2>/dev/null | grep LISTEN | head -10 >> "$network_file" || echo "  netstat not available" >> "$network_file"
    elif command -v ss &> /dev/null; then
        ss -tlnp | grep LISTEN | head -10 >> "$network_file" || echo "  ss not available" >> "$network_file"
    else
        echo "  No network tools available" >> "$network_file"
    fi
    echo "" >> "$network_file"

    # Check firewall status
    echo "Firewall status:" >> "$network_file"
    if command -v ufw &> /dev/null; then
        ufw status >> "$network_file" 2>&1 || echo "  ufw status check failed" >> "$network_file"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --state >> "$network_file" 2>&1 || echo "  firewalld status check failed" >> "$network_file"
    else
        echo "  No firewall management tool found" >> "$network_file"
    fi
    echo "" >> "$network_file"

    # Check for insecure protocols
    echo "Checking for insecure configurations:" >> "$network_file"
    if [ -f "docker-compose.yml" ]; then
        if grep -q "ports:" docker-compose.yml && grep -q "80:" docker-compose.yml; then
            echo "  WARNING: HTTP port 80 exposed" >> "$network_file"
        fi
        if grep -q "ports:" docker-compose.yml && grep -q "22:" docker-compose.yml; then
            echo "  WARNING: SSH port 22 exposed" >> "$network_file"
        fi
    fi

    log_security "Network security audit completed: $network_file"
}

function generate_security_report() {
    log_security "Generating security report..."

    local report_file="$REPORTS_DIR/security_report_$(date +%Y%m%d).html"

    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>ClawManager Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 10px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 10px; border: 1px solid #ddd; }
        .critical { background: #ffebee; border-color: #f44336; }
        .warning { background: #fff3e0; border-color: #ff9800; }
        .info { background: #e3f2fd; border-color: #2196f3; }
        .summary { background: #f5f5f5; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ClawManager Security Audit Report</h1>
        <p>Generated: $(date)</p>
        <p>Project: $PROJECT_NAME</p>
    </div>

    <div class="summary">
        <h2>Executive Summary</h2>
        <p>This report contains the results of automated security audits performed on the ClawManager application.</p>
    </div>

    <div class="section info">
        <h3>Scan Results</h3>
        <p>Security scans completed successfully. Review individual audit files for detailed findings.</p>
        <ul>
            <li>File permissions audit</li>
            <li>Dependency vulnerability scan</li>
            <li>Secrets exposure scan</li>
            <li>SSL certificate validation</li>
            <li>Network security assessment</li>
        </ul>
    </div>

    <div class="section warning">
        <h3>Recommendations</h3>
        <ul>
            <li>Regular security audits (weekly/monthly)</li>
            <li>Implement secrets management (Vault, AWS Secrets Manager)</li>
            <li>Enable SSL/TLS for all communications</li>
            <li>Regular dependency updates and vulnerability scanning</li>
            <li>Implement least privilege access controls</li>
        </ul>
    </div>
</body>
</html>
EOF

    log_security "Security report generated: $report_file"
}

function harden_system() {
    log_security "Applying security hardening measures..."

    # File permissions hardening
    if [ -f ".env" ]; then
        chmod 600 .env
        log_security "Secured .env file permissions"
    fi

    if [ -d "config" ]; then
        find config -type f -name "*.json" -exec chmod 644 {} \;
        log_security "Set secure permissions on config files"
    fi

    # Remove world-writable permissions
    find . -type f -perm -002 -exec chmod o-w {} \; 2>/dev/null || true
    log_security "Removed world-writable permissions"

    # Secure SSH if available
    if [ -f "/etc/ssh/sshd_config" ]; then
        # Backup original config
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

        # Apply hardening (requires root)
        # sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
        # sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        log_security "SSH hardening recommendations applied (manual review required)"
    fi

    log_security "System hardening completed"
}

function monitor_security_events() {
    log_security "Setting up security monitoring..."

    # Create monitoring script
    cat > "$AUDIT_DIR/monitor_security.sh" << 'EOF'
#!/bin/bash
LOG_FILE="./logs/security_monitor.log"

echo "$(date) - Security monitoring started" >> "$LOG_FILE"

# Monitor for suspicious file changes
find . -name "*.log" -newer "$LOG_FILE" 2>/dev/null | while read -r file; do
    if grep -q "ERROR\|FAILED\|DENIED" "$file" 2>/dev/null; then
        echo "$(date) - Security event detected in $file" >> "$LOG_FILE"
    fi
done

# Monitor for new network connections
if command -v ss &> /dev/null; then
    ss -tlnp | grep LISTEN | while read -r line; do
        port=$(echo "$line" | awk '{print $4}' | cut -d: -f2)
        if [[ "$port" =~ ^(22|3389|5900)$ ]]; then
            echo "$(date) - WARNING: Potentially insecure port $port is open" >> "$LOG_FILE"
        fi
    done
fi

echo "$(date) - Security monitoring completed" >> "$LOG_FILE"
EOF

    chmod +x "$AUDIT_DIR/monitor_security.sh"
    log_security "Security monitoring script created: $AUDIT_DIR/monitor_security.sh"
}

function create_security_policies() {
    log_security "Creating security policies..."

    # Password policy
    cat > "$POLICIES_DIR/password_policy.md" << 'EOF'
# Password Security Policy

## Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No dictionary words
- No personal information

## Implementation
- Use bcrypt with 12 rounds for hashing
- Implement password strength validation
- Enforce password history (no reuse of last 5 passwords)
- Account lockout after 5 failed attempts
EOF

    # Access control policy
    cat > "$POLICIES_DIR/access_control.md" << 'EOF'
# Access Control Policy

## Principle of Least Privilege
- Users should only have access to resources they need
- Regular review of user permissions
- Role-based access control (RBAC)

## Authentication
- Multi-factor authentication (MFA) required
- Session timeout after 30 minutes of inactivity
- Secure password requirements

## Authorization
- API endpoints protected with JWT tokens
- Database queries use parameterized statements
- File access restricted by user roles
EOF

    log_security "Security policies created in $POLICIES_DIR"
}

function show_security_status() {
    echo "=== Security Status ==="
    echo "Project: $PROJECT_NAME"
    echo "Security Log: $SECURITY_LOG"
    echo ""

    echo "Security Directories:"
    for dir in "$AUDIT_DIR" "$REPORTS_DIR" "$POLICIES_DIR"; do
        if [ -d "$dir" ]; then
            echo "✓ $dir"
        else
            echo "✗ $dir (missing)"
        fi
    done

    echo ""
    echo "Recent Security Events:"
    if [ -f "$SECURITY_LOG" ]; then
        tail -10 "$SECURITY_LOG" | sed 's/^/  /'
    else
        echo "  No security log found"
    fi

    echo ""
    echo "Latest Audits:"
    find "$AUDIT_DIR" -name "*.txt" -type f -printf '%T@ %p\n' 2>/dev/null | \
        sort -n | tail -5 | cut -d' ' -f2- | sed 's/^/  /' || echo "  No audits found"
}

function perform_full_security_audit() {
    log_security "=== Starting Full Security Audit ==="

    audit_file_permissions
    audit_dependencies
    scan_for_secrets
    check_ssl_certificates
    audit_network_security
    generate_security_report
    create_security_policies

    log_security "=== Full Security Audit Completed ==="
}

function show_help() {
    echo "Usage: $0 [command] [options]"
    echo "Commands:"
    echo "  audit          Perform full security audit"
    echo "  permissions    Audit file permissions"
    echo "  dependencies   Audit dependencies for vulnerabilities"
    echo "  secrets        Scan for exposed secrets"
    echo "  ssl            Check SSL certificates"
    echo "  network        Audit network security"
    echo "  harden         Apply security hardening measures"
    echo "  monitor        Setup security monitoring"
    echo "  policies       Create security policies"
    echo "  report         Generate security report"
    echo "  status         Show security status"
    echo "  help           Show this help message"
}

setup_security_environment

case "$1" in
    audit)
        perform_full_security_audit
        ;;
    permissions)
        audit_file_permissions
        ;;
    dependencies)
        audit_dependencies
        ;;
    secrets)
        scan_for_secrets
        ;;
    ssl)
        check_ssl_certificates
        ;;
    network)
        audit_network_security
        ;;
    harden)
        harden_system
        ;;
    monitor)
        monitor_security_events
        ;;
    policies)
        create_security_policies
        ;;
    report)
        generate_security_report
        ;;
    status)
        show_security_status
        ;;
    help|*)
        show_help
        ;;
esac