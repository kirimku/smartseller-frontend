#!/bin/bash

# Test script for Admin Warranty Claims Validation Endpoint
# Endpoint: POST /api/v1/admin/warranty/claims/{id}/validate
# Tests validation, rejection, and request_info actions

set -e

echo "=== Admin Warranty Claims Validation Testing Script ==="
echo "Testing endpoint: POST /api/v1/admin/warranty/claims/{id}/validate"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Generate fresh admin token
echo "🔑 Generating admin authentication token..."
TOKEN_OUTPUT=$(go run generate_auth_tokens.go)
ADMIN_TOKEN=$(echo "$TOKEN_OUTPUT" | grep -A1 "For Admin API calls:" | tail -1 | sed 's/.*Bearer //' | sed 's/" http.*//')

if [ -z "$ADMIN_TOKEN" ]; then
    log_error "Failed to generate admin token"
    echo "Token generation output:"
    echo "$TOKEN_OUTPUT"
    exit 1
fi

log_success "Admin token generated successfully"
echo

# Generate customer token for claim creation
echo "🔑 Generating customer authentication token..."
CUSTOMER_TOKEN=$(echo "$TOKEN_OUTPUT" | grep -A1 "For Customer API calls:" | tail -1 | sed 's/.*Bearer //' | sed 's/" http.*//')

if [ -z "$CUSTOMER_TOKEN" ]; then
    log_error "Failed to generate customer token"
    exit 1
fi

log_success "Customer token generated successfully"
echo

# Base URLs
ADMIN_BASE_URL="http://localhost:8090/api/v1/admin/warranty/claims"
CUSTOMER_BASE_URL="http://localhost:8090/api/v1/storefront/rexus/warranty/claims"

# Helper function to get a test warranty barcode
get_test_warranty_barcode() {
    log_info "Getting test warranty barcode..."
    
    local response=$(curl -s -H "Authorization: Bearer $CUSTOMER_TOKEN" \
                          -H "Content-Type: application/json" \
                          "http://localhost:8090/api/v1/storefront/rexus/warranty/barcodes")
    
    # The response format is different - it's a single barcode object, not an array
    local barcode=$(echo "$response" | jq -r '.warranty.barcode // ""')
    if [ -n "$barcode" ] && [ "$barcode" != "null" ] && [ "$barcode" != "barcodes" ]; then
        echo "$barcode"
        return 0
    fi
    
    log_error "No active warranty barcode found for testing"
    return 1
}

# Helper function to create a test claim
create_test_claim() {
    local barcode="$1"
    log_info "Creating test warranty claim with barcode: $barcode"
    
    local payload=$(cat <<EOF
{
    "warranty_id": "$barcode",
    "issue_type": "defective",
    "description": "Test claim for validation endpoint testing - device not working properly",
    "severity": "medium"
}
EOF
)

    local response=$(curl -s -X POST \
                          -H "Authorization: Bearer $CUSTOMER_TOKEN" \
                          -H "Content-Type: application/json" \
                          -d "$payload" \
                          "$CUSTOMER_BASE_URL")
    
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
        local claim_id=$(echo "$response" | jq -r '.data.id // ""')
        if [ -n "$claim_id" ] && [ "$claim_id" != "null" ]; then
            echo "$claim_id"
            return 0
        fi
    fi
    
    log_error "Failed to create test claim"
    echo "Response: $response"
    return 1
}

# Helper function to get claims in pending status (suitable for validation)
get_pending_claim() {
    local response=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
                          -H "Content-Type: application/json" \
                          "$ADMIN_BASE_URL/?status=pending&page_size=1")
    
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
        local claim_id=$(echo "$response" | jq -r '.data.claims[0].id // ""')
        if [ -n "$claim_id" ] && [ "$claim_id" != "null" ]; then
            echo "$claim_id"
            return 0
        fi
    fi
    
    return 1
}

