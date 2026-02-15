import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  console.log('🔍 Testing Gemini API...\n');
  
  // Test different model names
  const modelsToTest = [
    'gemini-2.5-flash',
    'models/gemini-2.5-flash',
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello in one word.');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS: ${modelName} - Response: ${text}\n`);
      break; // Stop after first success
    } catch (error) {
      console.log(`❌ FAILED: ${modelName}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

testGemini().catch(console.error);
