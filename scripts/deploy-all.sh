#!/bin/bash

# Deploy both SmartSeller Platform and Rexus Gaming Storefront
# This is a comprehensive deployment script for the dual-domain architecture

set -e  # Exit on any error

echo "🌐 Starting Dual Domain Deployment"
echo "   📊 SmartSeller Platform → smartseller.com"
echo "   🎮 Rexus Gaming Store → app.rexus.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${CYAN}🏗️  Project Root: $PROJECT_ROOT${NC}"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found. Please run this script from the project root.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm ci
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to run tests (if available)
run_tests() {
    echo -e "${BLUE}🧪 Running tests...${NC}"
    # Uncomment if you have tests
    # npm test
    echo -e "${YELLOW}⚠️  Tests skipped (not configured)${NC}"
}

# Function to build both applications
build_applications() {
    echo -e "${CYAN}🔨 Building applications...${NC}"
    
    # Clean previous builds
    echo -e "${YELLOW}🗑️  Cleaning previous builds...${NC}"
    rm -rf dist/platform dist/rexus
    
    # Build platform
    echo -e "${BLUE}📊 Building SmartSeller Platform...${NC}"
    npm run build:platform
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Platform build successful${NC}"
    else
        echo -e "${RED}❌ Platform build failed${NC}"
        exit 1
    fi
    
    # Build Rexus
    echo -e "${PURPLE}🎮 Building Rexus Gaming Storefront...${NC}"
    VITE_APP_MODE=tenant npm run build -- --mode production.rexus --outDir dist/rexus
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Rexus build successful${NC}"
    else
        echo -e "${RED}❌ Rexus build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All builds completed successfully${NC}"
}

# Function to validate builds
validate_builds() {
    echo -e "${CYAN}🔍 Validating builds...${NC}"
    
    # Check platform build
    if [ -d "dist/platform" ] && [ -f "dist/platform/index.html" ]; then
        echo -e "${GREEN}✅ Platform build valid${NC}"
        echo "   Size: $(du -sh dist/platform | cut -f1)"
        echo "   Files: $(find dist/platform -type f | wc -l)"
    else
        echo -e "${RED}❌ Platform build invalid${NC}"
        exit 1
    fi
    
    # Check Rexus build
    if [ -d "dist/rexus" ] && [ -f "dist/rexus/index.html" ]; then
        echo -e "${GREEN}✅ Rexus build valid${NC}"
        echo "   Size: $(du -sh dist/rexus | cut -f1)"
        echo "   Files: $(find dist/rexus -type f | wc -l)"
        
        # Check for PWA assets
        if [ -f "dist/rexus/manifest.webmanifest" ]; then
            echo -e "${GREEN}   ✅ PWA manifest found${NC}"
        fi
        if [ -f "dist/rexus/sw.js" ]; then
            echo -e "${GREEN}   ✅ Service worker found${NC}"
        fi
    else
        echo -e "${RED}❌ Rexus build invalid${NC}"
        exit 1
    fi
}

# Function to generate deployment summary
generate_summary() {
    echo -e "${CYAN}📋 Deployment Summary${NC}"
    echo "================================"
    echo -e "${BLUE}SmartSeller Platform (smartseller.com):${NC}"
    echo "  📁 Build location: dist/platform/"
    echo "  📊 Size: $(du -sh dist/platform | cut -f1)"
    echo "  📄 Files: $(find dist/platform -type f | wc -l)"
    echo ""
    echo -e "${PURPLE}Rexus Gaming Store (app.rexus.com):${NC}"
    echo "  📁 Build location: dist/rexus/"
    echo "  📊 Size: $(du -sh dist/rexus | cut -f1)"
    echo "  📄 Files: $(find dist/rexus -type f | wc -l)"
    echo "  📱 PWA: $([ -f "dist/rexus/manifest.webmanifest" ] && echo "Enabled" || echo "Disabled")"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Deploy platform build to smartseller.com server"
    echo "2. Deploy Rexus build to app.rexus.com server"
    echo "3. Configure web servers (Nginx/Apache)"
    echo "4. Set up SSL certificates for both domains"
    echo "5. Update DNS records"
    echo ""
    echo -e "${GREEN}🎉 Dual domain deployment ready!${NC}"
}

# Main deployment flow
main() {
    cd "$PROJECT_ROOT"
    
    echo -e "${CYAN}🌟 SmartSeller Dual Domain Deployment${NC}"
    echo "====================================="
    
    check_prerequisites
    install_dependencies
    run_tests
    build_applications
    validate_builds
    generate_summary
    
    echo -e "${GREEN}✅ Deployment preparation completed successfully!${NC}"
    echo -e "${CYAN}🚀 Ready to deploy to production!${NC}"
}

# Run main function
main "$@"