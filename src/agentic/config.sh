#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
CONFIG_DIR="./config"
BACKUP_DIR="./config/backups"
TEMPLATE_DIR="./config/templates"
ENV_FILE=".env"
CONFIG_FILE="./config/app-config.json"
VALIDATION_FILE="./config/validation-rules.json"

function setup_config_directories() {
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$TEMPLATE_DIR"
    mkdir -p "$CONFIG_DIR/environments"
    mkdir -p "$CONFIG_DIR/services"
    mkdir -p "$CONFIG_DIR/secrets"
}

function create_env_template() {
    if [ ! -f "$TEMPLATE_DIR/.env.template" ]; then
        cat > "$TEMPLATE_DIR/.env.template" << 'EOF'
# ClawManager Environment Configuration
# Copy this file to .env and fill in your values

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/clawmanager
DATABASE_SSL=true
DATABASE_MAX_CONNECTIONS=20

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# API Configuration
API_PORT=3001
API_HOST=0.0.0.0
API_RATE_LIMIT=1000
API_TIMEOUT=30000

# Web3 Configuration
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-project-id
WEB3_PRIVATE_KEY=your-private-key
WEB3_CHAIN_ID=1

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Monitoring
SENTRY_DSN=https://your-dsn@sentry.io/project-id
LOG_LEVEL=info
METRICS_ENABLED=true

# Security
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
SESSION_SECRET=your-session-secret
CSRF_SECRET=your-csrf-secret

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
UPLOAD_DIR=./uploads

# External APIs
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
EOF
    fi
}

function create_app_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        cat > "$CONFIG_FILE" << EOF
{
  "app": {
    "name": "ClawManager",
    "version": "1.0.0",
    "environment": "development",
    "debug": true,
    "timezone": "UTC"
  },
  "server": {
    "host": "0.0.0.0",
    "port": 3001,
    "ssl": {
      "enabled": false,
      "key": "./ssl/private.key",
      "cert": "./ssl/certificate.crt"
    },
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:3000"],
      "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      "headers": ["Content-Type", "Authorization"]
    },
    "rateLimit": {
      "enabled": true,
      "windowMs": 900000,
      "max": 1000
    }
  },
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "clawmanager",
    "ssl": true,
    "pool": {
      "min": 2,
      "max": 20,
      "idleTimeoutMillis": 30000,
      "connectionTimeoutMillis": 2000
    }
  },
  "cache": {
    "enabled": true,
    "type": "redis",
    "host": "localhost",
    "port": 6379,
    "ttl": 3600,
    "prefix": "clawmanager:"
  },
  "authentication": {
    "jwt": {
      "secret": "change-this-in-production",
      "expiresIn": "24h",
      "refreshTokenExpiresIn": "7d"
    },
    "bcrypt": {
      "rounds": 12
    },
    "oauth": {
      "google": {
        "clientId": "",
        "clientSecret": "",
        "redirectUrl": ""
      },
      "github": {
        "clientId": "",
        "clientSecret": "",
        "redirectUrl": ""
      }
    }
  },
  "web3": {
    "enabled": true,
    "provider": "https://mainnet.infura.io/v3/",
    "chainId": 1,
    "gasLimit": 2000000,
    "gasPrice": "auto"
  },
  "monitoring": {
    "enabled": true,
    "sentry": {
      "dsn": "",
      "environment": "development"
    },
    "metrics": {
      "enabled": true,
      "port": 9090,
      "path": "/metrics"
    },
    "healthCheck": {
      "enabled": true,
      "path": "/health",
      "timeout": 5000
    }
  },
  "logging": {
    "level": "info",
    "format": "json",
    "files": {
      "app": "./logs/app.log",
      "error": "./logs/error.log",
      "access": "./logs/access.log"
    },
    "rotation": {
      "enabled": true,
      "maxSize": "100m",
      "maxFiles": 10
    }
  },
  "features": {
    "ai_agents": true,
    "web3_integration": true,
    "marketplace": true,
    "real_time_updates": true,
    "file_upload": true,
    "notifications": true
  }
}
EOF
    fi
}

