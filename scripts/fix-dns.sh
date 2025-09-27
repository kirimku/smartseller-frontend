#!/bin/bash

# DNS Resolution Troubleshooting Script
# Helps fix local domain resolution issues

set -e

echo "🔍 DNS Resolution Troubleshooting"
echo "================================="

echo ""
echo "1️⃣ Testing current DNS resolution..."

# Test ping
if ping -c 1 smartseller.local &>/dev/null; then
    echo "✅ smartseller.local pings successfully"
    echo "   $(ping -c 1 smartseller.local 2>&1 | head -1)"
else
    echo "❌ smartseller.local ping failed"
fi

# Test nslookup
echo ""
echo "🔍 DNS Server Resolution:"
nslookup smartseller.local 2>&1 || echo "❌ DNS lookup failed"

# Check hosts file
echo ""
echo "2️⃣ Checking hosts file..."
if grep -q "smartseller.local" /etc/hosts; then
    echo "✅ Found in hosts file:"
    grep smartseller /etc/hosts
else
    echo "❌ NOT found in hosts file"
fi

# Test browser methods
echo ""
echo "🌐 Browser Testing Options:"
echo ""
echo "OPTION 1: Use IP address directly"
echo "   📊 Platform:   http://127.0.0.1:4123/"
echo "   🎮 Storefront: http://127.0.0.1:4123/"
echo "   💡 Then check browser console to see which mode is detected"

echo ""
echo "OPTION 2: Use localhost with URL parameters" 
echo "   📊 Platform:   http://localhost:4123/?mode=platform"
echo "   🎮 Storefront: http://localhost:4123/?mode=tenant"

echo ""
echo "OPTION 3: Fix DNS resolution"
echo "   💡 Try one of these commands:"
echo "   sudo systemctl restart systemd-resolved"
echo "   sudo service network-manager restart" 
echo "   sudo /etc/init.d/networking restart"

echo ""
echo "OPTION 4: Use different browser"
echo "   💡 Some browsers cache DNS - try:"
echo "   - Chrome incognito mode"
echo "   - Firefox private window"
echo "   - Different browser entirely"

echo ""
echo "OPTION 5: Manual DNS flush"
echo "   💡 Clear DNS cache:"
echo "   sudo systemd-resolve --flush-caches"
echo "   sudo resolvectl flush-caches"

echo ""
echo "🧪 QUICK TEST - Try these URLs now:"
echo "   http://127.0.0.1:4123/"
echo "   http://localhost:4123/?mode=platform"
echo "   http://localhost:4123/?mode=tenant"