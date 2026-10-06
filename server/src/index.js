import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import dashboardRoutes from './routes/dashboard.js';
import chatRoutes from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isSupabaseConfigured } from './config/supabase.js';

dotenv.config();

// Required Production Environment Variables Validation
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET', 'GEMINI_API_KEY', 'CLIENT_URL'];

if (process.env.NODE_ENV === 'production') {
  const missing = requiredEnvVars.filter((key) => !process.env[key] || process.env[key].includes('your_'));
  if (missing.length > 0) {
    console.error(`❌ FATAL: Missing required production environment variables: ${missing.join(', ')}`);
    console.error('Please configure all environment variables in your deployment dashboard before starting.');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Trust Proxy for Render rate-limiting compatibility
app.set('trust proxy', 1);

// CORS configuration supporting single or comma-separated origins in CLIENT_URL
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrl
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS Error: Origin ${origin} is not allowed by CLIENT_URL policy.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'BillSense AI API',
    timestamp: new Date().toISOString(),
    supabaseConfigured: isSupabaseConfigured(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use(errorHandler);

// Listen on 0.0.0.0 for cloud platform compatibility (Render, Heroku, etc.)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`🚀 BillSense Server running on port ${PORT}`);
  console.log(`🌐 Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`📊 Database Connected: ${isSupabaseConfigured() ? 'Supabase PostgreSQL & Storage' : 'In-Memory Development Mode'}`);
  console.log(`=================================`);
});
