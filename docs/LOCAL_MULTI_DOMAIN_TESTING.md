# Local Multi-Domain Testing Guide

This guide shows you how to simulate the production multi-domain setup on your local development machine.

## 🎯 **What We're Simulating**

In production:
- `smartseller.com` → Platform Management Interface
- `app.rexus.com` → Rexus Gaming Storefront

Locally:
- `smartseller.local` → Platform Management Interface  
- `app.rexus.local` → Rexus Gaming Storefront

**Same codebase, different experiences!**

---

## 🚀 **Quick Start (Automated)**

```bash
# Run the automated simulation script
./scripts/simulate-local.sh setup

# This will:
# 1. Add local domains to your hosts file
# 2. Build the application
# 3. Start the preview server
# 4. Show you test URLs
```

Then visit:
- **Platform**: http://smartseller.local:4173
- **Storefront**: http://app.rexus.local:4173

---

## 🔧 **Manual Setup (Step by Step)**

### **Step 1: Add Local Domains to Hosts File**

Edit your hosts file:
```bash
sudo nano /etc/hosts
```

Add these lines:
```
# SmartSeller Multi-Domain Local Testing
127.0.0.1    smartseller.local
127.0.0.1    www.smartseller.local
127.0.0.1    app.rexus.local
127.0.0.1    www.app.rexus.local
# End SmartSeller Multi-Domain
```

### **Step 2: Build the Application**

```bash
npm run build:production
```

### **Step 3: Start Preview Server**

```bash
npm run preview:host
```

### **Step 4: Test Both Domains**

Open two browser tabs:

1. **Platform**: http://smartseller.local:4173
   - Should show: "Platform Dashboard" interface
   - Theme: Blue colors, admin-focused UI

2. **Storefront**: http://app.rexus.local:4173  
   - Should show: "Rexus Gaming Store" interface
   - Theme: Gaming colors, product-focused UI

---

## 🧪 **Testing Checklist**

### **Domain Detection Testing**
- [ ] Visit `smartseller.local:4173` → Shows Platform Dashboard
- [ ] Visit `app.rexus.local:4173` → Shows Rexus Gaming Store
- [ ] Check browser console for domain detection logs
- [ ] Verify different page titles in browser tabs

### **Routing Testing**
- [ ] Platform routes work: `/platform/dashboard`
- [ ] Storefront routes work: `/`, `/products`, `/admin`
- [ ] Navigation between sections works correctly
- [ ] 404 pages display appropriate content

### **Theme Testing**  
- [ ] Different colors/branding per domain
- [ ] Different logos/favicons
- [ ] Different navigation menus
- [ ] Different footer content

### **PWA Testing**
- [ ] Both domains show "Install App" prompt
- [ ] Service worker registers correctly
- [ ] Offline functionality works

---

## 📱 **Network Testing (Mobile/Other Devices)**

Test from other devices on your network:

1. **Find your local IP**:
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. **Access from mobile/tablet**:
   - Platform: `http://YOUR_IP:4173/?domain=platform`
   - Storefront: `http://YOUR_IP:4173/?domain=tenant`

3. **Add to mobile hosts** (if rooted/jailbroken):
   ```
   YOUR_IP    smartseller.local
   YOUR_IP    app.rexus.local
   ```

---

## 🔍 **Debugging Domain Detection**

### **Browser Console Logs**
When you visit each domain, check the browser console for:
```
🌐 Domain Detection Debug
Hostname: smartseller.local
App Mode: platform
Tenant Slug: rexus-gaming
API Base URL: http://localhost:3001/platform
Environment: Development
```

### **Inspect Network Requests**
- Check if API calls go to different endpoints
- Verify PWA manifest URLs are domain-specific
- Confirm asset loading paths are correct

### **Test URL Parameters (Fallback)**
If hosts file doesn't work, use URL parameters:
- Platform: `http://localhost:4173/?mode=platform`
- Storefront: `http://localhost:4173/?mode=tenant`

---

## 🛠️ **Development Workflow**

### **Daily Development**
```bash
# Start development with hot-reload
npm run dev

# Test multi-domain locally  
./scripts/simulate-local.sh setup
```

### **Before Deployment**
```bash
# Test production build locally
./scripts/simulate-local.sh setup

# Verify both domains work correctly
# Check console for any errors
# Test PWA functionality
```

---

## 🧹 **Cleanup**

### **Remove Local Domains**
```bash
# Automated cleanup
./scripts/simulate-local.sh cleanup

# Manual cleanup
sudo sed -i '/# SmartSeller Multi-Domain/,/# End SmartSeller/d' /etc/hosts
```

### **Stop Preview Server**
Press `Ctrl+C` in the terminal where the server is running.

---

## 🚨 **Troubleshooting**

### **Domain Doesn't Resolve**
- Verify hosts file entries are correct
- Try `ping smartseller.local` to test DNS resolution
- Check if antivirus/firewall is blocking local DNS

### **Same UI Shows for Both Domains**  
- Check browser console for domain detection logs
- Clear browser cache and reload
- Verify build includes latest domain detection code

### **Preview Server Won't Start**
- Check if port 4173 is already in use: `lsof -i :4173`
- Try different port: `npm run preview:host -- --port 5173`

### **Mobile Testing Issues**
- Ensure mobile device is on same network
- Check firewall settings on development machine
- Try IP address instead of local domains

---

## 💡 **Pro Tips**

1. **Browser Bookmarks**: Bookmark both local URLs for quick testing
2. **Different Browsers**: Test in Chrome, Firefox, Safari for compatibility  
3. **Incognito Mode**: Test without cache/cookies interference
4. **Developer Tools**: Use mobile simulation in browser dev tools
5. **Network Throttling**: Test with slow 3G simulation

---

## 🎉 **What You'll See**

### **smartseller.local:4173**
- Platform management interface
- Blue theme colors  
- Admin navigation menu
- "SmartSeller Platform" title

### **app.rexus.local:4173**  
- Gaming storefront interface
- Red/gaming theme colors
- Product catalog navigation
- "Rexus Gaming Store" title

**Same JavaScript bundle, completely different user experiences!** 🌐✨