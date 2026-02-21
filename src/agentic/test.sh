#!/bin/bash

set -e

PROJECT_NAME="clawmanager"
TEST_RESULTS_DIR="./test-results"
COVERAGE_DIR="./coverage"
LOG_DIR="./logs"
ENV_FILE=".env"

function setup_test_environment() {
    export NODE_ENV=test
    export DATABASE_URL="postgresql://test:test@localhost:5433/clawmanager_test"
    export REDIS_URL="redis://localhost:6380"
    export JWT_SECRET="test-jwt-secret-key-for-testing-only"
    export LOG_LEVEL=error
}

function check_test_dependencies() {
    if ! command -v node &> /dev/null; then
        echo "Node.js is required for testing"
        exit 1
    fi

    if ! pnpm list jest &> /dev/null; then
        echo "Installing test dependencies..."
        pnpm install
    fi

    if ! command -v docker &> /dev/null; then
        echo "Docker is required for integration tests"
        exit 1
    fi
}

function start_test_database() {
    echo "Starting test database..."

    if ! docker ps | grep -q clawmanager-test-db; then
        docker run -d --name clawmanager-test-db \
            -e POSTGRES_DB=clawmanager_test \
            -e POSTGRES_USER=test \
            -e POSTGRES_PASSWORD=test \
            -p 5433:5432 \
            postgres:15-alpine

        sleep 10
    fi

    if ! docker ps | grep -q clawmanager-test-redis; then
        docker run -d --name clawmanager-test-redis \
            -p 6380:6379 \
            redis:7-alpine
    fi
}

function stop_test_database() {
    echo "Stopping test database..."
    docker stop clawmanager-test-db clawmanager-test-redis 2>/dev/null || true
    docker rm clawmanager-test-db clawmanager-test-redis 2>/dev/null || true
}

function run_unit_tests() {
    echo "Running unit tests..."

    mkdir -p "$TEST_RESULTS_DIR/unit"
    mkdir -p "$COVERAGE_DIR"

    pnpm test -- \
        --testPathPattern=".*\.test\.(js|ts|jsx|tsx)$" \
        --coverage \
        --coverageDirectory="$COVERAGE_DIR" \
        --testResultsProcessor="jest-junit" \
        --outputFile="$TEST_RESULTS_DIR/unit/results.xml" \
        --passWithNoTests
}

function run_integration_tests() {
    echo "Running integration tests..."

    mkdir -p "$TEST_RESULTS_DIR/integration"

    pnpm test -- \
        --testPathPattern=".*\.integration\.(js|ts|jsx|tsx)$" \
        --testResultsProcessor="jest-junit" \
        --outputFile="$TEST_RESULTS_DIR/integration/results.xml"
}

function run_e2e_tests() {
    echo "Running end-to-end tests..."

    mkdir -p "$TEST_RESULTS_DIR/e2e"

    if ! docker ps | grep -q clawmanager-app; then
        echo "Starting application for E2E tests..."
        docker-compose -f docker-compose.test.yml up -d
        sleep 30
    fi

    pnpm test:e2e -- \
        --testResultsProcessor="jest-junit" \
        --outputFile="$TEST_RESULTS_DIR/e2e/results.xml"

    docker-compose -f docker-compose.test.yml down
}

function run_api_tests() {
    echo "Running API tests..."

    mkdir -p "$TEST_RESULTS_DIR/api"

    if ! docker ps | grep -q clawmanager-api-test; then
        docker run -d --name clawmanager-api-test \
            -p 8001:8000 \
            --env-file .env.test \
            clawmanager/api:latest
        sleep 15
    fi

    pnpm test:api -- \
        --testResultsProcessor="jest-junit" \
        --outputFile="$TEST_RESULTS_DIR/api/results.xml"

    docker stop clawmanager-api-test
    docker rm clawmanager-api-test
}

