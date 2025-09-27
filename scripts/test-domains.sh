#!/bin/bash

# Quick Domain Test for Development
# Tests both localhost and local domain access

set -e

echo "🧪 Testing Multi-Domain Setup"
echo "================================"

# Check if development server is running
if curl -s -f "http://localhost:4123/" > /dev/null; then
    echo "✅ Development server is running on port 4123"
    
    echo ""
    echo "🌐 Test URLs for DEVELOPMENT (yarn dev):"
    echo "   📊 Platform:    http://localhost:4123/?mode=platform"
    echo "   🎮 Storefront:  http://localhost:4123/?mode=tenant"
    echo ""
    echo "🏠 Alternative local domain URLs:"
    echo "   📊 Platform:    http://smartseller.local:4123/"
    echo "   🎮 Storefront:  http://app.rexus.local:4123/"
    
    # Test domain resolution
    echo ""
    echo "🔍 Testing domain resolution..."
    
    if ping -c 1 smartseller.local > /dev/null 2>&1; then
        echo "✅ smartseller.local resolves correctly"
    else
        echo "❌ smartseller.local does not resolve"
        echo "   💡 Run: ./scripts/simulate-local.sh setup (to add to hosts)"
    fi
    
    if ping -c 1 app.rexus.local > /dev/null 2>&1; then
        echo "✅ app.rexus.local resolves correctly"
    else
        echo "❌ app.rexus.local does not resolve"
        echo "   💡 Run: ./scripts/simulate-local.sh setup (to add to hosts)"
    fi
    
else
    echo "❌ Development server not running on port 4123"
    echo "💡 Start with: yarn dev"
fi

echo ""
echo "🏗️  For PRODUCTION testing (built version):"
echo "   📊 Platform:    http://smartseller.local:4173/"
echo "   🎮 Storefront:  http://app.rexus.local:4173/"
echo "   💡 Build first: npm run build:production"
echo "   💡 Preview with: npm run preview:host"

echo ""
echo "🚀 Quick Commands:"
echo "   yarn dev                    # Development server (port 4123)"
echo "   npm run build:production    # Build for testing"
echo "   npm run preview:host        # Preview built version (port 4173)"
echo "   ./scripts/simulate-local.sh # Full local simulation"