# Test function for validation action
test_validate_action() {
    local claim_id="$1"
    echo
    log_info "Test 1: Validate claim action"
    echo "POST $ADMIN_BASE_URL/$claim_id/validate"
    
    local payload=$(cat <<EOF
{
    "action": "validate",
    "notes": "Claim approved for repair - physical damage covered under warranty",
    "estimated_completion_date": "2024-12-31T17:00:00Z"
}
EOF
)

    echo "Request payload:"
    echo "$payload" | jq '.'
    echo
    
    local response=$(curl -s -X POST \
                          -H "Authorization: Bearer $ADMIN_TOKEN" \
                          -H "Content-Type: application/json" \
                          -d "$payload" \
                          "$ADMIN_BASE_URL/$claim_id/validate")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        log_success "Validation action completed successfully"
        local status=$(echo "$response" | jq -r '.data.status // ""')
        log_info "Claim status updated to: $status"
    else
        log_error "Validation action failed"
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_error "Error: $error"
    fi
    
    echo "---"
}

# Test function for rejection action
test_reject_action() {
    local claim_id="$1"
    echo
    log_info "Test 2: Reject claim action"
    echo "POST $ADMIN_BASE_URL/$claim_id/validate"
    
    local payload=$(cat <<EOF
{
    "action": "reject",
    "notes": "Claim rejected - damage not covered under warranty terms",
    "rejection_reason": "Physical damage due to misuse is not covered under warranty policy"
}
EOF
)

    echo "Request payload:"
    echo "$payload" | jq '.'
    echo
    
    local response=$(curl -s -X POST \
                          -H "Authorization: Bearer $ADMIN_TOKEN" \
                          -H "Content-Type: application/json" \
                          -d "$payload" \
                          "$ADMIN_BASE_URL/$claim_id/validate")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        log_success "Rejection action completed successfully"
        local status=$(echo "$response" | jq -r '.data.status // ""')
        log_info "Claim status updated to: $status"
    else
        log_error "Rejection action failed"
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_error "Error: $error"
    fi
    
    echo "---"
}

# Test function for request_info action
test_request_info_action() {
    local claim_id="$1"
    echo
    log_info "Test 3: Request additional information action"
    echo "POST $ADMIN_BASE_URL/$claim_id/validate"
    
    local payload=$(cat <<EOF
{
    "action": "request_info",
    "notes": "Additional information required for claim processing",
    "requested_info": "Please provide purchase receipt and photos of the damaged device from multiple angles"
}
EOF
)

    echo "Request payload:"
    echo "$payload" | jq '.'
    echo
    
    local response=$(curl -s -X POST \
                          -H "Authorization: Bearer $ADMIN_TOKEN" \
                          -H "Content-Type: application/json" \
                          -d "$payload" \
                          "$ADMIN_BASE_URL/$claim_id/validate")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        log_success "Request info action completed successfully"
        local status=$(echo "$response" | jq -r '.data.status // ""')
        log_info "Claim status updated to: $status"
    else
        log_error "Request info action failed"
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_error "Error: $error"
    fi
    
    echo "---"
}

# Test function for invalid action
test_invalid_action() {
    local claim_id="$1"
    echo
    log_info "Test 4: Invalid action (should fail)"
    echo "POST $ADMIN_BASE_URL/$claim_id/validate"
    
    local payload=$(cat <<EOF
{
    "action": "invalid_action",
    "notes": "This should fail validation"
}
EOF
)

    echo "Request payload:"
    echo "$payload" | jq '.'
    echo
    
    local response=$(curl -s -X POST \
                          -H "Authorization: Bearer $ADMIN_TOKEN" \
                          -H "Content-Type: application/json" \
                          -d "$payload" \
                          "$ADMIN_BASE_URL/$claim_id/validate")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "false" ]; then
        log_success "Invalid action correctly rejected"
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_info "Error message: $error"
    else
        log_warning "Invalid action was unexpectedly accepted"
    fi
    
    echo "---"
}

# Test function for missing required fields
test_missing_fields() {
    local claim_id="$1"
    echo
    log_info "Test 5: Missing required fields (should fail)"
    echo "POST $ADMIN_BASE_URL/$claim_id/validate"
    
    local payload=$(cat <<EOF
{
    "notes": "Missing action field"
}
EOF
)

    echo "Request payload:"
    echo "$payload" | jq '.'
    echo
    
    local response=$(curl -s -X POST \
                          -H "Authorization: Bearer $ADMIN_TOKEN" \
                          -H "Content-Type: application/json" \
                          -d "$payload" \
                          "$ADMIN_BASE_URL/$claim_id/validate")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "false" ]; then
        log_success "Missing fields correctly rejected"
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_info "Error message: $error"
    else
        log_warning "Missing fields were unexpectedly accepted"
    fi
    
    echo "---"
}

