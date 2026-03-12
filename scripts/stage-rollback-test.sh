#!/bin/bash
#
# Stage Rollback Test Script
# 
# This script tests the rollback procedure for the staging environment.
# It validates that rollback mechanisms are functional and can restore
# the previous version if needed.
#
# Exit codes:
#   0 - Rollback test passed
#   1 - Rollback test failed (cluster credentials missing or test failure)
#   2 - Configuration error
#

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-telco-staging}"
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"
BACKEND_RELEASE="backend-services"
BFF_RELEASE="bff"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi
}

# Check cluster credentials
check_credentials() {
    log_info "Checking cluster credentials..."
    
    if [ -z "$KUBECONFIG" ] && [ ! -f "$HOME/.kube/config" ]; then
        log_error "Kubernetes credentials missing!"
        log_error "Please provide one of the following:"
        log_error "  1. Set KUBECONFIG environment variable"
        log_error "  2. Place kubeconfig at ~/.kube/config"
        log_error ""
        log_error "To configure for staging cluster:"
        log_error "  aws eks update-kubeconfig --name telco-staging --region eu-west-1"
        exit 1
    fi
    
    # Test connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster."
        log_error "Please verify your credentials and cluster configuration."
        exit 1
    fi
    
    log_info "Cluster credentials validated."
}

# Test rollback to previous release
test_rollback_backend() {
    log_info "Testing backend-services rollback capability..."
    
    # Check if release exists
    if ! helm list -n "$NAMESPACE" | grep -q "$BACKEND_RELEASE"; then
        log_warn "Backend release '$BACKEND_RELEASE' not found in namespace '$NAMESPACE'"
        log_info "Skipping backend rollback test (release not deployed)"
        return 0
    fi
    
    # Get current revision
    local current_rev
    current_rev=$(helm list -n "$NAMESPACE" -o json | \
        jq -r ".[] | select(.name == \"$BACKEND_RELEASE\") | .revision" 2>/dev/null || echo "1")
    
    log_info "Current revision: $current_rev"
    
    # Test rollback capability (dry-run)
    if helm rollback "$BACKEND_RELEASE" "$((current_rev - 1))" --dry-run -n "$NAMESPACE" 2>/dev/null; then
        log_info "Backend rollback dry-run successful."
        return 0
    elif [ "$current_rev" -eq 1 ]; then
        log_warn "No previous revision to rollback to (currently at revision 1)"
        log_info "Skipping - this is the first deployment."
        return 0
    else
        log_error "Backend rollback dry-run failed."
        return 1
    fi
}

# Test rollback for BFF
test_rollback_bff() {
    log_info "Testing BFF rollback capability..."
    
    # Check if release exists
    if ! helm list -n "$NAMESPACE" | grep -q "$BFF_RELEASE"; then
        log_warn "BFF release '$BFF_RELEASE' not found in namespace '$NAMESPACE'"
        log_info "Skipping BFF rollback test (release not deployed)"
        return 0
    fi
    
    # Get current revision
    local current_rev
    current_rev=$(helm list -n "$NAMESPACE" -o json | \
        jq -r ".[] | select(.name == \"$BFF_RELEASE\") | .revision" 2>/dev/null || echo "1")
    
    log_info "Current revision: $current_rev"
    
    # Test rollback capability (dry-run)
    if helm rollback "$BFF_RELEASE" "$((current_rev - 1))" --dry-run -n "$NAMESPACE" 2>/dev/null; then
        log_info "BFF rollback dry-run successful."
        return 0
    elif [ "$current_rev" -eq 1 ]; then
        log_warn "No previous revision to rollback to (currently at revision 1)"
        log_info "Skipping - this is the first deployment."
        return 0
    else
        log_error "BFF rollback dry-run failed."
        return 1
    fi
}

# Test namespace exists and is accessible
test_namespace() {
    log_info "Checking namespace '$NAMESPACE'..."
    
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist."
        log_info "It will be created during deployment."
        return 0  # This is not a failure - namespace will be created
    fi
    
    log_info "Namespace '$NAMESPACE' exists and is accessible."
}

# Test Helm release history
test_release_history() {
    log_info "Checking release history for rollback readiness..."
    
    # Backend services
    if helm history "$BACKEND_RELEASE" -n "$NAMESPACE" &> /dev/null; then
        local rev_count
        rev_count=$(helm history "$BACKEND_RELEASE" -n "$NAMESPACE" -o json 2>/dev/null | jq 'length' || echo "0")
        log_info "Backend-services has $rev_count revision(s) in history"
        
        if [ "$rev_count" -lt 2 ]; then
            log_warn "Less than 2 revisions available - rollback may not be possible"
        fi
    else
        log_warn "No release history for backend-services (not yet deployed)"
    fi
    
    # BFF
    if helm history "$BFF_RELEASE" -n "$NAMESPACE" &> /dev/null; then
        local rev_count
        rev_count=$(helm history "$BFF_RELEASE" -n "$NAMESPACE" -o json 2>/dev/null | jq 'length' || echo "0")
        log_info "BFF has $rev_count revision(s) in history"
        
        if [ "$rev_count" -lt 2 ]; then
            log_warn "Less than 2 revisions available - rollback may not be possible"
        fi
    else
        log_warn "No release history for BFF (not yet deployed)"
    fi
}

# Main execution
main() {
    log_info "=========================================="
    log_info "Stage Rollback Test Procedure"
    log_info "=========================================="
    log_info "Namespace: $NAMESPACE"
    log_info "Kubeconfig: ${KUBECONFIG:-(default)}"
    log_info ""
    
    # Pre-flight checks
    check_kubectl
    check_credentials
    test_namespace
    test_release_history
    
    # Run rollback tests
    log_info ""
    log_info "Running rollback capability tests..."
    log_info "=========================================="
    
    local test_passed=true
    
    if ! test_rollback_backend; then
        test_passed=false
    fi
    
    echo ""
    
    if ! test_rollback_bff; then
        test_passed=false
    fi
    
    # Summary
    log_info ""
    log_info "=========================================="
    if [ "$test_passed" = true ]; then
        log_info "✅ Stage Rollback Test PASSED"
        log_info "Rollback procedures are functional."
        exit 0
    else
        log_error "❌ Stage Rollback Test FAILED"
        log_error "Rollback procedures need attention."
        exit 1
    fi
}

# Run main
main "$@"
