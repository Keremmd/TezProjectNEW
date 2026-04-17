import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get Gemini model instance.
 * Model can be overridden via .env: GEMINI_MODEL=gemini-2.5-flash
 * If you get "limit: 0" / 429: this project has no free-tier quota — create a new
 * project in https://aistudio.google.com and use its API key, or enable billing.
 */
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
export function getGeminiModel(modelName = DEFAULT_MODEL) {
  console.log(`🤖 Using Gemini model: ${modelName}`);
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.6,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 16384,
    }
  });
}

/**
 * Generate quiz questions from PDF content
 * @param {string} pdfText - Extracted text from PDF
 * @param {Object} options - Quiz generation options
 * @returns {Promise<Array>} Generated quiz questions
 */
export async function generateQuizFromPDF(pdfText, options = {}) {
  const {
    questionCount = 10,
    difficulty = 'medium',
    language = 'Turkish'
  } = options;

  const model = getGeminiModel();

  const prompt = `You are an expert, strict exam writer. Create EXACTLY ${questionCount} multiple-choice questions in ${language} based ONLY on the PDF below. Take your time: each question must require real understanding, not memorization.

GLOBAL RULES (CRITICAL):
- You MUST treat the provided PDF content as your ONLY source of truth.
- Do NOT use any outside knowledge, training data, or assumptions that are not explicitly supported by the PDF text.
- If something is not clearly stated or directly implied in the PDF, you must NOT base a question or answer on it.
- The "questions" array in the JSON MUST contain EXACTLY ${questionCount} items — never more, never fewer.

DIFFICULTY:
- Target difficulty level: "${difficulty}" (one of: easy, medium, hard).
- For "easy": focus on fundamental definitions and direct facts from the text.
- For "medium": mix understanding questions, simple applications and short reasoning.
- For "hard": emphasize analysis, cause-effect, application, comparison and "which conclusion is correct?" styles.

STYLE:
- Questions: LONG and DETAILED. Each question must be at least 2–3 full sentences. Pose scenarios, compare alternatives, or ask "According to the text, why / how / when...?" Do not ask one-line trivia.
- Options: LONG and DETAILED. Each option must be a full sentence or two (or a clear list of points), explaining the answer. Never use options like "Only X" or 2–3 words. Wrong options must be plausible but clearly wrong given the text.
- Do NOT use "Tüm yukarıdaki", "Yukarıdakilerin hiçbiri", "All of the above" or "None of the above".
- Each question must be answerable only from the PDF. explanation: 1–2 sentences citing the text and why the answer is correct.

PDF Content:
${pdfText.substring(0, 30000)}

Return ONLY valid JSON, no markdown, no other text. Format (options and correct_answer must be full, detailed text):

{
  "questions": [
    {
      "question_text": "Uzun, detaylı soru metni; en az 2 cümle, senaryo veya karşılaştırma içerebilir.",
      "options": [
        "İlk seçenek: tam cümle(ler) veya maddeler halinde açıklama.",
        "İkinci seçenek: aynı şekilde detaylı.",
        "Üçüncü seçenek: detaylı.",
        "Dördüncü seçenek: detaylı."
      ],
      "correct_answer": "Doğru seçeneğin options içindeki metni birebir.",
      "explanation": "Metinde nerede geçiyor ve neden doğru (1–2 cümle).",
      "points": 1
    }
  ]
}

Exactly ${questionCount} questions. The JSON MUST have ${questionCount} questions in the "questions" array. Language: ${language}. Return ONLY the JSON object.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    console.log('📝 Raw AI response length:', text.length);
    
    // Clean the response more aggressively
    text = text
      .replace(/```json\n?/gi, '')
      .replace(/```javascript\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();
    
    // Find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('AI did not return valid JSON format');
    }
    
    const cleanText = jsonMatch[0];
    
    // Try to parse JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', cleanText.substring(0, 500));
      throw new Error('Invalid JSON from AI: ' + parseError.message);
    }
    
    if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
      throw new Error('AI response missing questions array');
    }

    let questions = jsonResponse.questions;

    // Enforce exact question count: never more, never fewer
    if (questions.length > questionCount) {
      console.warn(
        `⚠️ AI returned ${questions.length} questions, trimming to exactly ${questionCount}`,
      );
      questions = questions.slice(0, questionCount);
    } else if (questions.length < questionCount) {
      console.error(
        `❌ AI returned only ${questions.length} questions (expected ${questionCount})`,
      );
      throw new Error(
        `AI returned fewer questions than requested (${questions.length}/${questionCount})`,
      );
    }

    console.log(`✅ Successfully generated exactly ${questions.length} questions`);
    return questions;
  } catch (error) {
    console.error('❌ Error generating quiz:', error.message);
    throw new Error('Failed to generate quiz questions: ' + error.message);
  }
}

/**
 * Analyze PDF content and generate summary
 * @param {string} pdfText - Extracted text from PDF
 * @returns {Promise<Object>} Analysis result with summary and key points
 */
export async function analyzePDF(pdfText) {
  const model = getGeminiModel();

  const prompt = `You are an expert educational content analyzer.

GLOBAL RULES (CRITICAL):
- You MUST treat the provided PDF content as your ONLY source of truth.
- Do NOT use any outside knowledge, training data, or assumptions that are not explicitly supported by the PDF text.
- Summaries, key points and difficulty must be grounded ONLY in what appears in the PDF.

Analyze the following PDF content and provide:
1. A concise summary (2-3 sentences in Turkish)
2. 5-7 key points or main topics
3. Recommended study time (in minutes)
4. Difficulty level (easy/medium/hard)

PDF Content:
${pdfText.substring(0, 20000)}

Return the response in this EXACT JSON format (no markdown):
{
  "summary": "Brief summary in Turkish",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "study_time": 45,
  "difficulty": "medium",
  "topics": ["Topic 1", "Topic 2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    throw new Error('Failed to analyze PDF: ' + error.message);
  }
}

/**
 * Answer a user's question about a PDF, strictly using ONLY the PDF content.
 * If the answer is not clearly in the PDF, respond that it cannot be answered.
 * @param {string} pdfText - Extracted text from PDF
 * @param {string} question - User's question
 * @returns {Promise<string>} Answer in Turkish, grounded in the PDF
 */
export async function answerQuestionAboutPDF(pdfText, question, options = {}) {
  const {
    isRetrieved = false,
    retrievalNote = '',
  } = options;

  const model = getGeminiModel('gemini-2.5-flash');

  // If caller passed pre-retrieved, page-cited chunks we trust them as the
  // full context. Otherwise we trim raw text as a fallback.
  const context = isRetrieved ? pdfText : pdfText.substring(0, 20000);

  const retrievalHint = isRetrieved
    ? `(Aşağıda PDF'ten soruyla en alakalı bölümler, sayfa numaralarıyla [p.X] olarak işaretlendi.)`
    : '';

  const prompt = `Sen, öğrencilere yardımcı olan çok dikkatli bir asistanısın.

GLOBAL KURAL (ÇOK ÖNEMLİ):
- SADECE aşağıdaki PDF içeriğine dayanarak cevap verebilirsin.
- PDF dışında, genel kültüründen veya eğitildiğin verilerden hiçbir bilgi kullanmayacaksın.
- PDF'de açıkça yazmayan veya doğrudan çıkarılamayan hiçbir bilgiyi tahmin etmeyecek, uydurmayacak veya genişletmeyeceksin.

EK KURALLAR:
- Eğer soru PDF'de açık ve net bir şekilde yanıtlanmıyorsa, şu cümleyi aynen yaz:
- "Bu soru, verilen PDF içeriğine dayanarak yanıtlanamıyor."
- PDF dışı genel bilgi, tahmin veya yorum ekleme.
- Cevaplarını Türkçe yaz.
- Mümkünse cevabında hangi sayfalardan faydalandığını "(s. X)" şeklinde belirt.
${retrievalNote ? `- ${retrievalNote}` : ''}
${retrievalHint}

--- PDF İÇERİĞİ (sadece buraya dayan, dış bilgi kullanma) ---
${context}
--- PDF İÇERİĞİ SONU ---

Kullanıcının sorusu:
${question}

PDF'ye dayanarak Türkçe cevabın:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text() || '';

    // Temizlik: olası markdown veya code fence kaldır
    text = text
      .replace(/```(?:markdown|text)?/gi, '')
      .trim();

    return text;
  } catch (error) {
    console.error('Error answering PDF question:', error);
    throw new Error('Failed to answer question about PDF: ' + error.message);
  }
}