function run_performance_tests() {
    echo "Running performance tests..."

    mkdir -p "$TEST_RESULTS_DIR/performance"

    if ! command -v artillery &> /dev/null; then
        npm install -g artillery
    fi

    artillery run test/performance/load-test.yml \
        --output "$TEST_RESULTS_DIR/performance/report.json"

    artillery report "$TEST_RESULTS_DIR/performance/report.json" \
        --output "$TEST_RESULTS_DIR/performance/report.html"
}

function run_security_tests() {
    echo "Running security tests..."

    mkdir -p "$TEST_RESULTS_DIR/security"

    if ! command -v npm-audit &> /dev/null; then
        echo "Running npm audit..."
        pnpm audit --audit-level high --json > "$TEST_RESULTS_DIR/security/npm-audit.json"
    fi

    if command -v trivy &> /dev/null; then
        echo "Running container vulnerability scan..."
        trivy image clawmanager/app:latest \
            --format json \
            --output "$TEST_RESULTS_DIR/security/container-scan.json"
    fi

    if command -v owasp-zap &> /dev/null; then
        echo "Running OWASP ZAP security scan..."
        zap.sh -cmd -quickurl https://localhost -quickout "$TEST_RESULTS_DIR/security/zap-report.html"
    fi
}

function run_load_tests() {
    echo "Running load tests..."

    mkdir -p "$TEST_RESULTS_DIR/load"

    if ! command -v k6 &> /dev/null; then
        echo "k6 is not installed. Please install k6 for load testing."
        return 1
    fi

    k6 run \
        --out json="$TEST_RESULTS_DIR/load/results.json" \
        test/load/load-test.js

    k6 run \
        --out json="$TEST_RESULTS_DIR/load/stress-test.json" \
        test/load/stress-test.js
}

function run_contract_tests() {
    echo "Running smart contract tests..."

    mkdir -p "$TEST_RESULTS_DIR/contracts"

    if [ -d "./contracts" ]; then
        cd contracts

        if [ -f "hardhat.config.js" ]; then
            npx hardhat test \
                --network hardhat \
                --grep "test" \
                > "../../$TEST_RESULTS_DIR/contracts/hardhat-results.txt"
        fi

        if [ -f "truffle-config.js" ]; then
            npx truffle test \
                > "../../$TEST_RESULTS_DIR/contracts/truffle-results.txt"
        fi

        cd ..
    fi
}

function generate_test_report() {
    echo "Generating test report..."

    mkdir -p "$TEST_RESULTS_DIR/reports"

    cat > "$TEST_RESULTS_DIR/reports/summary.md" << EOF
# Test Execution Summary

## Test Results Overview

### Unit Tests
$(if [ -f "$TEST_RESULTS_DIR/unit/results.xml" ]; then
    echo "- Results: $TEST_RESULTS_DIR/unit/results.xml"
    echo "- Coverage: $COVERAGE_DIR/index.html"
else
    echo "- Not executed"
fi)

### Integration Tests
$(if [ -f "$TEST_RESULTS_DIR/integration/results.xml" ]; then
    echo "- Results: $TEST_RESULTS_DIR/integration/results.xml"
else
    echo "- Not executed"
fi)

### E2E Tests
$(if [ -f "$TEST_RESULTS_DIR/e2e/results.xml" ]; then
    echo "- Results: $TEST_RESULTS_DIR/e2e/results.xml"
else
    echo "- Not executed"
fi)

### API Tests
$(if [ -f "$TEST_RESULTS_DIR/api/results.xml" ]; then
    echo "- Results: $TEST_RESULTS_DIR/api/results.xml"
else
    echo "- Not executed"
fi)

### Performance Tests
$(if [ -f "$TEST_RESULTS_DIR/performance/report.html" ]; then
    echo "- Report: $TEST_RESULTS_DIR/performance/report.html"
else
    echo "- Not executed"
fi)

### Security Tests
$(if [ -d "$TEST_RESULTS_DIR/security" ]; then
    echo "- Results: $TEST_RESULTS_DIR/security/"
else
    echo "- Not executed"
fi)

### Load Tests
$(if [ -d "$TEST_RESULTS_DIR/load" ]; then
    echo "- Results: $TEST_RESULTS_DIR/load/"
else
    echo "- Not executed"
fi)

### Contract Tests
$(if [ -d "$TEST_RESULTS_DIR/contracts" ]; then
    echo "- Results: $TEST_RESULTS_DIR/contracts/"
else
    echo "- Not executed"
fi)

## System Information
- Date: $(date)
- Node Version: $(node -v)
- Test Environment: $(echo $NODE_ENV)
EOF
}

