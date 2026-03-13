import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { analyzePDF as analyzePDFGemini, answerQuestionAboutPDF as answerQuestionAboutPDFGemini } from '../utils/gemini.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// For Q&A we always use Gemini (Groq temporarily disabled)
const answerQuestionAboutPDF = answerQuestionAboutPDFGemini;

/**
 * POST /api/analyze/pdf
 * Analyze PDF content using AI
 */
router.post('/pdf', async (req, res) => {
  try {
    const { pdfId } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: 'pdfId is required' });
    }

    // Get PDF from database
    const { data: pdf, error: pdfError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Download PDF from Supabase Storage
    const { data: pdfFile, error: downloadError } = await supabase
      .storage
      .from('pdfs')
      .download(pdf.file_path);

    if (downloadError) {
      return res.status(500).json({ 
        error: 'Failed to download PDF',
        details: downloadError.message 
      });
    }

    // Convert PDF to text
    const pdfParse = (await import('pdf-parse')).default;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;

    console.log(`📄 PDF text extracted: ${pdfText.length} characters`);

    // Analyze PDF using Gemini AI
    console.log(`🤖 Analyzing PDF content...`);
    const analysis = await analyzePDF(pdfText);

    console.log(`✅ Analysis completed`);

    res.json({
      success: true,
      analysis,
      pdf: {
        id: pdf.id,
        name: pdf.file_name,
        pages: pdfData.numpages
      }
    });

  } catch (error) {
    console.error('Error analyzing PDF:', error);
    res.status(500).json({ 
      error: 'Failed to analyze PDF',
      message: error.message 
    });
  }
});

/**
 * POST /api/analyze/pdf/ask
 * Answer a user's question about a specific PDF using Gemini,
 * strictly grounded in that PDF's content.
 */
router.post('/pdf/ask', async (req, res) => {
  try {
    const { pdfId, question } = req.body;

    if (!pdfId || !question) {
      return res.status(400).json({ error: 'pdfId and question are required' });
    }

    // Get PDF from database
    const { data: pdf, error: pdfError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Download PDF from Supabase Storage
    const { data: pdfFile, error: downloadError } = await supabase
      .storage
      .from('pdfs')
      .download(pdf.file_path);

    if (downloadError) {
      return res.status(500).json({ 
        error: 'Failed to download PDF',
        details: downloadError.message 
      });
    }

    // Convert PDF to text
    const pdfParse = (await import('pdf-parse')).default;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;

    console.log(`📄 [Chat] PDF text extracted: ${pdfText.length} characters`);
    console.log(`💬 [Chat] Question: ${question}`);

    const answer = await answerQuestionAboutPDF(pdfText, question);

    res.json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('Error answering PDF question:', error);
    res.status(500).json({
      error: 'Failed to answer question about PDF',
      message: error.message
    });
  }
});

export default router;
