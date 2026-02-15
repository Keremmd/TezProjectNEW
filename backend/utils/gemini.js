import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get Gemini model instance.
 * Model can be overridden via .env: GEMINI_MODEL=gemini-2.5-pro
 * If you get "limit: 0" / 429: this project has no free-tier quota — create a new
 * project in https://aistudio.google.com and use its API key, or enable billing.
 */
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
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
    
    console.log(`✅ Successfully generated ${jsonResponse.questions.length} questions`);
    return jsonResponse.questions;
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
