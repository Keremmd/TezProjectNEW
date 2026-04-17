import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import quizRoutes from './routes/quiz.js';
import analyzeRoutes from './routes/analyze.js';
import flashcardRoutes from './routes/flashcards.js';
import examRoutes from './routes/exams.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/exam', examRoutes);

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
  console.log(`   - GET  /api/health`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not set!');
    console.warn('   Get your API key from: https://aistudio.google.com/apikey');
  }
});
