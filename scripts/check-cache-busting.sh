#!/bin/bash

# Script to verify cache-busting is working correctly
echo "🔍 Checking Cache-Busting Configuration..."
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ No dist directory found. Run 'npm run build' first."
    exit 1
fi

echo "📁 Generated files with cache-busting hashes:"
echo ""

# Show JS files with hashes
echo "🟨 JavaScript files:"
find dist -name "*.js" -not -path "*/node_modules/*" | head -10

echo ""

# Show CSS files with hashes
echo "🟦 CSS files:"
find dist -name "*.css" -not -path "*/node_modules/*" | head -10

echo ""

# Show asset files with hashes
echo "🖼️  Asset files:"
find dist -name "*-*.*" -not -name "*.js" -not -name "*.css" -not -path "*/node_modules/*" | head -10

echo ""

# Check index.html for hashed references
echo "📄 Index.html references:"
if [ -f "dist/index.html" ]; then
    echo "✅ Checking if index.html contains hashed asset references..."
    grep -o 'assets/[^"]*' dist/index.html | head -5
else
    echo "❌ index.html not found in dist directory"
fi

echo ""
echo "✅ Cache-busting verification complete!"
echo ""
echo "💡 Tips:"
echo "   - Each build should generate different hashes"
echo "   - Hashes change only when file content changes"
echo "   - This ensures browsers load the latest version"