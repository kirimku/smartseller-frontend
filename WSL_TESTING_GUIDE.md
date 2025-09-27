# WSL Multi-Domain Testing Solution

## 🚨 **WSL Issue Identified**

You're running the development server in **WSL** but opening the browser in **Windows**. This creates a DNS resolution mismatch:

- **WSL** `/etc/hosts` has: `127.0.0.1 smartseller.local`
- **Windows** doesn't know about WSL's hosts file
- **Browser** (Windows) can't resolve `smartseller.local`

## 🔧 **Solutions (Choose One):**

### **Solution 1: Use WSL IP Address (Recommended)**

Your WSL IP is: `172.24.30.17`

**Test these URLs in Windows browser:**
```
📊 Platform:   http://172.24.30.17:4123/?mode=platform
🎮 Storefront: http://172.24.30.17:4123/?mode=tenant
```

### **Solution 2: Add Domains to Windows Hosts File**

1. **Open Windows hosts file as Administrator:**
   ```
   C:\Windows\System32\drivers\etc\hosts
   ```

2. **Add these lines:**
   ```
   172.24.30.17    smartseller.local
   172.24.30.17    app.rexus.local
   ```

3. **Save and restart browser**

### **Solution 3: Use Localhost (Windows → WSL)**

Since WSL forwards localhost, try:
```
📊 Platform:   http://localhost:4123/?mode=platform
🎮 Storefront: http://localhost:4123/?mode=tenant
```

### **Solution 4: Port Forwarding (Advanced)**

Make the development server accessible from Windows network interface:

1. **In WSL, start dev server with:**
   ```bash
   yarn dev --host 0.0.0.0
   ```

2. **Test from Windows browser:**
   ```
   http://172.24.30.17:4123/?mode=platform
   http://172.24.30.17:4123/?mode=tenant
   ```

## 🧪 **Quick Test Commands:**

Run these in WSL to verify server accessibility:

```bash
# Test from WSL (should work)
curl http://localhost:4123/

# Test WSL IP from WSL  
curl http://172.24.30.17:4123/

# Check if server binds to all interfaces
netstat -tlnp | grep 4123
```

## 🎯 **Recommended Testing Flow:**

1. **Start dev server with network binding:**
   ```bash
   yarn dev --host 0.0.0.0
   ```

2. **Open Windows browser and test:**
   ```
   http://172.24.30.17:4123/?mode=platform   # Platform
   http://172.24.30.17:4123/?mode=tenant     # Storefront  
   ```

3. **Or use localhost forwarding:**
   ```
   http://localhost:4123/?mode=platform      # Platform
   http://localhost:4123/?mode=tenant        # Storefront
   ```

## 💡 **Why This Happens:**

- **WSL** = Linux environment with its own network stack
- **Windows** = Host OS with different network configuration  
- **Browser** = Runs on Windows, uses Windows DNS
- **Dev Server** = Runs in WSL, may only bind to WSL interfaces

The `.local` domains work perfectly within WSL but Windows browser doesn't see WSL's hosts file!