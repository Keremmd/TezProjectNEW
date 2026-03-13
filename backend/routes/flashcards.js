import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateFlashcardsFromPDF as generateFlashcardsGemini } from '../utils/gemini.js';
import dotenv from 'dotenv';

dotenv.config();

// Always use Gemini for flashcard generation (Groq temporarily disabled)
const generateFlashcardsFromPDF = generateFlashcardsGemini;

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * POST /api/flashcards/generate
 * Generate flashcard pairs from a PDF (AI). Returns { title, cards }.
 * Frontend creates flashcard_deck + flashcards in Supabase.
 */
router.post('/generate', async (req, res) => {
  try {
    const { pdfId, cardCount = 12, language = 'Turkish' } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: 'pdfId is required' });
    }

    const { data: pdf, error: pdfError } = await supabase
      .from('pdfs')
      .select('id, file_name, file_path')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const { data: pdfFile, error: downloadError } = await supabase.storage
      .from('pdfs')
      .download(pdf.file_path);

    if (downloadError) {
      return res.status(500).json({
        error: 'Failed to download PDF',
        details: downloadError.message,
      });
    }

    const pdfParse = (await import('pdf-parse')).default;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.length < 50) {
      return res.status(400).json({ error: 'PDF has no extractable text' });
    }

    const cards = await generateFlashcardsFromPDF(pdfText, {
      cardCount: Math.min(Number(cardCount) || 12, 30),
      language: language || 'Turkish',
    });

    const title = pdf.file_name.replace(/\.pdf$/i, '') || 'Flashcards';

    res.json({ title, cards });
  } catch (error) {
    console.error('Flashcards generate error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate flashcards',
    });
  }
});

export default router;
