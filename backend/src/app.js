require("dotenv").config();
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const connectToDatabase = require("./utils/db");
const serverless = require('serverless-http');

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://gaminggarage.store',
      'https://www.gaminggarage.store'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cookie',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Additional CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://gaminggarage.store',
    'https://www.gaminggarage.store'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, Cache-Control, Pragma');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n=== REQUEST DEBUG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body);
    console.log('====================');
  } else {
    // Minimal logging in production
    console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  }
  next();
});

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/manyhackpanel',
    collectionName: 'sessions',
    touchAfter: 24 * 3600, // lazy session update
    stringify: false,
    serialize: (session) => {
      return JSON.stringify(session);
    },
    unserialize: (serialized) => {
      return JSON.parse(serialized);
    }
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true for production (HTTPS)
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production cross-origin
    domain: process.env.NODE_ENV === 'production' ? '.gaminggarage.store' : undefined // Set domain for production
  }
};

// Log session configuration in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Session configuration:', {
    secure: sessionConfig.cookie.secure,
    sameSite: sessionConfig.cookie.sameSite,
    domain: sessionConfig.cookie.domain,
    NODE_ENV: process.env.NODE_ENV
  });
}

app.use(session(sessionConfig));

// Session debugging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('\n=== SESSION MIDDLEWARE DEBUG ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
    console.log('Cookies in request:', req.headers.cookie);
    console.log('================================\n');
    next();
  });
}

// Connect to MongoDB at the top level
connectToDatabase().then(() => {
  console.log("MongoDB connected (serverless)");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Routes - Order matters! More specific routes first
app.use("/api/admin", require("./routes/adminAuth"));
app.use("/api/admin/users", require("./routes/adminUser"));
app.use("/api/admin/stats", require("./routes/adminStats"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/product"));
app.use("/api/keys", require("./routes/key"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/notice", require("./routes/notice"));
app.use("/api/referral", require("./routes/referral"));
require("./models/TopUpPlan");
require("./models/ReferralCode");
require("./models/BalanceHistory");
require("./models/Session");

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Session debug endpoint
app.get("/api/session-debug", (req, res) => {
  res.json({
    message: "Session debug info",
    sessionId: req.sessionID,
    sessionExists: !!req.session,
    sessionData: req.session ? {
      userId: req.session.userId,
      isAdmin: req.session.isAdmin,
      sessionId: req.session.sessionId,
      keys: Object.keys(req.session)
    } : null,
    cookies: req.headers.cookie,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Admin session test endpoint
app.get("/api/admin/session-test", (req, res) => {
  console.log('=== ADMIN SESSION TEST ===');
  console.log('Request origin:', req.headers.origin);
  console.log('Request cookies:', req.headers.cookie);
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Session userId:', req.session?.userId);
  console.log('Session isAdmin:', req.session?.isAdmin);
  console.log('==========================');
  
  res.json({
    message: "Admin session test",
    sessionId: req.sessionID,
    sessionExists: !!req.session,
    isAdmin: req.session?.isAdmin || false,
    userId: req.session?.userId || null,
    cookies: req.headers.cookie,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Debug route to check environment variables
app.get("/debug/env", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    SESSION_SECRET: process.env.SESSION_SECRET ? "SET" : "NOT SET",
    FRONTEND_URL: process.env.FRONTEND_URL,
    MONGO_URI: process.env.MONGO_URI ? "SET" : "NOT SET",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME ? "SET" : "NOT SET",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "SET" : "NOT SET",
    JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET"
  });
});

// Debug route to check database connection
app.get("/debug/db", async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      connectionState: states[connectionState],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route to test admin login
app.post("/debug/admin-login", async (req, res) => {
  try {
    console.log('=== DEBUG ADMIN LOGIN TEST ===');
    console.log('Request body:', req.body);
    console.log('Environment variables:');
    console.log('- ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
    console.log('- ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET');
    console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'NOT SET');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('===============================');
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.json({ 
        error: "Missing username or password",
        received: { username: !!username, password: !!password }
      });
    }
    
    const credentialsMatch = username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD;
    
    res.json({
      received: { username, password: password ? 'PROVIDED' : 'NOT PROVIDED' },
      expected: { 
        username: process.env.ADMIN_USERNAME, 
        password: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET' 
      },
      credentialsMatch,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT SET'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Debug route to check session store
app.get("/debug/session-store", async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const sessions = await mongoose.connection.db.collection('sessions').find({}).toArray();
    
    res.json({
      totalSessions: sessions.length,
      sessions: sessions.map(s => ({
        _id: s._id,
        expires: s.expires,
        session: s.session ? JSON.parse(s.session) : null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// API route not found handler
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found" });
  }
  next();
});

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.log('CORS Error:', err.message);
    console.log('Origin:', req.headers.origin);
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    
    return res.status(403).json({
      message: 'CORS policy violation',
      origin: req.headers.origin,
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://gaminggarage.store',
        'https://www.gaminggarage.store'
      ]
    });
  }
  next(err);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Headers:', req.headers);
  console.error('========================');
  
  // Always return JSON for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).send("Internal server error");
});

// Export for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}