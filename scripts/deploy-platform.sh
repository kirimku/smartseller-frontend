#!/bin/bash

# Deploy SmartSeller Platform to smartseller.com
# This script builds and deploys the platform management interface

set -e  # Exit on any error

echo "🚀 Starting SmartSeller Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLATFORM_DOMAIN="smartseller.com"
PLATFORM_BUILD_DIR="dist/platform"
DEPLOY_TARGET="/var/www/smartseller-platform"

echo -e "${BLUE}📦 Building Platform Application...${NC}"

# Clean previous build
if [ -d "$PLATFORM_BUILD_DIR" ]; then
    rm -rf "$PLATFORM_BUILD_DIR"
    echo -e "${YELLOW}🗑️  Cleaned previous build${NC}"
fi

# Build platform
npm run build:platform

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Platform build successful${NC}"
else
    echo -e "${RED}❌ Platform build failed${NC}"
    exit 1
fi

# Check if build output exists
if [ ! -d "$PLATFORM_BUILD_DIR" ]; then
    echo -e "${RED}❌ Build output directory not found: $PLATFORM_BUILD_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Build Statistics:${NC}"
echo "  Build size: $(du -sh $PLATFORM_BUILD_DIR | cut -f1)"
echo "  Files: $(find $PLATFORM_BUILD_DIR -type f | wc -l)"

# Optional: Test deployment locally first
echo -e "${YELLOW}🧪 Would you like to preview the build locally? (y/n)${NC}"
read -r preview

if [ "$preview" = "y" ] || [ "$preview" = "Y" ]; then
    echo -e "${BLUE}🌐 Starting local preview...${NC}"
    npm run preview:platform &
    PREVIEW_PID=$!
    echo "Preview running at http://localhost:4173"
    echo "Press any key to continue with deployment..."
    read -r
    kill $PREVIEW_PID 2>/dev/null || true
fi

# Deploy to production (uncomment and configure for your setup)
echo -e "${BLUE}🚀 Deploying to production...${NC}"

# Example deployment methods (choose one):

# Method 1: Direct copy (if deploying on same server)
# sudo cp -r "$PLATFORM_BUILD_DIR"/* "$DEPLOY_TARGET/"

# Method 2: rsync to remote server
# rsync -avz --delete "$PLATFORM_BUILD_DIR"/ user@smartseller.com:/var/www/platform/

# Method 3: SCP to remote server
# scp -r "$PLATFORM_BUILD_DIR"/* user@smartseller.com:/var/www/platform/

# Method 4: Docker deployment
# docker build -t smartseller-platform -f Dockerfile.platform .
# docker tag smartseller-platform your-registry.com/smartseller-platform:latest
# docker push your-registry.com/smartseller-platform:latest

echo -e "${YELLOW}⚠️  Deployment method not configured. Please uncomment and configure the appropriate deployment method in this script.${NC}"
echo -e "${BLUE}📁 Build ready for deployment at: $PLATFORM_BUILD_DIR${NC}"

# Health check after deployment (customize URL)
# echo -e "${BLUE}🏥 Performing health check...${NC}"
# curl -f https://smartseller.com/platform/health || echo -e "${YELLOW}⚠️  Health check failed${NC}"

echo -e "${GREEN}✅ SmartSeller Platform deployment process completed!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo "  1. Configure your web server to serve files from $PLATFORM_BUILD_DIR"
echo "  2. Set up SSL certificate for $PLATFORM_DOMAIN"
echo "  3. Configure DNS to point $PLATFORM_DOMAIN to your server"
echo "  4. Test the deployment at https://$PLATFORM_DOMAIN"

echo -e "${GREEN}🎉 Platform ready for smartseller.com!${NC}"