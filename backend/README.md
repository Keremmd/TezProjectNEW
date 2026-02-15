# AI Learning Platform - Backend API

Backend server for AI-powered PDF analysis and quiz generation.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the API key

### 3. Configure Environment Variables
Edit the `.env` file and add your Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Start the Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📚 API Endpoints

### Health Check
```bash
GET /api/health
```

### Generate Quiz from PDF
```bash
POST /api/quiz/generate
Content-Type: application/json

{
  "pdfId": "uuid",
  "userId": "uuid",
  "title": "My Quiz",
  "questionCount": 10,
  "difficulty": "medium"
}
```

### Analyze PDF Content
```bash
POST /api/analyze/pdf
Content-Type: application/json

{
  "pdfId": "uuid"
}
```

## 🔧 Tech Stack
- **Express.js** - Web framework
- **Google Gemini AI** - AI model for quiz generation
- **Supabase** - Database and storage
- **pdf-parse** - PDF text extraction

## 📝 Notes
- Free tier: 15 requests/minute
- Model: Gemini 2.0 Flash (experimental)
- Language: Turkish (configurable)

## 🐛 Troubleshooting

### "GEMINI_API_KEY is not set"
Make sure you added your API key to the `.env` file.

### "Failed to download PDF"
Check Supabase storage permissions and file path.

### "Rate limit exceeded"
Wait a minute and try again (free tier limitation).