function cleanup_test_artifacts() {
    echo "Cleaning up test artifacts..."

    find "$TEST_RESULTS_DIR" -name "*.log" -mtime +7 -delete
    find "$COVERAGE_DIR" -name "*.lcov" -mtime +7 -delete

    if [ -d "$TEST_RESULTS_DIR/reports" ]; then
        find "$TEST_RESULTS_DIR/reports" -name "*.md" -mtime +30 -delete
    fi
}

function run_all_tests() {
    echo "Running all test suites..."

    setup_test_environment
    check_test_dependencies
    start_test_database

    trap stop_test_database EXIT

    run_unit_tests
    run_integration_tests
    run_api_tests
    run_contract_tests
    run_security_tests

    generate_test_report
    cleanup_test_artifacts

    echo "All tests completed!"
}

function show_test_status() {
    echo "=== Test Status ==="
    echo "Test Results Directory: $TEST_RESULTS_DIR"
    echo "Coverage Directory: $COVERAGE_DIR"
    echo ""

    if [ -d "$TEST_RESULTS_DIR" ]; then
        echo "Available test results:"
        find "$TEST_RESULTS_DIR" -name "*.xml" -o -name "*.json" -o -name "*.html" | head -10
    else
        echo "No test results found"
    fi

    echo ""
    echo "Test database status:"
    if docker ps | grep -q clawmanager-test-db; then
        echo "✓ Test database is running"
    else
        echo "✗ Test database is not running"
    fi

    if docker ps | grep -q clawmanager-test-redis; then
        echo "✓ Test Redis is running"
    else
        echo "✗ Test Redis is not running"
    fi
}

function show_help() {
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  all        Run all test suites"
    echo "  unit       Run unit tests only"
    echo "  integration Run integration tests only"
    echo "  e2e        Run end-to-end tests only"
    echo "  api        Run API tests only"
    echo "  performance Run performance tests only"
    echo "  security   Run security tests only"
    echo "  load       Run load tests only"
    echo "  contracts  Run smart contract tests only"
    echo "  status     Show test environment status"
    echo "  report     Generate test report"
    echo "  cleanup    Clean up test artifacts"
    echo "  help       Show this help message"
}

mkdir -p "$TEST_RESULTS_DIR"
mkdir -p "$COVERAGE_DIR"
mkdir -p "$LOG_DIR"

case "$1" in
    all)
        run_all_tests
        ;;
    unit)
        setup_test_environment
        check_test_dependencies
        start_test_database
        trap stop_test_database EXIT
        run_unit_tests
        ;;
    integration)
        setup_test_environment
        check_test_dependencies
        start_test_database
        trap stop_test_database EXIT
        run_integration_tests
        ;;
    e2e)
        setup_test_environment
        check_test_dependencies
        run_e2e_tests
        ;;
    api)
        setup_test_environment
        check_test_dependencies
        run_api_tests
        ;;
    performance)
        run_performance_tests
        ;;
    security)
        run_security_tests
        ;;
    load)
        run_load_tests
        ;;
    contracts)
        run_contract_tests
        ;;
    status)
        show_test_status
        ;;
    report)
        generate_test_report
        ;;
    cleanup)
        cleanup_test_artifacts
        ;;
    help|*)
        show_help
        ;;
esac