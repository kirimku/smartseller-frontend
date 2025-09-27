#!/bin/bash

# Local Multi-Domain Simulation Setup
# This script helps you test both domains locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🌐 Local Multi-Domain Simulation Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to check if running as root/sudo for hosts file modification
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        log_info "Running with root privileges - can modify /etc/hosts directly"
        return 0
    else
        log_warning "Not running as root - will need sudo for hosts file modification"
        return 1
    fi
}

# Function to setup hosts file
setup_hosts() {
    log_info "Setting up local domain mapping..."
    
    HOSTS_FILE="/etc/hosts"
    BACKUP_FILE="/etc/hosts.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Create backup
    sudo cp "$HOSTS_FILE" "$BACKUP_FILE"
    log_success "Created hosts backup: $BACKUP_FILE"
    
    # Remove existing entries if they exist
    sudo sed -i '/# SmartSeller Multi-Domain Local Testing/,/# End SmartSeller Multi-Domain/d' "$HOSTS_FILE"
    
    # Add new entries
    echo "" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "# SmartSeller Multi-Domain Local Testing" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "127.0.0.1    smartseller.local" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "127.0.0.1    www.smartseller.local" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "127.0.0.1    app.rexus.local" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "127.0.0.1    www.app.rexus.local" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "# End SmartSeller Multi-Domain" | sudo tee -a "$HOSTS_FILE" > /dev/null
    
    log_success "Local domains added to hosts file:"
    echo -e "   📊 Platform: http://smartseller.local:4173"
    echo -e "   🎮 Storefront: http://app.rexus.local:4173"
}

# Function to remove hosts entries
cleanup_hosts() {
    log_info "Cleaning up local domain mapping..."
    sudo sed -i '/# SmartSeller Multi-Domain Local Testing/,/# End SmartSeller Multi-Domain/d' /etc/hosts
    log_success "Local domain entries removed from hosts file"
}

# Function to build and serve
build_and_serve() {
    log_info "Building application for local testing..."
    
    # Build the application
    npm run build:production
    
    if [ $? -eq 0 ]; then
        log_success "Build completed successfully"
    else
        log_error "Build failed!"
        exit 1
    fi
    
    # Start preview server
    log_info "Starting preview server on all network interfaces..."
    log_info "This will allow testing from other devices on your network"
    
    # Start server in background
    npm run preview:host &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 3
    
    echo ""
    log_success "Multi-domain simulation ready!"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}🌐 Test URLs:${NC}"
    echo -e "   📊 Platform (SmartSeller):  http://smartseller.local:4173"
    echo -e "   🎮 Storefront (Rexus):      http://app.rexus.local:4173"
    echo ""
    echo -e "${BLUE}📱 Network Testing:${NC}"
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo -e "   📊 Platform Network:        http://$LOCAL_IP:4173 (add ?domain=platform)"
    echo -e "   🎮 Storefront Network:      http://$LOCAL_IP:4173 (add ?domain=tenant)"
    echo ""
    echo -e "${YELLOW}🔧 How it works:${NC}"
    echo -e "   • Same server serves both domains"
    echo -e "   • JavaScript detects hostname and shows different UI"
    echo -e "   • Platform shows admin interface"
    echo -e "   • Storefront shows Rexus gaming store"
    echo ""
    echo -e "${YELLOW}🧪 Testing Steps:${NC}"
    echo -e "   1. Visit http://smartseller.local:4173 → Should show Platform Dashboard"
    echo -e "   2. Visit http://app.rexus.local:4173 → Should show Rexus Gaming Store"
    echo -e "   3. Check browser console for domain detection logs"
    echo -e "   4. Verify different themes and components render"
    echo ""
    echo -e "${RED}⚠️  Press Ctrl+C to stop server and cleanup${NC}"
    
    # Wait for user interruption
    trap "cleanup_and_exit $SERVER_PID" INT TERM
    
    # Keep script running
    wait $SERVER_PID
}

# Function to cleanup and exit
cleanup_and_exit() {
    local pid=$1
    echo ""
    log_info "Shutting down server..."
    
    # Kill the server process
    if kill -0 $pid 2>/dev/null; then
        kill $pid
        log_success "Server stopped"
    fi
    
    # Ask if user wants to cleanup hosts file
    echo ""
    read -p "Do you want to remove local domain entries from hosts file? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup_hosts
    else
        log_info "Local domain entries kept in hosts file"
        echo -e "   To manually remove later, run: sudo sed -i '/# SmartSeller Multi-Domain/,/# End SmartSeller/d' /etc/hosts"
    fi
    
    echo ""
    log_success "Local simulation ended"
    exit 0
}

# Function to show help
show_help() {
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [command]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  setup     - Setup hosts file and start simulation"
    echo "  cleanup   - Remove hosts entries only"
    echo "  help      - Show this help message"
    echo ""
    echo -e "${YELLOW}Manual Testing:${NC}"
    echo "  1. Run: $0 setup"
    echo "  2. Visit: http://smartseller.local:4173 (Platform)"
    echo "  3. Visit: http://app.rexus.local:4173 (Storefront)"
    echo "  4. Press Ctrl+C when done"
    echo ""
}

# Main logic
case "${1:-setup}" in
    "setup")
        if ! command -v npm &> /dev/null; then
            log_error "npm is required but not installed"
            exit 1
        fi
        
        if [ ! -f "package.json" ]; then
            log_error "Must be run from project root directory"
            exit 1
        fi
        
        setup_hosts
        build_and_serve
        ;;
    "cleanup")
        cleanup_hosts
        ;;
    "help")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac