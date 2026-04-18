import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { supabase } from './supabase.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Embedding models, tried in order. Output is forced to 768 dims to match
 * our pdf_chunks.embedding (vector(768)) column.
 *
 * As of Apr 2026, the older `text-embedding-004` / `embedding-001` endpoints
 * return 404 on v1beta. The current GA model is `gemini-embedding-001`,
 * which natively returns 3072 dims but supports Matryoshka truncation to
 * 768 via the `outputDimensionality` parameter. We re-normalize the
 * truncated vector to unit length (required for cosine similarity after MRL
 * truncation).
 *
 * Rate limits (free tier): ~1500 req/min, up to 100 items per batch.
 */
const EMBED_MODEL_CANDIDATES =
  (process.env.GEMINI_EMBED_MODEL ? [process.env.GEMINI_EMBED_MODEL] : []).concat([
    'gemini-embedding-001',
    'gemini-embedding-2-preview',
    // Legacy fallbacks — kept for keys/regions where they still work.
    'text-embedding-004',
    'embedding-001',
  ]);
const EMBED_DIM = 768;

/**
 * L2-normalize a vector in place. Needed after truncating a Matryoshka
 * embedding to a lower dimension so cosine similarity stays meaningful.
 */
function normalizeVector(vec) {
  if (!Array.isArray(vec) || vec.length === 0) return vec;
  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  const norm = Math.sqrt(sumSq);
  if (!norm || !isFinite(norm)) return vec;
  for (let i = 0; i < vec.length; i++) vec[i] = vec[i] / norm;
  return vec;
}

let _resolvedEmbedModelName = null;
let _resolvedEmbedModel = null;

/**
 * Check whether a given model name needs outputDimensionality=768 to match
 * our pgvector(768) schema. gemini-embedding-* defaults to 3072; the legacy
 * models already return 768 natively.
 */
function modelNeedsTruncation(name) {
  return /^gemini-embedding/i.test(name || '');
}

