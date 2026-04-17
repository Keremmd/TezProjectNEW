import express from 'express';
import {
  analyzePDF as analyzePDFGemini,
  answerQuestionAboutPDF as answerQuestionAboutPDFGemini,
  generateGlossaryFromPDF,
  generateMindMapFromPDF
} from '../utils/gemini.js';
import { supabase } from '../utils/supabase.js';
import {
  ingestPdf,
  isPdfIndexed,
  searchPdfChunks,
  formatChunksForPrompt,
} from '../utils/rag.js';

const router = express.Router();

// For Q&A we always use Gemini (Groq temporarily disabled)
const answerQuestionAboutPDF = answerQuestionAboutPDFGemini;
const analyzePDF = analyzePDFGemini;

/**
 * Helper: download a PDF from Supabase Storage and extract both the full text
 * and a per-page text array (for features that need page-grounded output).
 */
async function loadPdfWithPages(pdfId) {
  const { data: pdf, error: pdfError } = await supabase
    .from('pdfs')
    .select('*')
    .eq('id', pdfId)
    .single();

  if (pdfError || !pdf) {
    const err = new Error('PDF not found');
    err.status = 404;
    throw err;
  }

  const { data: pdfFile, error: downloadError } = await supabase
    .storage
    .from('pdfs')
    .download(pdf.file_path);

  if (downloadError) {
    const err = new Error('Failed to download PDF: ' + downloadError.message);
    err.status = 500;
    throw err;
  }

  const pdfParse = (await import('pdf-parse')).default;
  const arrayBuffer = await pdfFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pages = [];
  const pagerender = async (pageData) => {
    const textContent = await pageData.getTextContent();
    let lastY = null;
    let text = '';
    for (const item of textContent.items) {
      if (lastY === item.transform[5] || lastY === null) {
        text += item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    pages.push({ page: pageData.pageNumber, text });
    return text;
  };

  const pdfData = await pdfParse(buffer, { pagerender });
  pages.sort((a, b) => a.page - b.page);

  return {
    pdf,
    pdfData,
    pdfText: pdfData.text,
    pages,
  };
}

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
 * POST /api/analyze/pdf/glossary
 * Extract important glossary terms from a PDF using Gemini.
 */
router.post('/pdf/glossary', async (req, res) => {
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

    console.log(`📄 [Glossary] PDF text extracted: ${pdfText.length} characters`);

    const terms = await generateGlossaryFromPDF(pdfText, {
      language: 'Turkish'
    });

    return res.json({
      success: true,
      terms,
      pdf: {
        id: pdf.id,
        name: pdf.file_name,
        pages: pdfData.numpages
      }
    });
  } catch (error) {
    console.error('Error generating PDF glossary:', error);
    return res.status(500).json({
      error: 'Failed to generate glossary',
      message: error.message
    });
  }
});

/**
 * POST /api/analyze/pdf/ingest
 * Chunk, embed, and store a PDF in pdf_chunks for vector search.
 * Body: { pdfId, force?: boolean }
 */
router.post('/pdf/ingest', async (req, res) => {
  try {
    const { pdfId, force = false } = req.body || {};
    if (!pdfId) return res.status(400).json({ error: 'pdfId is required' });

    if (!force) {
      const already = await isPdfIndexed(pdfId);
      if (already) {
        return res.json({ success: true, alreadyIndexed: true, chunks: 0 });
      }
    }

    const { pages } = await loadPdfWithPages(pdfId);
    const { chunks } = await ingestPdf(pdfId, pages, { replace: true });

    res.json({ success: true, chunks });
  } catch (error) {
    console.error('Error ingesting PDF:', error);
    res.status(error.status || 500).json({
      error: 'Failed to ingest PDF',
      message: error.message,
    });
  }
});

/**
 * GET /api/analyze/pdf/ingest/status?pdfId=...
 * Returns whether the PDF has been chunked and how many chunks it has.
 */
router.get('/pdf/ingest/status', async (req, res) => {
  try {
    const pdfId = req.query.pdfId;
    if (!pdfId) return res.status(400).json({ error: 'pdfId is required' });
    const { count, error } = await supabase
      .from('pdf_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('pdf_id', pdfId);
    if (error) throw error;
    res.json({ success: true, indexed: (count || 0) > 0, chunks: count || 0 });
  } catch (error) {
    console.error('Error reading ingest status:', error);
    res.status(500).json({ error: 'Failed to read status', message: error.message });
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

    console.log(`💬 [Chat] Question for pdf ${pdfId}: ${question.slice(0, 100)}`);

    // Try RAG first. If the PDF hasn't been indexed yet, index it lazily.
    let indexed = await isPdfIndexed(pdfId);
    if (!indexed) {
      try {
        console.log(`🔍 [Chat] PDF not indexed yet, auto-ingesting...`);
        const { pages } = await loadPdfWithPages(pdfId);
        await ingestPdf(pdfId, pages, { replace: true });
        indexed = true;
      } catch (ingestErr) {
        console.warn(
          `⚠️ [Chat] Auto-ingest failed, falling back to truncated text: ${ingestErr.message}`
        );
      }
    }

    let answer;
    let usedRag = false;
    let retrievedPages = [];

    if (indexed) {
      try {
        const chunks = await searchPdfChunks(pdfId, question, {
          matchCount: 10,
          similarityThreshold: 0.15,
        });
        if (chunks.length > 0) {
          const context = formatChunksForPrompt(chunks, { maxChars: 24000 });
          retrievedPages = [...new Set(chunks.map((c) => c.page).filter(Boolean))];
          console.log(
            `🧲 [Chat] Retrieved ${chunks.length} chunks (pages: ${retrievedPages.join(', ')}), top sim: ${chunks[0].similarity?.toFixed(3)}`
          );
          answer = await answerQuestionAboutPDF(context, question, {
            isRetrieved: true,
            retrievalNote:
              'Aşağıdaki bölümler, tüm PDF içinden vektör benzerliğiyle soruya en alakalı bulunan kısımlardır.',
          });
          usedRag = true;
        } else {
          console.log(`🧲 [Chat] No relevant chunks found, falling back`);
        }
      } catch (retrErr) {
        console.warn(`⚠️ [Chat] RAG retrieval failed: ${retrErr.message}`);
      }
    }

    // Fallback: truncated raw text (original behavior)
    if (!usedRag) {
      const { pdfText } = await loadPdfWithPages(pdfId);
      answer = await answerQuestionAboutPDF(pdfText, question);
    }

    res.json({
      success: true,
      answer,
      rag: {
        used: usedRag,
        pages: retrievedPages,
      },
    });
  } catch (error) {
    console.error('Error answering PDF question:', error);
    res.status(500).json({
      error: 'Failed to answer question about PDF',
      message: error.message
    });
  }
});

/**
 * GET /api/analyze/pdf/mindmap?pdfId=...
 * Return a cached mindmap for a PDF if one exists. Never calls the AI.
 * Used by the frontend on PDF load, so users don't re-pay for generation.
 */
router.get('/pdf/mindmap', async (req, res) => {
  try {
    const pdfId = req.query.pdfId;
    if (!pdfId) {
      return res.status(400).json({ error: 'pdfId is required' });
    }

    const { data, error } = await supabase
      .from('pdf_mindmaps')
      .select('mindmap, title, language, updated_at, created_at')
      .eq('pdf_id', pdfId)
      .maybeSingle();

    if (error) {
      console.error('MindMap cache read error:', error);
      return res.status(500).json({
        error: 'Failed to read cached mindmap',
        message: error.message,
      });
    }

    if (!data) {
      return res.json({ success: true, cached: false, mindmap: null });
    }

    return res.json({
      success: true,
      cached: true,
      mindmap: data.mindmap,
      updated_at: data.updated_at,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Error reading cached mindmap:', error);
    return res.status(500).json({
      error: 'Failed to read cached mindmap',
      message: error.message,
    });
  }
});

/**
 * POST /api/analyze/pdf/mindmap
 * Generate a hierarchical mindmap (concept map) from a PDF using Gemini.
 * Each node includes a page reference for in-viewer navigation.
 *
 * Cache behavior:
 *   - By default, if a cached mindmap already exists for this PDF, we return
 *     it immediately (no AI call).
 *   - Pass { force: true } in the body to bypass the cache and regenerate.
 *   - Successful generations are upserted into pdf_mindmaps.
 */
router.post('/pdf/mindmap', async (req, res) => {
  try {
    const { pdfId, language, force } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: 'pdfId is required' });
    }

    // 1) Try cache (unless force)
    if (!force) {
      const { data: cached, error: cacheError } = await supabase
        .from('pdf_mindmaps')
        .select('mindmap, updated_at, created_at')
        .eq('pdf_id', pdfId)
        .maybeSingle();
      if (cacheError) {
        console.warn('MindMap cache lookup failed, continuing to generate:', cacheError.message);
      } else if (cached) {
        console.log(`💾 [MindMap] Returning cached mindmap for pdf ${pdfId}`);
        // Still fetch PDF meta so the response shape stays consistent.
        const { data: pdfRow } = await supabase
          .from('pdfs')
          .select('id, file_name, num_pages')
          .eq('id', pdfId)
          .single();
        return res.json({
          success: true,
          cached: true,
          mindmap: cached.mindmap,
          pdf: pdfRow
            ? {
                id: pdfRow.id,
                name: pdfRow.file_name,
                pages: pdfRow.num_pages ?? null,
              }
            : null,
        });
      }
    }

    // 2) Generate fresh
    const { pdf, pdfData, pdfText, pages } = await loadPdfWithPages(pdfId);

    console.log(
      `📄 [MindMap] PDF loaded: ${pdfText.length} chars, ${pages.length} pages (force=${!!force})`
    );

    const mindmap = await generateMindMapFromPDF(pdfText, {
      language: language || 'Turkish',
      pages,
      totalPages: pdfData.numpages,
    });

    // 3) Persist to cache (best-effort; don't fail the request on cache errors)
    try {
      const { error: upsertError } = await supabase
        .from('pdf_mindmaps')
        .upsert(
          {
            pdf_id: pdf.id,
            user_id: pdf.user_id || null,
            title: mindmap.title || null,
            mindmap,
            language: language || 'Turkish',
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'pdf_id' }
        );
      if (upsertError) {
        console.warn('⚠️ Failed to cache mindmap:', upsertError.message);
      } else {
        console.log(`💾 [MindMap] Cached mindmap for pdf ${pdf.id}`);
      }
    } catch (cacheWriteErr) {
      console.warn('⚠️ MindMap cache write threw:', cacheWriteErr.message);
    }

    return res.json({
      success: true,
      cached: false,
      mindmap,
      pdf: {
        id: pdf.id,
        name: pdf.file_name,
        pages: pdfData.numpages,
      },
    });
  } catch (error) {
    console.error('Error generating PDF mindmap:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: 'Failed to generate mindmap',
      message: error.message,
    });
  }
});

export default router;
