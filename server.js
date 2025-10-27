import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const app = express();
const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Enable CORS for all routes
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API status endpoint
app.get('/api/status', (req, res) => {
  // Use host.docker.internal when running in Docker, localhost otherwise
  const backendUrl = process.env.DOCKER_ENV ? 'http://host.docker.internal:8090' : 'http://localhost:8090';
  res.json({
    status: 'OK',
    backend: backendUrl,
    timestamp: new Date().toISOString()
  });
});

// Runtime configuration endpoint
app.get('/config.js', (req, res) => {
  const config = {
    VITE_BACKEND_HOST: process.env.VITE_BACKEND_HOST || process.env.VITE_API_BASE_URL || 'http://localhost:8090',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || process.env.VITE_BACKEND_HOST || 'http://localhost:8090',
    VITE_DOMAIN: process.env.VITE_DOMAIN || 'http://localhost:4173',
    VITE_TENANT_SLUG: process.env.VITE_TENANT_SLUG || 'rexus-gaming',
    VITE_TENANT_ID: process.env.VITE_TENANT_ID || 'rexus-001',
    VITE_APP_NAME: process.env.VITE_APP_NAME || 'SmartSeller Development',
    VITE_DEFAULT_CURRENCY: process.env.VITE_DEFAULT_CURRENCY || 'IDR',
    VITE_DEFAULT_LANGUAGE: process.env.VITE_DEFAULT_LANGUAGE || 'en-US'
  };

  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.__RUNTIME_CONFIG__ = ${JSON.stringify(config, null, 2)};`);
});

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'", 
          "http://localhost:8090",
          "https://localhost:8090",
          "http://host.docker.internal:8090",
          "https://host.docker.internal:8090",
          "https://smartseller-api.preproduction.kirimku.com",
          "https://*.kirimku.com"
        ],
      }
    },
    crossOriginEmbedderPolicy: false, 
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Enable compression
app.use(compression());

// Serve static files with proper caching
app.use(
  express.static(DIST_DIR, {
    etag: true,
    lastModified: true,
    maxAge: (filePath) => {
      // Cache static assets for 1 year
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return 31536000000; // 1 year
      }
      // Don't cache HTML files
      if (filePath.endsWith('.html')) {
        return 0;
      }
      // Default cache for other files
      return 86400000; // 1 day
    },
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`SmartSeller Frontend server running on port ${PORT}`);
  console.log(`Backend API expected at: http://localhost:8090`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});