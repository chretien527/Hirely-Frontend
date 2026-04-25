require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

connectDB();

const app = express();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'));
const allowedOrigins = [...new Set(
  [process.env.FRONTEND_URL, ...(process.env.FRONTEND_URLS || '').split(',')]
    .map(value => value?.trim())
    .filter(Boolean)
)];

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.set('trust proxy', process.env.RENDER === 'true' || process.env.TRUST_PROXY === 'true');
app.use('/uploads', express.static(uploadDir));

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const screenLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use('/api', limiter);

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/jobs',       require('./routes/jobs'));
app.use('/api/platform',   require('./routes/platform'));
app.use('/api/messages',   require('./routes/messages'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/screenings', screenLimiter, require('./routes/screenings'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ success: false, message: `${req.method} ${req.path} not found.` }));
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[API] Hirely running on :${PORT}`));
