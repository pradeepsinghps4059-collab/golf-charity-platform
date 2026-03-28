require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { buildSecurityHeaders, enforceHttps } = require('./middleware/security');
const { isSupabaseConfigured } = require('./services/supabaseAdmin');

const app = express();
const shouldUseMongo = process.env.USE_MONGODB === 'true' || (!isSupabaseConfigured && !!process.env.MONGODB_URI);

// Connect Mongo only when explicitly requested or when no Supabase config is present.
if (shouldUseMongo) {
  connectDB();
} else {
  console.log('Supabase mode enabled - skipping MongoDB connection.');
}
app.set('trust proxy', 1);

// Middleware
app.use(buildSecurityHeaders);
app.use(enforceHttps);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/draws', require('./routes/draws'));
app.use('/api/charities', require('./routes/charities'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
