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
    });

    let text = completion.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('Groq returned empty response');

    console.log('📝 Raw AI response length:', text.length);

    text = text
      .replace(/```json\n?/gi, '')
      .replace(/```javascript\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text.substring(0, 500));
      throw new Error('AI did not return valid JSON format');
    }

    const jsonResponse = JSON.parse(jsonMatch[0]);
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