async function probeEmbedModel() {
  if (_resolvedEmbedModel) return _resolvedEmbedModel;
  let lastErr;
  for (const name of EMBED_MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const probePayload = {
        content: { parts: [{ text: 'ping' }], role: 'user' },
      };
      if (modelNeedsTruncation(name)) {
        probePayload.outputDimensionality = EMBED_DIM;
      }
      const probeRes = await model.embedContent(probePayload);
      const dim = probeRes?.embedding?.values?.length;
      if (dim && dim !== EMBED_DIM) {
        console.warn(
          `⚠️ [RAG] Model "${name}" returned ${dim}-dim vector but DB expects ${EMBED_DIM}, skipping.`
        );
        continue;
      }
      console.log(`🧬 [RAG] Using embedding model: ${name} (${EMBED_DIM}-dim)`);
      _resolvedEmbedModelName = name;
      _resolvedEmbedModel = model;
      return model;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || '');
      if (msg.includes('404') || msg.includes('not found')) {
        console.warn(`⚠️ [RAG] Embedding model "${name}" not available, trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error(
    `No working Gemini embedding model found. Last error: ${lastErr?.message || lastErr}`
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/**
 * Split a single string into chunks of ~chunkSize chars, trying to break on
 * paragraph/sentence boundaries, with a small overlap for context continuity.
 *
 * @param {string} text
 * @param {{ chunkSize?: number, overlap?: number, minSize?: number }} options
 * @returns {string[]}
 */
export function splitIntoChunks(text, options = {}) {
  const { chunkSize = 1000, overlap = 150, minSize = 80 } = options;
  if (!text) return [];
  const normalized = text.replace(/\r\n?/g, '\n').trim();
  if (normalized.length <= chunkSize) return [normalized];

  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    // Try to break on a sentence/paragraph boundary if we're not at the end
    if (end < normalized.length) {
      const windowStart = start + Math.floor(chunkSize * 0.5);
      const candidates = [
        normalized.lastIndexOf('\n\n', end),
        normalized.lastIndexOf('. ', end),
        normalized.lastIndexOf('.\n', end),
        normalized.lastIndexOf('! ', end),
        normalized.lastIndexOf('? ', end),
        normalized.lastIndexOf('\n', end),
      ].filter((p) => p >= windowStart);
      if (candidates.length > 0) {
        end = Math.max(...candidates) + 1;
      }
    }

    const slice = normalized.slice(start, end).trim();
    if (slice.length >= minSize) chunks.push(slice);

    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

/**
 * Chunk an array of { page, text } (per-page extraction) while keeping track
 * of which page each chunk originated from. Chunks mostly stay within a
 * single page but may span a page break if a page is very short.
 *
 * @param {Array<{page: number, text: string}>} pages
 * @param {Object} options
 * @returns {Array<{ chunk_index: number, page: number, text: string }>}
 */
export function chunkPages(pages, options = {}) {
  const result = [];
  let globalIndex = 0;
  for (const { page, text } of pages || []) {
    if (!text || text.trim().length < 30) continue;
    const pieces = splitIntoChunks(text, options);
    for (const piece of pieces) {
      result.push({
        chunk_index: globalIndex++,
        page,
        text: piece,
      });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

/**
 * Embed a single text. Use taskType='RETRIEVAL_QUERY' for user questions
 * and taskType='RETRIEVAL_DOCUMENT' for stored chunks.
 *
 * @param {string} text
 * @param {{taskType?: string, title?: string}} options
 * @returns {Promise<number[]>} 768-dim vector
 */
export async function embedText(text, options = {}) {
  const { taskType = 'RETRIEVAL_DOCUMENT', title = null } = options;
  const model = await probeEmbedModel();
  const needsTrunc = modelNeedsTruncation(_resolvedEmbedModelName);
  const payload = {
    content: { parts: [{ text }], role: 'user' },
    taskType,
  };
  if (title && taskType === 'RETRIEVAL_DOCUMENT') payload.title = title;
  if (needsTrunc) payload.outputDimensionality = EMBED_DIM;
  try {
    const res = await model.embedContent(payload);
    const values = res.embedding?.values || [];
    return needsTrunc ? normalizeVector(values) : values;
  } catch (err) {
    // If this model silently broke after probe (rare), clear cache and retry once.
    const msg = String(err?.message || '');
    if (msg.includes('404') || msg.includes('not found')) {
      _resolvedEmbedModel = null;
      _resolvedEmbedModelName = null;
      const retryModel = await probeEmbedModel();
      const retryNeedsTrunc = modelNeedsTruncation(_resolvedEmbedModelName);
      const retryPayload = { ...payload };
      if (retryNeedsTrunc) retryPayload.outputDimensionality = EMBED_DIM;
      else delete retryPayload.outputDimensionality;
      const res = await retryModel.embedContent(retryPayload);
      const values = res.embedding?.values || [];
      return retryNeedsTrunc ? normalizeVector(values) : values;
    }
    throw err;
  }
}

/**
 * Embed many texts in one API call. Gemini allows up to 100 requests in a
 * single batchEmbedContents call.
 *
 * @param {string[]} texts
 * @param {{taskType?: string, batchSize?: number, retries?: number}} options
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(texts, options = {}) {
  const { taskType = 'RETRIEVAL_DOCUMENT', batchSize = 80, retries = 3 } = options;
  let model = await probeEmbedModel();
  let needsTrunc = modelNeedsTruncation(_resolvedEmbedModelName);
  const out = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const requests = batch.map((text) => {
      const req = {
        content: { parts: [{ text }], role: 'user' },
        taskType,
      };
      if (needsTrunc) req.outputDimensionality = EMBED_DIM;
      return req;
    });

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await model.batchEmbedContents({ requests });
        const embeddings = (res.embeddings || []).map((e) => {
          const v = e.values || [];
          return needsTrunc ? normalizeVector(v.slice()) : v;
        });
        if (embeddings.length !== batch.length) {
          throw new Error(
            `Embedding count mismatch (expected ${batch.length}, got ${embeddings.length})`
          );
        }
        out.push(...embeddings);
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        const msg = String(err?.message || '');
        if (msg.includes('404') || msg.includes('not found')) {
          // Reset and re-probe, maybe fallback model works.
          console.warn(`⚠️ Embedding model broke mid-batch, re-probing...`);
          _resolvedEmbedModel = null;
          _resolvedEmbedModelName = null;
          try {
            model = await probeEmbedModel();
            needsTrunc = modelNeedsTruncation(_resolvedEmbedModelName);
            // Rebuild this batch's requests with the new model's truncation mode.
            for (const req of requests) {
              if (needsTrunc) req.outputDimensionality = EMBED_DIM;
              else delete req.outputDimensionality;
            }
            continue;
          } catch (probeErr) {
            throw probeErr;
          }
        }
        const isRetryable =
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('overloaded');
        if (!isRetryable || attempt === retries) break;
        const m = msg.match(/retry in ([\d.]+)s/i);
        const wait = m ? Math.ceil(Number(m[1]) * 1000) + 500 : 1500 * Math.pow(2, attempt);
        console.warn(
          `⚠️ Embedding batch ${i / batchSize + 1} retryable error, waiting ${wait}ms`
        );
        await sleep(wait);
      }
    }
    if (lastError) throw lastError;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Ingestion + Search
// ---------------------------------------------------------------------------

/**
 * Check whether a PDF already has chunks indexed.
 */
export async function isPdfIndexed(pdfId) {
  const { count, error } = await supabase
    .from('pdf_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('pdf_id', pdfId);
  if (error) {
    console.warn('isPdfIndexed error:', error.message);
    return false;
  }
  return (count || 0) > 0;
}

/**
 * Remove any existing chunks for a PDF (used for re-indexing).
 */
export async function clearPdfChunks(pdfId) {
  const { error } = await supabase.from('pdf_chunks').delete().eq('pdf_id', pdfId);
  if (error) throw new Error(`Failed to clear chunks: ${error.message}`);
}

/**
 * Chunk + embed + store a PDF.
 *
 * @param {string} pdfId
 * @param {Array<{page: number, text: string}>} pages - per-page text
 * @param {Object} options
 * @returns {Promise<{ chunks: number }>}
 */
export async function ingestPdf(pdfId, pages, options = {}) {
  const { chunkSize = 1000, overlap = 150, replace = true } = options;

  const pieces = chunkPages(pages, { chunkSize, overlap });
  if (pieces.length === 0) {
    return { chunks: 0 };
  }
  console.log(`🔍 [RAG] Ingesting pdf ${pdfId} → ${pieces.length} chunks`);

  if (replace) await clearPdfChunks(pdfId);

  const texts = pieces.map((p) => p.text);
  const embeddings = await embedBatch(texts, { taskType: 'RETRIEVAL_DOCUMENT' });

  // Sanity check vector dim
  if (embeddings[0] && embeddings[0].length !== EMBED_DIM) {
    throw new Error(
      `Embedding dim mismatch: expected ${EMBED_DIM}, got ${embeddings[0].length}`
    );
  }

  const rows = pieces.map((p, i) => ({
    pdf_id: pdfId,
    chunk_index: p.chunk_index,
    page: p.page,
    token_count: Math.ceil(p.text.length / 4),
    text: p.text,
    embedding: embeddings[i],
  }));

  // Supabase insert in batches of 200 to stay under request-size limits.
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('pdf_chunks').insert(slice);
    if (error) throw new Error(`pdf_chunks insert failed: ${error.message}`);
  }

  console.log(`✅ [RAG] Indexed ${rows.length} chunks for pdf ${pdfId}`);
  return { chunks: rows.length };
}

/**
 * Similarity search within a PDF for a user query. Returns most relevant
 * chunks ordered by similarity (descending).
 *
 * @param {string} pdfId
 * @param {string} query
 * @param {{matchCount?: number, similarityThreshold?: number}} options
 * @returns {Promise<Array<{id,chunk_index,page,text,similarity}>>}
 */
export async function searchPdfChunks(pdfId, query, options = {}) {
  const { matchCount = 8, similarityThreshold = 0.2 } = options;
  const embedding = await embedText(query, { taskType: 'RETRIEVAL_QUERY' });
  if (!embedding?.length) return [];

  const { data, error } = await supabase.rpc('match_pdf_chunks', {
    query_embedding: embedding,
    match_pdf_id: pdfId,
    match_count: matchCount,
    similarity_threshold: similarityThreshold,
  });
  if (error) {
    console.error('match_pdf_chunks error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Build a prompt-ready context string from retrieved chunks, with page
 * citations so the model can ground its answer.
 *
 * @param {Array<{page?: number, text: string, similarity?: number}>} chunks
 * @param {{maxChars?: number}} options
 */
export function formatChunksForPrompt(chunks, options = {}) {
  const { maxChars = 24000 } = options;
  let total = 0;
  const parts = [];
  for (const c of chunks) {
    const header = c.page ? `[p.${c.page}]` : `[chunk ${c.chunk_index ?? ''}]`;
    const piece = `${header} ${c.text.trim()}`;
    if (total + piece.length + 2 > maxChars) break;
    parts.push(piece);
    total += piece.length + 2;
  }
  return parts.join('\n\n');
}
