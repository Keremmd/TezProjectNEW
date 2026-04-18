import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import quizRoutes from './routes/quiz.js';
import analyzeRoutes from './routes/analyze.js';
import flashcardRoutes from './routes/flashcards.js';
import examRoutes from './routes/exams.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser requests (curl, server-to-server) and listed origins.
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI Learning Platform API is running',
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints:`);
  console.log(`   - POST /api/quiz/generate`);
  console.log(`   - POST /api/analyze/pdf`);
  console.log(`   - POST /api/analyze/pdf/glossary`);
  console.log(`   - POST /api/analyze/pdf/ask`);
  console.log(`   - POST /api/analyze/pdf/mindmap`);
  console.log(`   - POST /api/analyze/pdf/ingest`);
  console.log(`   - GET  /api/analyze/pdf/ingest/status`);
  console.log(`   - POST /api/flashcards/generate`);
  console.log(`   - POST /api/exam/generate`);
  console.log(`   - GET  /api/exam/:id`);
  console.log(`   - POST /api/exam/:id/submit`);
  console.log(`   - GET  /api/leaderboard`);
  console.log(`   - GET  /api/health`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not set!');
    console.warn('   Get your API key from: https://aistudio.google.com/apikey');
  }
});