function create_validation_rules() {
    if [ ! -f "$VALIDATION_FILE" ]; then
        cat > "$VALIDATION_FILE" << EOF
{
  "rules": {
    "database_url": {
      "required": true,
      "pattern": "^postgresql://.+:.+@.+:\\d+/.+$",
      "message": "Database URL must be a valid PostgreSQL connection string"
    },
    "supabase_url": {
      "required": true,
      "pattern": "^https://[a-zA-Z0-9-]+\\.supabase\\.co$",
      "message": "Supabase URL must be a valid Supabase project URL"
    },
    "jwt_secret": {
      "required": true,
      "minLength": 32,
      "message": "JWT secret must be at least 32 characters long"
    },
    "api_port": {
      "required": true,
      "pattern": "^\\d+$",
      "range": [1024, 65535],
      "message": "API port must be a number between 1024 and 65535"
    },
    "web3_provider_url": {
      "required": false,
      "pattern": "^https?://.+",
      "message": "Web3 provider URL must be a valid HTTP/HTTPS URL"
    },
    "email": {
      "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "message": "Must be a valid email address"
    },
    "url": {
      "pattern": "^https?://.+",
      "message": "Must be a valid HTTP/HTTPS URL"
    }
  },
  "environments": {
    "development": {
      "debug": true,
      "log_level": "debug",
      "cors_origins": ["http://localhost:3000", "http://localhost:3001"]
    },
    "staging": {
      "debug": false,
      "log_level": "info",
      "cors_origins": ["https://staging.clawmanager.com"]
    },
    "production": {
      "debug": false,
      "log_level": "warn",
      "cors_origins": ["https://clawmanager.com"]
    }
  }
}
EOF
    fi
}

function validate_config() {
    local config_file="$1"

    if [ ! -f "$config_file" ]; then
        echo "Configuration file not found: $config_file"
        return 1
    fi

    echo "Validating configuration..."

    if command -v jq &> /dev/null; then
        if jq empty "$config_file" 2>/dev/null; then
            echo "✓ JSON syntax is valid"
        else
            echo "✗ JSON syntax is invalid"
            return 1
        fi
    else
        echo "! jq not found, skipping JSON validation"
    fi

    if [ -f "$VALIDATION_FILE" ] && command -v jq &> /dev/null; then
        local rules=$(jq -r '.rules | keys[]' "$VALIDATION_FILE" 2>/dev/null)

        for rule in $rules; do
            local required=$(jq -r ".rules.\"$rule\".required" "$VALIDATION_FILE" 2>/dev/null)
            local pattern=$(jq -r ".rules.\"$rule\".pattern" "$VALIDATION_FILE" 2>/dev/null)
            local value=$(jq -r ".$rule" "$config_file" 2>/dev/null)

            if [ "$required" = "true" ] && [ "$value" = "null" ]; then
                echo "✗ Required field missing: $rule"
                return 1
            fi

            if [ -n "$pattern" ] && [ "$value" != "null" ]; then
                if ! echo "$value" | grep -qE "$pattern"; then
                    local message=$(jq -r ".rules.\"$rule\".message" "$VALIDATION_FILE" 2>/dev/null)
                    echo "✗ Validation failed for $rule: $message"
                    return 1
                fi
            fi
        done
    fi

    echo "✓ Configuration validation passed"
}

function backup_config() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/config_backup_$timestamp.tar.gz"

    echo "Creating configuration backup..."

    tar -czf "$backup_file" -C . \
        "${ENV_FILE#.}" \
        "${CONFIG_FILE#./}" \
        "${VALIDATION_FILE#./}" \
        2>/dev/null || true

    echo "Configuration backed up to: $backup_file"
}

function restore_config() {
    local backup_file="$1"

    if [ -z "$backup_file" ]; then
        echo "Available backups:"
        ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
        return 1
    fi

    if [ ! -f "$backup_file" ]; then
        echo "Backup file not found: $backup_file"
        return 1
    fi

    echo "Restoring configuration from $backup_file..."

    tar -xzf "$backup_file" -C .

    echo "Configuration restored"
}

function generate_env_from_template() {
    if [ ! -f "$ENV_FILE" ] && [ -f "$TEMPLATE_DIR/.env.template" ]; then
        cp "$TEMPLATE_DIR/.env.template" "$ENV_FILE"
        echo "Generated .env file from template"
        echo "Please edit $ENV_FILE with your actual values"
    else
        echo ".env file already exists or template not found"
    fi
}

function show_config_diff() {
    local file1="$1"
    local file2="$2"

    if [ ! -f "$file1" ] || [ ! -f "$file2" ]; then
        echo "Both files must exist for diff"
        return 1
    fi

    if command -v diff &> /dev/null; then
        diff -u "$file1" "$file2" || true
    else
        echo "diff command not available"
    fi
}

