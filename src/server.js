import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import routes from './routes/index.js';

dotenv.config();

const app = express();

// Trust proxy for accurate IP addresses (only trust first proxy in chain)
// Use 1 instead of true to be more specific and avoid rate-limit warnings
app.set('trust proxy', 1);

// Middleware
// Configure Helmet to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(xss());

// CORS configuration - accept multiple origins for development and production
const allowedOrigins = [];

// Add origins from FRONTEND_URL if defined
if (process.env.FRONTEND_URL) {
  const urls = process.env.FRONTEND_URL.split(',').map(url => url.trim()).filter(url => url);
  allowedOrigins.push(...urls);
}

// Add localhost for development or if explicitly allowed
if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCALHOST === 'true') {
  if (!allowedOrigins.includes('http://localhost:3000')) {
    allowedOrigins.push('http://localhost:3000');
  }
}

// If no origins configured, default to localhost (development)
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:3000');
}

// Log allowed origins for debugging
console.log('🌐 Allowed CORS origins:', allowedOrigins);
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
console.log('🌐 ALLOW_LOCALHOST:', process.env.ALLOW_LOCALHOST);
console.log('🌐 FRONTEND_URL:', process.env.FRONTEND_URL);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Check if origin matches any Vercel pattern (for preview deployments)
    // If FRONTEND_URL contains a vercel.app domain, allow all *.vercel.app subdomains
    const vercelDomains = allowedOrigins.filter(url => url.includes('vercel.app'));
    if (vercelDomains.length > 0) {
      try {
        const originUrl = new URL(origin);
        // Check if origin is a vercel.app subdomain
        if (originUrl.hostname.endsWith('.vercel.app')) {
          // Extract base domain (e.g., 'celvox-bank.vercel.app' from 'celvox-bank-xxx.vercel.app')
          const baseDomains = vercelDomains.map(url => {
            try {
              const urlObj = new URL(url);
              const parts = urlObj.hostname.split('.');
              // Get the base domain (e.g., 'celvox-bank' from 'celvox-bank.vercel.app')
              if (parts.length >= 3 && parts[parts.length - 2] === 'vercel' && parts[parts.length - 1] === 'app') {
                return parts.slice(0, -2).join('.');
              }
            } catch (e) {
              return null;
            }
          }).filter(Boolean);
          
          const originBase = originUrl.hostname.split('.').slice(0, -2).join('.');
          if (baseDomains.some(base => originBase.startsWith(base))) {
            console.log(`✅ CORS allowed Vercel preview: ${origin}`);
            return callback(null, true);
          }
        }
      } catch (e) {
        // Invalid URL, continue to check
      }
    }
    
    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    console.warn(`⚠️ Allowed origins:`, allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: {
    trustProxy: false // Disable trust proxy validation warning
  }
});

app.use('/api/', limiter);

// Routes
app.use('/api', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Render provides PORT environment variable, fallback to APP_PORT or 4000
const PORT = process.env.PORT || process.env.APP_PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