/**
 * Generate flashcard pairs (front/back) from PDF content.
 * @param {string} pdfText - Extracted text from PDF
 * @param {Object} options - { cardCount, language }
 * @returns {Promise<Array<{ front: string, back: string }>>}
 */
export async function generateFlashcardsFromPDF(pdfText, options = {}) {
  const { cardCount = 12, language = 'Turkish' } = options;

  const model = getGeminiModel();

  const prompt = `You are an expert educator. Create ${cardCount} flashcard pairs for studying, based ONLY on the PDF content below. Each card has a "front" (question or term) and "back" (answer or definition). Use ${language}.

GLOBAL RULES (CRITICAL):
- You MUST treat the provided PDF content as your ONLY source of truth.
- Do NOT use any outside knowledge, training data, or assumptions that are not explicitly supported by the PDF text.
- If something is not clearly stated or directly implied in the PDF, you must NOT invent or extend it.

RULES:
- Front: clear question or key term/concept from the text.
- Back: concise answer or definition, based only on the PDF. Can be 1-3 sentences.
- No trivia; focus on important concepts, definitions, cause-effect, and "how/why" questions.
- Each card must be answerable only from the given content.

PDF Content:
${pdfText.substring(0, 20000)}

Return ONLY valid JSON, no markdown:
{
  "cards": [
    { "front": "Question or term in ${language}", "back": "Answer or definition" }
  ]
}

Exactly ${cardCount} cards. Return ONLY the JSON object.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.cards || !Array.isArray(parsed.cards)) throw new Error('AI response missing cards array');
    const cards = parsed.cards.map((c) => ({
      front: typeof c.front === 'string' ? c.front.trim() : String(c.front),
      back: typeof c.back === 'string' ? c.back.trim() : String(c.back),
    })).filter((c) => c.front && c.back);
    console.log(`✅ Generated ${cards.length} flashcards (Gemini)`);
    return cards;
  } catch (error) {
    console.error('❌ Gemini flashcards error:', error.message);
    throw new Error('Failed to generate flashcards: ' + error.message);
  }
}

/**
 * Extract important glossary terms from a PDF.
 * @param {string} pdfText - Extracted text from PDF
 * @param {Object} options - { language }
 * @returns {Promise<Array<{ term: string, definition: string, category?: string, importance?: "high"|"medium"|"low" }>>}
 */
export async function generateGlossaryFromPDF(pdfText, options = {}) {
  const { language = 'Turkish' } = options;

  const model = getGeminiModel();

  const prompt = `You are an expert educator creating a concise GLOSSARY for students.

GLOBAL RULES (CRITICAL):
- You MUST treat the provided PDF content as your ONLY source of truth.
- Do NOT use any outside knowledge, training data, or assumptions that are not explicitly supported by the PDF text.
- If a term is not clearly present or explained in the PDF, you must NOT include it.

TASK:
- Identify the MOST IMPORTANT technical terms, concepts or key phrases from the PDF.
- Focus on concepts that are critical for understanding the material (definitions, key processes, classifications, important principles).
- Use ${language} for all output.
- Aim for 8–20 entries depending on how rich the text is.

For each term provide:
- "term": short name of the concept (1–5 words).
- "definition": short, student‑friendly explanation (1–3 sentences) based ONLY on the PDF.
- "category": optional high‑level group, e.g. "tanım", "tehlike türü", "önlem", "ilke".
- "importance": one of "high", "medium", "low" (relative importance for exam study).

PDF Content:
${pdfText.substring(0, 20000)}

Return ONLY valid JSON (no markdown) in this exact format:
{
  "terms": [
    {
      "term": "kısa kavram adı",
      "definition": "PDF'ye dayalı, 1–3 cümlelik açıklama.",
      "category": "tanım",
      "importance": "high"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON for glossary');
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.terms || !Array.isArray(parsed.terms)) {
      throw new Error('AI response missing terms array');
    }

    const terms = parsed.terms
      .map((t) => ({
        term: typeof t.term === 'string' ? t.term.trim() : String(t.term || ''),
        definition:
          typeof t.definition === 'string'
            ? t.definition.trim()
            : String(t.definition || ''),
        category:
          typeof t.category === 'string'
            ? t.category.trim()
            : t.category
            ? String(t.category)
            : null,
        importance:
          t.importance === 'high' || t.importance === 'medium' || t.importance === 'low'
            ? t.importance
            : 'medium',
      }))
      .filter((t) => t.term && t.definition);

    console.log(`✅ Generated ${terms.length} glossary terms (Gemini)`);
    return terms;
  } catch (error) {
    console.error('❌ Gemini glossary error:', error.message);
    throw new Error('Failed to generate glossary: ' + error.message);
  }
}

/**
 * Sleep helper.
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Call a Gemini generateContent with automatic retry on transient 5xx errors
 * (mainly 503 "high demand"). Each retry waits with exponential backoff.
 *
 * @param {object} model - result of getGeminiModel()
 * @param {string} prompt
 * @param {object} options - { retries = 3, baseDelayMs = 1500 }
 * @returns {Promise<string>} raw response text
 */
async function generateWithRetry(model, prompt, options = {}) {
  const {
    retries = 3,
    baseDelayMs = 1500,
    retryOnRateLimit = false,
    maxRateLimitWaitMs = 25000,
  } = options;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      const msg = String(error?.message || '');
      const isTransient =
        msg.includes('503') ||
        msg.includes('overloaded') ||
        msg.includes('Service Unavailable') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE');
      const isRateLimit = msg.includes('429') || msg.includes('quota');

      if (attempt === retries) throw error;
      if (!isTransient && !(retryOnRateLimit && isRateLimit)) throw error;

      let delay;
      if (isRateLimit) {
        // Parse API-suggested retryDelay ("Please retry in 18.49s") if present.
        const m = msg.match(/retry in ([\d.]+)s/i);
        const suggestedMs = m ? Math.ceil(Number(m[1]) * 1000) : 15000;
        delay = Math.min(suggestedMs + 500, maxRateLimitWaitMs);
      } else {
        delay = baseDelayMs * Math.pow(2, attempt);
      }
      console.warn(
        `⚠️ Gemini ${isRateLimit ? 'rate-limit' : 'transient'} error (attempt ${
          attempt + 1
        }/${retries + 1}): ${msg.slice(0, 160)}... retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

/**
 * Build a compact, page-labeled representation of a PDF so the model can
 * ground mindmap nodes to page numbers.
 *
 * @param {Array<{ page: number, text: string }>} pages
 * @param {number} maxChars
 * @returns {string}
 */
function buildPageAnnotatedText(pages, maxChars = 24000) {
  if (!Array.isArray(pages) || pages.length === 0) return '';
  const perPageBudget = Math.max(
    400,
    Math.floor(maxChars / Math.min(pages.length, 40))
  );
  const chunks = [];
  let used = 0;
  for (const p of pages) {
    if (used >= maxChars) break;
    const raw = (p.text || '').replace(/\s+/g, ' ').trim();
    if (!raw) continue;
    const remaining = maxChars - used;
    const slice = raw.slice(0, Math.min(perPageBudget, remaining));
    const block = `=== PAGE ${p.page} ===\n${slice}`;
    chunks.push(block);
    used += block.length + 1;
  }
  return chunks.join('\n\n');
}

/**
 * Generate a hierarchical mindmap tree from PDF content.
 * Each node includes a page reference (best-effort) so the UI can jump to it.
 *
 * @param {string} pdfText - Full extracted text (fallback if no per-page data).
 * @param {Object} options - { language, pages: [{page, text}], totalPages }
 * @returns {Promise<{ title: string, root: MindMapNode }>}
 *
 * MindMapNode = {
 *   id: string,
 *   label: string,
 *   summary?: string,
 *   page?: number,
 *   children?: MindMapNode[]
 * }
 */
export async function generateMindMapFromPDF(pdfText, options = {}) {
  const {
    language = 'Turkish',
    pages = null,
    totalPages = null,
  } = options;

  const primaryModel = getGeminiModel();
  const fallbackModel = getGeminiModel('gemini-2.5-flash-lite');

  const groundedText = Array.isArray(pages) && pages.length > 0
    ? buildPageAnnotatedText(pages, 24000)
    : (pdfText || '').substring(0, 24000);

  const totalPagesHint = totalPages || (Array.isArray(pages) ? pages.length : null);

  const prompt = `You are an expert educator creating a CONCEPT MAP / MIND MAP for students.

GLOBAL RULES (CRITICAL):
- You MUST treat the provided PDF content as your ONLY source of truth.
- Do NOT use any outside knowledge, training data, or assumptions that are not explicitly supported by the PDF text.
- If something is not clearly stated or directly implied in the PDF, you must NOT include it.
- Use ${language} for all labels and summaries.

TASK:
- Build a hierarchical mindmap that captures the TOPIC STRUCTURE of the document.
- The single "root" node is the main subject of the PDF (derived from the content).
- Under the root, create 3–7 main branches representing the major sections / themes.
- Each main branch should have 2–6 child concepts. Go at most 3 levels deep (root → branch → leaf → optional sub-leaf).
- Each label must be SHORT (1–6 words). Each "summary" is 1 short sentence describing the concept using only PDF facts.
- For EVERY node below the root, include a "page" field with the PDF page number where that concept is discussed. Use the "=== PAGE N ===" markers in the input below to decide the page. If genuinely uncertain, use the nearest plausible page. Pages must be integers between 1 and ${totalPagesHint || 'the last page'}.
- Use stable short "id" strings (e.g. "n1", "n1-1", "n1-1-2"). Ids must be unique.

PDF Content (page-annotated):
${groundedText}

Return ONLY valid JSON (no markdown, no comments) in this EXACT format:
{
  "title": "Mindmap title in ${language}",
  "root": {
    "id": "root",
    "label": "Main subject",
    "summary": "One-line description of the document.",
    "children": [
      {
        "id": "n1",
        "label": "Branch topic",
        "summary": "What this branch covers.",
        "page": 2,
        "children": [
          {
            "id": "n1-1",
            "label": "Sub-concept",
            "summary": "One-line explanation grounded in PDF.",
            "page": 3,
            "children": []
          }
        ]
      }
    ]
  }
}`;

  try {
    let text;
    try {
      text = await generateWithRetry(primaryModel, prompt, {
        retries: 2,
        baseDelayMs: 1500,
      });
    } catch (primaryError) {
      const msg = String(primaryError?.message || '');
      const isTransient =
        msg.includes('503') ||
        msg.includes('overloaded') ||
        msg.includes('Service Unavailable') ||
        msg.includes('high demand');
      if (!isTransient) throw primaryError;
      console.warn('⚠️ Primary mindmap model overloaded, falling back to gemini-2.5-flash-lite');
      text = await generateWithRetry(fallbackModel, prompt, {
        retries: 2,
        baseDelayMs: 1500,
      });
    }
    text = text
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON for mindmap');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.root || typeof parsed.root !== 'object') {
      throw new Error('AI response missing root node');
    }

    const maxPage = totalPagesHint || 9999;
    const usedIds = new Set();
    let autoCounter = 0;

    const normalize = (node, depth = 0, parentId = 'root') => {
      if (!node || typeof node !== 'object') return null;
      let id = typeof node.id === 'string' && node.id.trim() ? node.id.trim() : '';
      if (!id || usedIds.has(id)) {
        autoCounter += 1;
        id = `${parentId}-${autoCounter}`;
      }
      usedIds.add(id);

      const label = typeof node.label === 'string' ? node.label.trim() : '';
      const summary = typeof node.summary === 'string' ? node.summary.trim() : '';
      let page = null;
      if (typeof node.page === 'number' && Number.isFinite(node.page)) {
        const p = Math.round(node.page);
        if (p >= 1 && p <= maxPage) page = p;
      }

      const rawChildren = Array.isArray(node.children) ? node.children : [];
      const children = [];
      for (const child of rawChildren) {
        const normChild = normalize(child, depth + 1, id);
        if (normChild) children.push(normChild);
      }

      if (!label) return null;
      return {
        id,
        label: label.slice(0, 120),
        summary: summary.slice(0, 280),
        page: depth === 0 ? null : page,
        children,
      };
    };

    const root = normalize(parsed.root, 0, 'root');
    if (!root) throw new Error('Root node could not be normalized');

    const countNodes = (n) =>
      1 + (n.children || []).reduce((s, c) => s + countNodes(c), 0);
    console.log(`✅ Generated mindmap with ${countNodes(root)} nodes (Gemini)`);

    return {
      title:
        typeof parsed.title === 'string' && parsed.title.trim()
          ? parsed.title.trim().slice(0, 140)
          : root.label,
      root,
    };
  } catch (error) {
    console.error('❌ Gemini mindmap error:', error.message);
    const msg = String(error?.message || '');
    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('Service Unavailable') || msg.includes('high demand')) {
      const e = new Error(
        'Gemini şu anda çok yoğun. Lütfen birkaç dakika sonra tekrar deneyin.'
      );
      e.status = 503;
      throw e;
    }
    if (msg.includes('429') || msg.includes('quota')) {
      const e = new Error(
        'Gemini API kotası doldu. Lütfen daha sonra tekrar deneyin veya farklı bir API anahtarı kullanın.'
      );
      e.status = 429;
      throw e;
    }
    throw new Error('Failed to generate mindmap: ' + error.message);
  }
}

/**
 * Generate an exam section from combined PDF content. Supports multiple
 * question types: mcq, open, cloze, true_false, short.
 *
 * @param {string} combinedText - Merged text from one or more PDFs
 * @param {Object} section - { name, type, count, difficulty, points_per_question }
 * @param {Object} options - { language, questionStartIndex }
 * @returns {Promise<Array<Question>>}
 *
 * Question shape:
 *   {
 *     question_type: 'mcq'|'open'|'cloze'|'true_false'|'short',
 *     question_text: string,
 *     options?: string[] (mcq),
 *     correct_answer?: string (mcq/cloze/true_false/short),
 *     expected_answer?: string (open),
 *     points: number
 *   }
 */
/**
 * Generate an ENTIRE exam (all sections) in ONE Gemini call.
 * Much more friendly to free-tier rate limits (1 request vs N requests).
 *
 * @param {string} combinedText
 * @param {Array} sections - [{ name, type, count, difficulty, points_per_question }]
 * @param {Object} options - { language }
 * @returns {Promise<Array<Question & { section_name: string }>>}
 */
export async function generateExamInOneCall(combinedText, sections, options = {}) {
  const { language = 'Turkish' } = options;
  if (!Array.isArray(sections) || sections.length === 0) return [];

  const primaryModel = getGeminiModel();
  const fallbackModel = getGeminiModel('gemini-2.5-flash-lite');

  // Build per-section specs for the prompt.
  const sectionSpecs = sections.map((s, i) => {
    const count = Math.max(1, Math.min(30, Number(s.count) || 5));
    const pts = Math.max(1, Math.min(50, Number(s.points_per_question) || 1));
    const diff = s.difficulty || 'medium';
    const type = s.type || 'mcq';
    const name = s.name || `Bölüm ${i + 1}`;
    return { index: i, name, type, count, difficulty: diff, points_per_question: pts };
  });

  const typeGuide = `QUESTION TYPE FIELD REQUIREMENTS:
- mcq → Provide "options" (EXACTLY 4 full-sentence strings, no "All/None of the above"), "correct_answer" (must be one of the options, copied verbatim).
- true_false → Provide "correct_answer": either "Doğru"/"Yanlış" (Turkish) or "True"/"False" (English).
- cloze → "question_text" must contain EXACTLY ONE blank marked with "____" (four underscores). Provide "correct_answer" as the missing term/short phrase.
- short → Provide "correct_answer": a single word, short phrase, or single sentence.
- open → Provide "expected_answer": an ideal 3-8 sentence answer used as a grading rubric (no "correct_answer" needed).`;

  const sectionsJson = sectionSpecs
    .map(
      (s) =>
        `  - index: ${s.index} | name: "${s.name}" | type: "${s.type}" | count: ${s.count} | difficulty: "${s.difficulty}" | points_per_question: ${s.points_per_question}`
    )
    .join('\n');

  const prompt = `You are an expert, strict exam writer. Build ONE complete exam paper in ${language} based ONLY on the PDF content below.

GLOBAL RULES (CRITICAL):
- The PDF content is your ONLY source of truth. Do NOT use outside knowledge.
- Produce EXACTLY the requested count of questions for EACH section.
- Questions must require real understanding, not trivial memorization.
- Difficulty guidance:
    * easy   → fundamental definitions and direct facts
    * medium → understanding, simple application, short reasoning
    * hard   → analysis, cause-effect, application, synthesis, comparison

SECTIONS TO PRODUCE (in order):
${sectionsJson}

${typeGuide}

OUTPUT FORMAT (return ONLY valid JSON, no markdown, no comments):
{
  "sections": [
    {
      "index": 0,
      "name": "<copy of the section name>",
      "questions": [
        {
          "question_type": "<mcq|open|cloze|true_false|short>",
          "question_text": "...",
          "options": ["...","...","...","..."],      // only for mcq
          "correct_answer": "...",                    // for mcq/true_false/cloze/short
          "expected_answer": "...",                   // only for open
          "points": <number>
        }
      ]
    }
  ]
}

PDF Content:
${combinedText.substring(0, 28000)}

Return ONLY the JSON object. Language: ${language}.`;

  const run = async (model) => {
    return await generateWithRetry(model, prompt, {
      retries: 3,
      baseDelayMs: 1500,
      retryOnRateLimit: true,
      maxRateLimitWaitMs: 25000,
    });
  };

  let raw;
  try {
    raw = await run(primaryModel);
  } catch (err) {
    const msg = String(err?.message || '');
    const isOverloaded =
      msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand');
    const isQuota = msg.includes('429') || msg.includes('quota');
    if (!isOverloaded && !isQuota) throw err;
    console.warn('⚠️ Exam one-call: primary model failed, falling back to lite');
    try {
      raw = await run(fallbackModel);
    } catch (err2) {
      const msg2 = String(err2?.message || '');
      if (msg2.includes('503') || msg2.includes('overloaded')) {
        const e = new Error('Gemini şu anda çok yoğun. Lütfen birkaç dakika sonra tekrar deneyin.');
        e.status = 503;
        throw e;
      }
      if (msg2.includes('429') || msg2.includes('quota')) {
        const e = new Error(
          'Gemini ücretsiz kotası doldu (dakikada 5 istek limiti). Lütfen ~1 dk bekleyip tekrar deneyin veya API key kotanızı artırın.'
        );
        e.status = 429;
        throw e;
      }
      throw err2;
    }
  }

  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI did not return valid JSON for exam');
  const parsed = JSON.parse(m[0]);
  if (!Array.isArray(parsed.sections)) {
    throw new Error('AI response missing sections array');
  }

  // Normalize + align to requested spec.
  const out = [];
  for (const spec of sectionSpecs) {
    const aiSection =
      parsed.sections.find((s) => Number(s.index) === spec.index) ||
      parsed.sections.find((s) => (s.name || '').trim() === spec.name) ||
      parsed.sections[spec.index];
    if (!aiSection || !Array.isArray(aiSection.questions)) continue;

    const questions = aiSection.questions
      .slice(0, spec.count)
      .map((q) => {
        if (!q || typeof q !== 'object') return null;
        const type = spec.type; // trust spec over what AI returned
        const out = {
          question_type: type,
          question_text: (typeof q.question_text === 'string' ? q.question_text : '').trim(),
          points: Number.isFinite(q.points) ? Number(q.points) : spec.points_per_question,
          section_name: spec.name,
        };
        if (!out.question_text) return null;

        if (type === 'mcq') {
          const opts = Array.isArray(q.options)
            ? q.options.map((o) => (typeof o === 'string' ? o : String(o || '')).trim()).filter(Boolean)
            : [];
          if (opts.length < 2) return null;
          out.options = opts.slice(0, 4);
          out.correct_answer = (q.correct_answer || '').toString().trim();
          if (!out.correct_answer) return null;
        } else if (type === 'open') {
          out.expected_answer = (q.expected_answer || '').toString().trim();
        } else if (type === 'cloze') {
          out.correct_answer = (q.correct_answer || '').toString().trim();
          if (!out.correct_answer) return null;
          if (!out.question_text.includes('____')) {
            out.question_text = out.question_text.replace(/_{2,}/, '____');
            if (!out.question_text.includes('____')) out.question_text += ' ____';
          }
        } else if (type === 'true_false') {
          const ca = (q.correct_answer || '').toString().trim().toLowerCase();
          if (['true', 'doğru', 'dogru'].includes(ca)) {
            out.correct_answer = language === 'Turkish' ? 'Doğru' : 'True';
          } else if (['false', 'yanlış', 'yanlis'].includes(ca)) {
            out.correct_answer = language === 'Turkish' ? 'Yanlış' : 'False';
          } else return null;
        } else if (type === 'short') {
          out.correct_answer = (q.correct_answer || '').toString().trim();
          if (!out.correct_answer) return null;
        }
        return out;
      })
      .filter(Boolean);

    console.log(`✅ Exam section "${spec.name}" (${spec.type}): ${questions.length}/${spec.count}`);
    out.push(...questions);
  }

  if (out.length === 0) throw new Error('No questions could be generated.');
  return out;
}

export async function generateExamSection(combinedText, section, options = {}) {
  const { language = 'Turkish' } = options;
  const {
    name = 'Bölüm',
    type = 'mcq',
    count = 5,
    difficulty = 'medium',
    points_per_question = 1,
  } = section;

  if (count <= 0) return [];

  const primaryModel = getGeminiModel();
  const fallbackModel = getGeminiModel('gemini-2.5-flash-lite');

  const difficultyHint =
    difficulty === 'easy'
      ? 'fundamental definitions and direct facts'
      : difficulty === 'hard'
      ? 'analysis, cause-effect, application, synthesis and comparison'
      : 'understanding, simple application and short reasoning';

  let typeSpecific = '';
  let shape = '';

  if (type === 'mcq') {
    typeSpecific = `Create ${count} multiple-choice questions with EXACTLY 4 options. Each option must be a full, detailed sentence (never 2-3 words). Wrong options must be plausible but clearly wrong given the text. Do NOT use "All of the above" / "None of the above".`;
    shape = `{
  "question_type": "mcq",
  "question_text": "Detaylı, senaryo veya karşılaştırma içerebilir en az 2 cümle.",
  "options": ["Seçenek A tam cümle", "Seçenek B tam cümle", "Seçenek C tam cümle", "Seçenek D tam cümle"],
  "correct_answer": "Doğru seçeneğin options içindeki metni birebir.",
  "points": ${points_per_question}
}`;
  } else if (type === 'open') {
    typeSpecific = `Create ${count} OPEN-ENDED (essay/klasik) questions that require 3-8 sentences to answer. Each question should test real understanding.`;
    shape = `{
  "question_type": "open",
  "question_text": "Klasik soru metni. Öğrenciden 3-8 cümlelik cevap bekleyen, çıkarım/analiz gerektiren bir soru.",
  "expected_answer": "Örnek ideal cevap (rubric için). 3-8 cümle, PDF'e dayalı anahtar noktaları içerir.",
  "points": ${points_per_question}
}`;
  } else if (type === 'cloze') {
    typeSpecific = `Create ${count} FILL-IN-THE-BLANK questions. Each question must contain EXACTLY ONE blank, marked with four underscores "____". The blank replaces a key term or short phrase from the text.`;
    shape = `{
  "question_type": "cloze",
  "question_text": "Örnek: Mitokondri, hücrenin ____ merkezidir.",
  "correct_answer": "enerji üretim",
  "points": ${points_per_question}
}`;
  } else if (type === 'true_false') {
    typeSpecific = `Create ${count} TRUE/FALSE statements based strictly on the text. Mix correct and incorrect statements. Use "Doğru" or "Yanlış" (Turkish) or "True"/"False" (English) as correct_answer.`;
    shape = `{
  "question_type": "true_false",
  "question_text": "PDF'e dayanan bir iddia (tek cümle).",
  "correct_answer": "Doğru",
  "points": ${points_per_question}
}`;
  } else if (type === 'short') {
    typeSpecific = `Create ${count} SHORT-ANSWER questions whose answer is a single word, a short phrase, or a single sentence derivable from the text.`;
    shape = `{
  "question_type": "short",
  "question_text": "Kısa cevap gerektiren bir soru.",
  "correct_answer": "Kısa cevap (tek kelime / kısa ifade).",
  "points": ${points_per_question}
}`;
  } else {
    throw new Error(`Unsupported question type: ${type}`);
  }

  const prompt = `You are an expert, strict exam writer. Create EXACTLY ${count} questions for the "${name}" section of a real exam paper. All questions must be in ${language}.

GLOBAL RULES (CRITICAL):
- Treat the provided PDF content as your ONLY source of truth.
- Do NOT use outside knowledge.
- If something is not clearly stated or directly implied in the PDF, do NOT base a question or answer on it.
- The output JSON's "questions" array MUST have EXACTLY ${count} items.

DIFFICULTY: "${difficulty}" — focus on ${difficultyHint}.

TASK FOR THIS SECTION:
${typeSpecific}

PDF Content:
${combinedText.substring(0, 26000)}

Return ONLY valid JSON (no markdown, no comments):
{
  "questions": [
    ${shape}
  ]
}

Exactly ${count} questions. Language: ${language}. Return ONLY the JSON object.`;

  const generate = async (model) => {
    const text = await generateWithRetry(model, prompt, {
      retries: 2,
      baseDelayMs: 1500,
    });
    return text;
  };

  try {
    let raw;
    try {
      raw = await generate(primaryModel);
    } catch (err) {
      const msg = String(err?.message || '');
      const isTransient =
        msg.includes('503') ||
        msg.includes('overloaded') ||
        msg.includes('Service Unavailable') ||
        msg.includes('high demand');
      if (!isTransient) throw err;
      console.warn(`⚠️ Exam section "${name}" primary model overloaded, falling back`);
      raw = await generate(fallbackModel);
    }

    const cleaned = raw
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON for exam section');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('AI response missing questions array');
    }

    let questions = parsed.questions;
    if (questions.length > count) questions = questions.slice(0, count);

    const normalized = questions
      .map((q) => {
        if (!q || typeof q !== 'object') return null;
        const out = {
          question_type: type,
          question_text: (typeof q.question_text === 'string' ? q.question_text : '').trim(),
          points: Number.isFinite(q.points) ? Number(q.points) : points_per_question,
        };
        if (!out.question_text) return null;

        if (type === 'mcq') {
          const opts = Array.isArray(q.options)
            ? q.options
                .map((o) => (typeof o === 'string' ? o.trim() : String(o || '').trim()))
                .filter(Boolean)
            : [];
          if (opts.length < 2) return null;
          out.options = opts.slice(0, 4);
          out.correct_answer =
            typeof q.correct_answer === 'string' ? q.correct_answer.trim() : '';
          if (!out.correct_answer) return null;
        } else if (type === 'open') {
          out.expected_answer =
            typeof q.expected_answer === 'string' ? q.expected_answer.trim() : '';
        } else if (type === 'cloze') {
          out.correct_answer =
            typeof q.correct_answer === 'string' ? q.correct_answer.trim() : '';
          if (!out.correct_answer) return null;
          if (!out.question_text.includes('____')) {
            out.question_text = out.question_text.replace(/_{2,}/, '____');
            if (!out.question_text.includes('____')) {
              out.question_text = out.question_text + ' ____';
            }
          }
        } else if (type === 'true_false') {
          const ca = typeof q.correct_answer === 'string' ? q.correct_answer.trim() : '';
          const norm = ca.toLowerCase();
          if (['true', 'doğru', 'dogru'].includes(norm)) {
            out.correct_answer = language === 'Turkish' ? 'Doğru' : 'True';
          } else if (['false', 'yanlış', 'yanlis'].includes(norm)) {
            out.correct_answer = language === 'Turkish' ? 'Yanlış' : 'False';
          } else {
            return null;
          }
        } else if (type === 'short') {
          out.correct_answer =
            typeof q.correct_answer === 'string' ? q.correct_answer.trim() : '';
          if (!out.correct_answer) return null;
        }

        return out;
      })
      .filter(Boolean);

    console.log(
      `✅ Exam section "${name}" (${type}): ${normalized.length}/${count} questions`
    );
    return normalized;
  } catch (error) {
    console.error(`❌ Exam section "${name}" error:`, error.message);
    const msg = String(error?.message || '');
    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand')) {
      const e = new Error(
        'Gemini şu anda çok yoğun. Lütfen birkaç dakika sonra tekrar deneyin.'
      );
      e.status = 503;
      throw e;
    }
    if (msg.includes('429') || msg.includes('quota')) {
      const e = new Error(
        'Gemini API kotası doldu. Lütfen daha sonra tekrar deneyin.'
      );
      e.status = 429;
      throw e;
    }
    throw new Error(`Failed to generate exam section "${name}": ` + error.message);
  }
}

/**
 * Grade OPEN-ENDED answers with Gemini using a 0–100 rubric per question.
 * Returns [{ question_id, score_percent, feedback }].
 */
export async function gradeOpenEndedAnswers(graded, options = {}) {
  const { language = 'Turkish' } = options;
  if (!Array.isArray(graded) || graded.length === 0) return [];

  const model = getGeminiModel();
  const prompt = `You are a strict but fair ${language} exam grader.

For EACH item below, read the question, the expected answer (rubric), and the student's answer. Give a score 0-100 (integer) and a 1-2 sentence feedback in ${language}. Be fair: partial credit allowed if the student hits key points even with different wording. Zero is appropriate for empty or irrelevant answers.

Return ONLY valid JSON (no markdown) in this shape:
{
  "results": [
    { "question_id": "<id>", "score_percent": 85, "feedback": "Kısa geri bildirim." }
  ]
}

Items:
${JSON.stringify(graded, null, 2)}`;

  try {
    const raw = await generateWithRetry(model, prompt, {
      retries: 2,
      baseDelayMs: 1500,
    });
    const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON in grading response');
    const parsed = JSON.parse(m[0]);
    if (!Array.isArray(parsed.results)) throw new Error('Missing results array');
    return parsed.results
      .filter((r) => r && typeof r.question_id === 'string')
      .map((r) => ({
        question_id: r.question_id,
        score_percent: Math.max(0, Math.min(100, Math.round(Number(r.score_percent) || 0))),
        feedback: typeof r.feedback === 'string' ? r.feedback.trim() : '',
      }));
  } catch (error) {
    console.error('❌ Grading error:', error.message);
    // Return zeros so the user still gets a response
    return graded.map((g) => ({
      question_id: g.question_id,
      score_percent: 0,
      feedback: 'Otomatik değerlendirme başarısız oldu.',
    }));
  }
}