function merge_configs() {
    local source="$1"
    local target="$2"

    if [ ! -f "$source" ] || [ ! -f "$target" ]; then
        echo "Both source and target files must exist"
        return 1
    fi

    if command -v jq &> /dev/null; then
        jq -s '.[0] * .[1]' "$target" "$source" > "${target}.tmp" && mv "${target}.tmp" "$target"
        echo "Configurations merged successfully"
    else
        echo "jq required for config merging"
        return 1
    fi
}

function encrypt_secrets() {
    local input_file="$1"
    local output_file="$2"
    local key="$3"

    if [ -z "$key" ]; then
        echo "Encryption key required"
        return 1
    fi

    if command -v openssl &> /dev/null; then
        openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" -k "$key"
        echo "Secrets encrypted to $output_file"
    else
        echo "openssl required for encryption"
        return 1
    fi
}

function decrypt_secrets() {
    local input_file="$1"
    local output_file="$2"
    local key="$3"

    if [ -z "$key" ]; then
        echo "Decryption key required"
        return 1
    fi

    if command -v openssl &> /dev/null; then
        openssl enc -d -aes-256-cbc -in "$input_file" -out "$output_file" -k "$key"
        echo "Secrets decrypted to $output_file"
    else
        echo "openssl required for decryption"
        return 1
    fi
}

function show_config_status() {
    echo "=== Configuration Status ==="
    echo "Config Directory: $CONFIG_DIR"
    echo "Backup Directory: $BACKUP_DIR"
    echo "Template Directory: $TEMPLATE_DIR"
    echo ""

    echo "Configuration Files:"
    [ -f "$ENV_FILE" ] && echo "✓ $ENV_FILE ($(du -h "$ENV_FILE" | cut -f1))" || echo "✗ $ENV_FILE (missing)"
    [ -f "$CONFIG_FILE" ] && echo "✓ $CONFIG_FILE ($(du -h "$CONFIG_FILE" | cut -f1))" || echo "✗ $CONFIG_FILE (missing)"
    [ -f "$VALIDATION_FILE" ] && echo "✓ $VALIDATION_FILE ($(du -h "$VALIDATION_FILE" | cut -f1))" || echo "✗ $VALIDATION_FILE (missing)"

    echo ""
    echo "Template Files:"
    ls -la "$TEMPLATE_DIR" 2>/dev/null | grep -v '^total' | sed 's/^/  /' || echo "  No templates found"

    echo ""
    echo "Backup Files:"
    ls -la "$BACKUP_DIR" 2>/dev/null | grep -v '^total' | wc -l | xargs echo "  Total backups:"

    echo ""
    echo "Environment Variables:"
    if [ -f "$ENV_FILE" ]; then
        grep -c '^[^#]' "$ENV_FILE" | xargs echo "  Total variables:"
        grep -c '^#' "$ENV_FILE" | xargs echo "  Commented lines:"
    fi
}

function show_help() {
    echo "Usage: $0 [command] [options]"
    echo "Commands:"
    echo "  setup          Setup configuration directories and files"
    echo "  validate [file] Validate configuration file"
    echo "  backup         Create configuration backup"
    echo "  restore <file> Restore configuration from backup"
    echo "  generate-env   Generate .env file from template"
    echo "  diff <file1> <file2> Show diff between config files"
    echo "  merge <source> <target> Merge source config into target"
    echo "  encrypt <input> <output> <key> Encrypt secrets file"
    echo "  decrypt <input> <output> <key> Decrypt secrets file"
    echo "  status         Show configuration status"
    echo "  help           Show this help message"
}

setup_config_directories

case "$1" in
    setup)
        create_env_template
        create_app_config
        create_validation_rules
        ;;
    validate)
        validate_config "${2:-$CONFIG_FILE}"
        ;;
    backup)
        backup_config
        ;;
    restore)
        restore_config "$2"
        ;;
    generate-env)
        generate_env_from_template
        ;;
    diff)
        show_config_diff "$2" "$3"
        ;;
    merge)
        merge_configs "$2" "$3"
        ;;
    encrypt)
        encrypt_secrets "$2" "$3" "$4"
        ;;
    decrypt)
        decrypt_secrets "$2" "$3" "$4"
        ;;
    status)
        show_config_status
        ;;
    help|*)
        show_help
        ;;
esac