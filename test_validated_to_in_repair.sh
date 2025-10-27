#!/bin/bash

# Test script to transition a warranty claim from 'validated' to 'in_repair' status
# This script demonstrates the state transition workflow for warranty claims

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8090"
API_BASE="$BASE_URL/api/v1"

# Logging functions
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

log_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to get admin authentication token
get_admin_token() {
    log_info "Getting admin authentication token..." >&2
    
    local response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email_or_phone": "admin@example.com",
            "password": "adminpassword123"
        }')
    
    local token=$(echo "$response" | jq -r '.data.access_token // empty')
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        log_error "Failed to get admin token" >&2
        echo "$response" | jq . >&2
        exit 1
    fi
    
    log_success "Admin token obtained" >&2
    echo "$token"
}

# Function to get claims by status
get_claims_by_status() {
    local token="$1"
    local status="$2"
    
    local response=$(curl -s -X GET "$API_BASE/admin/warranty/claims/?status=$status&page_size=5" \
        -H "Authorization: Bearer $token")
    
    echo "$response" | jq -r '.data.claims[]?.id // empty' | head -1
}

# Function to get claim details
get_claim_details() {
    local token="$1"
    local claim_id="$2"
    
    curl -s -X GET "$API_BASE/admin/warranty/claims/$claim_id" \
        -H "Authorization: Bearer $token"
}

# Function to update claim status
update_claim_status() {
    local token="$1"
    local claim_id="$2"
    local new_status="$3"
    local notes="$4"
    local repair_notes="$5"
    
    local request_body=$(jq -n \
        --arg status "$new_status" \
        --arg notes "$notes" \
        --arg repair_notes "$repair_notes" \
        '{
            status: $status,
            notes: $notes,
            repair_notes: $repair_notes
        }')
    
    curl -s -X PUT "$API_BASE/admin/warranty/claims/$claim_id/status" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$request_body"
}

# Function to show claim state
show_claim_state() {
    local token="$1"
    local claim_id="$2"
    local label="$3"
    
    log_header "$label"
    
    local response=$(get_claim_details "$token" "$claim_id")
    
    if [ -z "$response" ]; then
        log_error "Failed to get claim details"
        return 1
    fi
    
    # Extract claim information
    local status=$(echo "$response" | jq -r '.data.claim.status // "unknown"')
    local previous_status=$(echo "$response" | jq -r '.data.claim.previous_status // "none"')
    local created_at=$(echo "$response" | jq -r '.data.claim.created_at // "unknown"')
    local updated_at=$(echo "$response" | jq -r '.data.claim.updated_at // "unknown"')
    local validated_at=$(echo "$response" | jq -r '.data.claim.validated_at // "none"')
    local validated_by=$(echo "$response" | jq -r '.data.claim.validated_by // "none"')
    local admin_notes=$(echo "$response" | jq -r '.data.claim.admin_notes // "none"')
    local customer_notes=$(echo "$response" | jq -r '.data.claim.customer_notes // "none"')
    
    # Display claim information
    echo "📋 Claim ID: $claim_id"
    echo "📊 Current Status: $status"
    echo "📈 Previous Status: $previous_status"
    echo "📅 Created: $created_at"
    echo "🔄 Updated: $updated_at"
    echo "✅ Validated: $validated_at"
    echo "👤 Validated By: $validated_by"
    echo "📝 Admin Notes: $admin_notes"
    echo "💬 Customer Notes: $customer_notes"
    
    # Show Kirimku booking info if available
    local kirimku_booking=$(echo "$response" | jq -r '.data.claim.kirimku_booking_data // empty')
    if [ -n "$kirimku_booking" ] && [ "$kirimku_booking" != "null" ]; then
        echo "🚚 Kirimku Booking: Available"
    else
        echo "🚚 Kirimku Booking: Not available"
    fi
    
    echo ""
}

# Main execution
main() {
    log_header "Warranty Claim State Transition Test: Validated → In Repair"
    
    # Get admin token
    ADMIN_TOKEN=$(get_admin_token)
    
    # Find a validated claim
    log_info "Looking for claims in 'validated' status..."
    CLAIM_ID=$(get_claims_by_status "$ADMIN_TOKEN" "validated")
    
    if [ -z "$CLAIM_ID" ]; then
        log_warning "No claims found in 'validated' status"
        log_info "Let's check what claims are available..."
        
        # Show available claims overview
        log_header "Available Claims Overview"
        local overview_response=$(curl -s -X GET "$API_BASE/admin/warranty/claims/?page_size=10" \
            -H "Authorization: Bearer $ADMIN_TOKEN")
        
        echo "$overview_response" | jq -r '.data.claims[]? | "ID: \(.id) | Status: \(.status) | Created: \(.created_at)"'
        
        log_error "Cannot proceed without a validated claim"
        exit 1
    fi
    
    log_success "Found validated claim: $CLAIM_ID"
    
    # Show initial state
    show_claim_state "$ADMIN_TOKEN" "$CLAIM_ID" "Initial State (Before Transition)"
    
    # Transition to in_repair
    log_info "Transitioning claim from 'validated' to 'in_repair'..."
    
    local transition_response=$(update_claim_status "$ADMIN_TOKEN" "$CLAIM_ID" "in_repair" \
        "Claim has been assigned to technician and repair work has started" \
        "Initial diagnosis completed. Starting component replacement process.")
    
    # Check if transition was successful
    local success=$(echo "$transition_response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
        log_success "Status transition completed successfully"
        
        # Show final state
        show_claim_state "$ADMIN_TOKEN" "$CLAIM_ID" "Final State (After Transition)"
        
        # Show transition summary
        log_header "Transition Summary"
        echo "🔄 Transition: validated → in_repair"
        echo "📋 Claim ID: $CLAIM_ID"
        echo "✅ Status: Successfully updated"
        echo "📝 Notes: Added repair progress notes"
        echo "🔧 Repair Notes: Initial diagnosis and component replacement started"
        
        log_header "Possible Next Transitions from 'in_repair'"
        echo "• in_repair → repaired (when repair is completed)"
        echo "• in_repair → replaced (if device needs replacement)"
        echo "• in_repair → cancelled (if repair is not possible)"
        echo "• in_repair → disputed (if customer disputes the repair)"
        
    else
        log_error "Status transition failed"
        echo "Response: $transition_response"
        
        # Show error details
        local error_message=$(echo "$transition_response" | jq -r '.message // "Unknown error"')
        log_error "Error: $error_message"
        
        exit 1
    fi
    
    log_success "Test completed successfully!"
}

# Run the main function
main "$@"