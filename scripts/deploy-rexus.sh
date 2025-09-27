#!/bin/bash

# Deploy Rexus Gaming Storefront to app.rexus.com
# This script builds and deploys the tenant storefront

set -e  # Exit on any error

echo "🎮 Starting Rexus Gaming Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
REXUS_DOMAIN="app.rexus.com"
REXUS_BUILD_DIR="dist/rexus"
DEPLOY_TARGET="/var/www/rexus-storefront"

echo -e "${PURPLE}🎮 Building Rexus Gaming Storefront...${NC}"

# Clean previous build
if [ -d "$REXUS_BUILD_DIR" ]; then
    rm -rf "$REXUS_BUILD_DIR"
    echo -e "${YELLOW}🗑️  Cleaned previous build${NC}"
fi

# Build Rexus storefront
VITE_APP_MODE=tenant npm run build -- --mode production.rexus --outDir "$REXUS_BUILD_DIR"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Rexus build successful${NC}"
else
    echo -e "${RED}❌ Rexus build failed${NC}"
    exit 1
fi

# Check if build output exists
if [ ! -d "$REXUS_BUILD_DIR" ]; then
    echo -e "${RED}❌ Build output directory not found: $REXUS_BUILD_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Build Statistics:${NC}"
echo "  Build size: $(du -sh $REXUS_BUILD_DIR | cut -f1)"
echo "  Files: $(find $REXUS_BUILD_DIR -type f | wc -l)"
echo "  PWA manifest: $([ -f "$REXUS_BUILD_DIR/manifest.webmanifest" ] && echo "✅ Generated" || echo "❌ Missing")"
echo "  Service worker: $([ -f "$REXUS_BUILD_DIR/sw.js" ] && echo "✅ Generated" || echo "❌ Missing")"

# Validate Rexus-specific assets
echo -e "${PURPLE}🎮 Validating Rexus assets...${NC}"
if [ -f "$REXUS_BUILD_DIR/manifest.webmanifest" ]; then
    echo "  Checking PWA manifest..."
    if grep -q "Rexus Gaming" "$REXUS_BUILD_DIR/manifest.webmanifest"; then
        echo -e "${GREEN}  ✅ Rexus branding found in manifest${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Rexus branding not found in manifest${NC}"
    fi
fi

# Check for gaming-specific assets
GAMING_ASSETS=("gaming-keyboard" "gaming-mouse" "gaming-headset")
for asset in "${GAMING_ASSETS[@]}"; do
    if find "$REXUS_BUILD_DIR" -name "*$asset*" | grep -q .; then
        echo -e "${GREEN}  ✅ $asset assets found${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $asset assets not found${NC}"
    fi
done

# Optional: Test deployment locally first
echo -e "${YELLOW}🧪 Would you like to preview the Rexus storefront locally? (y/n)${NC}"
read -r preview

if [ "$preview" = "y" ] || [ "$preview" = "Y" ]; then
    echo -e "${PURPLE}🌐 Starting local preview of Rexus storefront...${NC}"
    echo "🎮 This will show how the storefront will look on app.rexus.com"
    npm run preview:rexus &
    PREVIEW_PID=$!
    echo -e "${GREEN}Preview running at http://localhost:4173${NC}"
    echo -e "${PURPLE}Open your browser and check:${NC}"
    echo "  • Rexus branding and theme"
    echo "  • Gaming product displays"
    echo "  • Mobile responsiveness"
    echo "  • PWA installation prompt"
    echo ""
    echo "Press any key to continue with deployment..."
    read -r
    kill $PREVIEW_PID 2>/dev/null || true
fi

# Deploy to production (uncomment and configure for your setup)
echo -e "${PURPLE}🚀 Deploying Rexus Gaming Storefront...${NC}"

# Example deployment methods (choose one):

# Method 1: Direct copy (if deploying on same server)
# sudo cp -r "$REXUS_BUILD_DIR"/* "$DEPLOY_TARGET/"

# Method 2: rsync to remote server
# rsync -avz --delete "$REXUS_BUILD_DIR"/ user@app.rexus.com:/var/www/rexus/

# Method 3: SCP to remote server  
# scp -r "$REXUS_BUILD_DIR"/* user@app.rexus.com:/var/www/rexus/

# Method 4: Docker deployment
# docker build -t rexus-storefront -f Dockerfile.rexus .
# docker tag rexus-storefront your-registry.com/rexus-storefront:latest
# docker push your-registry.com/rexus-storefront:latest

# Method 5: AWS S3 + CloudFront deployment
# aws s3 sync "$REXUS_BUILD_DIR" s3://rexus-storefront-bucket --delete
# aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo -e "${YELLOW}⚠️  Deployment method not configured. Please uncomment and configure the appropriate deployment method in this script.${NC}"
echo -e "${BLUE}📁 Build ready for deployment at: $REXUS_BUILD_DIR${NC}"

# Post-deployment tasks
echo -e "${PURPLE}📋 Post-deployment checklist:${NC}"
echo "  📱 PWA Installation"
echo "  🎮 Gaming Product Display" 
echo "  🛒 Shopping Cart Functionality"
echo "  👤 Customer Authentication"
echo "  📊 Admin Dashboard Access (/admin)"
echo "  🎨 Rexus Theme & Branding"
echo "  📱 Mobile Responsiveness"

# Health check after deployment (customize URL)
# echo -e "${PURPLE}🏥 Performing health check...${NC}"
# curl -f https://app.rexus.com/ || echo -e "${YELLOW}⚠️  Health check failed${NC}"

echo -e "${GREEN}✅ Rexus Gaming deployment process completed!${NC}"
echo -e "${PURPLE}📋 Next steps:${NC}"
echo "  1. Configure your web server to serve files from $REXUS_BUILD_DIR"
echo "  2. Set up SSL certificate for $REXUS_DOMAIN"
echo "  3. Configure DNS to point $REXUS_DOMAIN to your server"
echo "  4. Test the deployment at https://$REXUS_DOMAIN"
echo "  5. Verify admin dashboard at https://$REXUS_DOMAIN/admin"

echo -e "${PURPLE}🎮 Rexus Gaming Store ready for app.rexus.com!${NC}"