# Test function for non-existent claim
test_nonexistent_claim() {
    echo
    log_info "Test 6: Non-existent claim ID (should fail)"
    local fake_claim_id="550e8400-e29b-41d4-a716-446655440000"
    echo "POST $ADMIN_BASE_URL/$fake_claim_id/validate"
    
    local payload=$(cat <<EOF
{
    "action": "validate",
    "notes": "This claim does not exist"
}
EOF
)

    echo "Request payload:"
    echo "$payload" | jq '.'
    echo
    
    local response=$(curl -s -X POST \
                          -H "Authorization: Bearer $ADMIN_TOKEN" \
                          -H "Content-Type: application/json" \
                          -d "$payload" \
                          "$ADMIN_BASE_URL/$fake_claim_id/validate")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "false" ]; then
        log_success "Non-existent claim correctly rejected"
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_info "Error message: $error"
    else
        log_warning "Non-existent claim was unexpectedly accepted"
    fi
    
    echo "---"
}

# Test function for unauthorized access
test_unauthorized_access() {
    local claim_id="$1"
    echo
    log_info "Test 7: Unauthorized access (should fail)"
    echo "POST $ADMIN_BASE_URL/$claim_id/validate"
    
    local payload=$(cat <<EOF
{
    "action": "validate",
    "notes": "Unauthorized request"
}
EOF
)

    echo "Request payload:"
    echo "$payload" | jq '.'
    echo
    
    local response=$(curl -s -X POST \
                          -H "Content-Type: application/json" \
                          -d "$payload" \
                          "$ADMIN_BASE_URL/$claim_id/validate")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "false" ]; then
        log_success "Unauthorized access correctly rejected"
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_info "Error message: $error"
    else
        log_warning "Unauthorized access was unexpectedly accepted"
    fi
    
    echo "---"
}

# Main test execution
main() {
    echo "🚀 Starting warranty claim validation endpoint tests..."
    echo
    
    # Try to get an existing pending claim first
    log_info "Looking for claims in 'pending' status..."
    CLAIM_ID=$(get_pending_claim)
    
    if [ -z "$CLAIM_ID" ]; then
        log_warning "No pending claims found, attempting to create a test claim..."
        
        # Get a test barcode
        BARCODE_VALUE=$(get_test_warranty_barcode)
        if [ $? -ne 0 ]; then
            log_error "Cannot proceed without a test warranty barcode"
            exit 1
        fi
        
        # Create a test claim
        CLAIM_ID=$(create_test_claim "$BARCODE_VALUE")
        if [ $? -ne 0 ]; then
            log_error "Cannot proceed without a test claim"
            exit 1
        fi
        
        log_success "Created test claim with ID: $CLAIM_ID"
    else
        log_success "Found existing pending claim with ID: $CLAIM_ID"
    fi
    
    echo
    log_info "Using claim ID: $CLAIM_ID for testing"
    echo
    
    # Run all tests
    test_validate_action "$CLAIM_ID"
    
    # Create additional claims for other tests if needed
    if [ -n "$BARCODE_VALUE" ]; then
        # Create claim for rejection test
        REJECT_CLAIM_ID=$(create_test_claim "$BARCODE_VALUE")
        if [ $? -eq 0 ]; then
            test_reject_action "$REJECT_CLAIM_ID"
        fi
        
        # Create claim for request_info test
        INFO_CLAIM_ID=$(create_test_claim "$BARCODE_VALUE")
        if [ $? -eq 0 ]; then
            test_request_info_action "$INFO_CLAIM_ID"
        fi
    else
        log_warning "Skipping rejection and request_info tests - no barcode available for new claims"
    fi
    
    # Test error scenarios
    test_invalid_action "$CLAIM_ID"
    test_missing_fields "$CLAIM_ID"
    test_nonexistent_claim
    test_unauthorized_access "$CLAIM_ID"
    
    echo
    log_success "All warranty claim validation endpoint tests completed!"
    echo
    echo "📊 Test Summary:"
    echo "- Validation action test"
    echo "- Rejection action test"
    echo "- Request info action test"
    echo "- Invalid action test (error scenario)"
    echo "- Missing fields test (error scenario)"
    echo "- Non-existent claim test (error scenario)"
    echo "- Unauthorized access test (error scenario)"
    echo
    log_info "Review the test results above to ensure all endpoints are working correctly."
}

# Run the main function
main "$@"