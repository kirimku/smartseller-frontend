#!/bin/bash

# Restart Development Server with Multi-Domain Support
# This script restarts the dev server with proper local domain access

set -e

echo "🔄 Restarting Development Server for Multi-Domain Support"
echo "========================================================="

# Kill existing dev server processes
echo "🛑 Stopping existing development servers..."
pkill -f "vite" 2>/dev/null || echo "No existing vite processes found"

# Wait a moment
sleep 2

echo "🚀 Starting development server with multi-domain support..."
echo ""

# Start the development server
yarn dev &
DEV_PID=$!

# Wait for server to start
sleep 3

echo ""
echo "✅ Development server started (PID: $DEV_PID)"
echo ""
echo "🌐 Test URLs:"
echo "   📊 Platform (localhost):      http://localhost:4123/?mode=platform"
echo "   🎮 Storefront (localhost):    http://localhost:4123/?mode=tenant"
echo ""
echo "   📊 Platform (local domain):   http://smartseller.local:4123/"
echo "   🎮 Storefront (local domain): http://app.rexus.local:4123/"
echo ""
echo "🧪 Testing domain access..."

sleep 2

# Test localhost access
if curl -s -f "http://localhost:4123/" > /dev/null; then
    echo "✅ localhost:4123 is accessible"
else
    echo "❌ localhost:4123 is not accessible"
fi

# Test local domain access
if curl -s -f "http://app.rexus.local:4123/" > /dev/null; then
    echo "✅ app.rexus.local:4123 is accessible"
else
    echo "❌ app.rexus.local:4123 is not accessible"
    echo "💡 The server configuration may need adjustment"
fi

if curl -s -f "http://smartseller.local:4123/" > /dev/null; then
    echo "✅ smartseller.local:4123 is accessible"
else
    echo "❌ smartseller.local:4123 is not accessible"
fi

echo ""
echo "🎯 Ready for testing! Open the URLs above in your browser."
echo "💡 Press Ctrl+C to stop the development server"

# Keep the script running
wait $DEV_PID