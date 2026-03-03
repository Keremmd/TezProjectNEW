import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Generate quiz questions from PDF content using Groq (free tier friendly).
 * Same output format as Gemini so quiz route can use either provider.
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

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in .env. Get a free key at https://console.groq.com');
  }

  console.log(`🤖 Using Groq model: ${GROQ_MODEL}`);

  const prompt = `You are an expert, strict exam writer. Create ${questionCount} HARD, detailed multiple-choice questions in ${language} based ONLY on the PDF below. Take your time: each question must require real understanding, not memorization.

STYLE:
- Questions: LONG and DETAILED. Each question must be at least 2–3 full sentences. Pose scenarios, compare alternatives, or ask "According to the text, why / how / when...?" Do not ask one-line trivia.
- Options: LONG and DETAILED. Each option must be a full sentence or two (or a clear list of points), explaining the answer. Never use options like "Only X" or 2–3 words. Wrong options must be plausible but clearly wrong given the text.
- Difficulty: ${difficulty} but on the HARD side. Prefer analytical, cause-effect, application, and "which conclusion is correct?" types. Avoid trivial yes/no or one-word answers.
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

Exactly ${questionCount} questions. Language: ${language}. Return ONLY the JSON object.`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You write difficult, detailed exam questions. Every question and every option must be long and substantive, not short or trivial. Output only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 16384,
      // Ask Groq to return a strict JSON object so parsing is reliable
      response_format: { type: 'json_object' },
    });

    const content = completion.choices?.[0]?.message?.content || '';
    if (!content) throw new Error('Groq returned empty response');

    console.log('📝 Raw AI response length:', content.length);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ Groq JSON parse error:', parseError);
      console.error('First 500 chars of response:', content.substring(0, 500));
      throw new Error(parseError.message || 'Invalid JSON from Groq');
    }
    if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
      throw new Error('AI response missing questions array');
    }

    console.log(`✅ Successfully generated ${jsonResponse.questions.length} questions (Groq)`);
    return jsonResponse.questions;
  } catch (error) {
    console.error('❌ Groq error:', error.message);
    throw new Error('Failed to generate quiz questions: ' + error.message);
  }
}

/**
 * Generate flashcard pairs (front/back) from PDF content for study cards.
 * @param {string} pdfText - Extracted text from PDF
 * @param {Object} options - { cardCount, language }
 * @returns {Promise<Array<{ front: string, back: string }>>}
 */
export async function generateFlashcardsFromPDF(pdfText, options = {}) {
  const { cardCount = 12, language = 'Turkish' } = options;

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in .env');
  }

  const prompt = `You are an expert educator. Create ${cardCount} flashcard pairs for studying, based ONLY on the PDF content below. Each card has a "front" (question or term) and "back" (answer or definition). Use ${language}.

RULES:
- Front: clear question or key term/concept from the text.
- Back: concise answer or definition, based only on the PDF. Can be 1-3 sentences.
- No trivia; focus on important concepts, definitions, cause-effect, and "how/why" questions.
- Each card must be answerable only from the given content.

PDF Content:
${pdfText.substring(0, 15000)}

Return ONLY valid JSON, no markdown:
{
  "cards": [
    { "front": "Question or term in ${language}", "back": "Answer or definition" }
  ]
}

Exactly ${cardCount} cards. Return ONLY the JSON object.`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You create study flashcards. Output only valid JSON with a "cards" array of { front, back } objects.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 8192,
    });

    let text = completion.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('Groq returned empty response');

    text = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.cards || !Array.isArray(parsed.cards)) throw new Error('AI response missing cards array');

    const cards = parsed.cards.map((c) => ({
      front: typeof c.front === 'string' ? c.front.trim() : String(c.front),
      back: typeof c.back === 'string' ? c.back.trim() : String(c.back),
    })).filter((c) => c.front && c.back);

    console.log(`✅ Generated ${cards.length} flashcards (Groq)`);
    return cards;
  } catch (error) {
    console.error('❌ Groq flashcards error:', error.message);
    const isTokenLimit = error.message?.includes('Request too large') || error.message?.includes('tokens per minute') || error.message?.includes('TPM');
    if (isTokenLimit) {
      throw new Error('PDF is too large for the selected number of cards. Try reducing card count (8 or 12) or use a shorter PDF.');
    }
    throw new Error('Failed to generate flashcards: ' + error.message);
  }
}

/**
 * Answer a user's question about a PDF using Groq,
 * strictly grounded ONLY in the PDF content.
 * @param {string} pdfText
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function answerQuestionAboutPDF(pdfText, question) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in .env');
  }

  const systemPrompt = `Sen, öğrencilere yardımcı olan çok dikkatli bir asistansın.

KURALLAR:
- SADECE verilen PDF metnine dayanarak cevap verebilirsin.
- Eğer soru PDF'de açık ve net bir şekilde yanıtlanmıyorsa, şu cümleyi aynen yaz:
- "Bu soru, verilen PDF içeriğine dayanarak yanıtlanamıyor."
- PDF dışı genel bilgi, tahmin veya yorum ekleme.
- Cevaplarını her zaman Türkçe yaz.`;

  const userPrompt = `--- PDF İÇERİĞİ (sadece buraya dayan, dış bilgi kullanma) ---
${pdfText.substring(0, 20000)}
--- PDF İÇERİĞİ SONU ---

Kullanıcının sorusu:
${question}

Lütfen PDF'ye dayanarak Türkçe bir cevap ver. Kuralları unutma.`;

  try {
    console.log(`🤖 Using Groq model for PDF Q&A: ${GROQ_MODEL}`);
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 2048,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('Groq returned empty response');
    }
    return text;
  } catch (error) {
    console.error('❌ Groq PDF Q&A error:', error.message);
    throw new Error('Failed to answer question about PDF: ' + error.message);
  }
}
