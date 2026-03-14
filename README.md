# 📚 StudyPDF (TezProject) – AI Destekli Sınav Çalışma Asistanı

Yükseköğretim öğrencilerinin PDF notları üzerinden akıllıca çalışabilmesi için tasarlanmış, **React + Express + Supabase + Google Gemini** tabanlı bir web uygulaması.

## 📋 Proje Hakkında

StudyPDF, ders PDF’lerini merkeze alarak:

- PDF’lerden **otomatik quiz** üretir,
- Quizleri zamanlayarak **süreli deneme** yapmanı sağlar,
- Sorulardan **flashcard desteği** oluşturur,
- PDF üzerinde **AI sohbet** ile zor konuları açıklar,
- Çalışma sonuçlarını **detaylı CSV / PDF rapor** olarak indirmeni sağlar.

Bu proje bir **tez çalışması** kapsamında geliştirilmiştir.

## 🎯 Ana Özellikler

- 📄 **PDF Yönetimi**
  - Supabase Storage üzerinden PDF yükleme ve listeleme
  - Modern PDF görüntüleyici (`react-pdf`) ile sayfa sayfa görüntüleme
  - Aynı ekranda sağ tarafta **AI Assistant** ile PDF’e özel soru–cevap

- 📝 **Quiz Üretimi & Çözme**
  - Google Gemini ile PDF içeriğinden **otomatik quiz üretimi**
  - Zorluk seviyesi, soru sayısı ve gizlilik (public/private) ayarları
  - Modern quiz arayüzü:
    - Dark tema, glassmorphism, animasyonlu geçişler
    - İlerleme barı, soru sayacı
    - Opsiyon seçimleri için modern butonlar
  - **Süreli quiz** (opsiyonel): dakika bazlı süre, otomatik bitirme
  - Quiz sonunda:
    - Doğru / yanlış sayısı ve yüzde skor
    - Soru bazında doğru/yanlış, doğru cevap ve açıklamalar
    - **Detaylı rapor indirme:** CSV ve yazdırılabilir PDF (print sayfası)

- 🧠 **Flashcard Modu**
  - Quiz sorularından otomatik **front/back flashcard** oluşturma
  - Modern kart tasarımı, gradient arka planlar, smooth flip animasyonu
  - Kartları karıştırma, sırayı sıfırlama, tek tek silme

- 👥 **Topluluk & Çalışma Deneyimi**
  - Supabase üzerinde community post’ları (fotoğraflı paylaşım) ve yorumlar
  - (SQL migration rehberleri artık repo dışında; Supabase konsolu üzerinden yönetiliyor)

## 🏗️ Proje Yapısı

```bash
TezProject/
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx / LandingPageNew.jsx
│   │   │   ├── LoginPage.jsx / RegisterPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PDFViewerPage.jsx       # PDF + AI chat
│   │   │   ├── QuizPage.jsx            # Quiz çözme + raporlar
│   │   │   └── FlashcardPage.jsx       # Flashcard modu
│   │   ├── contexts/ (Auth, I18n)
│   │   └── lib/ (Supabase client, utils)
│   └── README.md
├── backend/                 # Node.js + Express API
│   ├── server.js
│   └── routes/
│       ├── quiz.js          # Quiz üretimi (Gemini)
│       ├── analyze.js       # PDF AI chat
│       └── flashcards.js
└── README.md                # Bu dosya
```

## 🛠️ Teknoloji Stack

### Frontend
- **React 19 + Vite** – SPA altyapısı
- **Tailwind CSS** – Modern, responsive tasarım
- **Framer Motion** – Animasyonlar ve geçişler
- **React Router DOM** – Sayfa yönlendirme
- **lucide-react** – İkon seti
- **react-pdf / pdfjs-dist** – PDF görüntüleme

### Backend
- **Node.js + Express** – API katmanı
- **Supabase (PostgreSQL + Storage)** – Veritabanı & dosya depolama
- **Google Gemini** – Quiz üretimi ve PDF AI asistanı

### Diğer
- **Supabase RLS** – Güvenli veri erişimi
- **Yerel LocalStorage** – PDF bazlı chat geçmişi saklama

## 🚀 Çalıştırma

Ön koşul: Node.js 18+ ve bir Supabase projesi + Google AI Studio API key.

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
# Varsayılan: http://localhost:5173
```

### 2. Backend

```bash
cd backend
npm install

# .env (örnek için backend/.env.example dosyasına bak)
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# GOOGLE_API_KEY=...

npm start
# Varsayılan: http://localhost:3001
```

## 📱 Öne Çıkan Ekranlar

- **Dashboard** – Yüklenen PDF’ler, quiz listesi, çalışma akışı
- **PDF Viewer + AI Assistant**
  - Sol: PDF sayfa görünümü
  - Sağ: “Ask anything about this PDF” AI chat
- **QuizPage**
  - Zamanlayıcı, progress bar, modern soru/option kartları
  - Sonuç kartı + soru bazlı inceleme
  - CSV / PDF detaylı rapor indirme
- **FlashcardPage**
  - Soru–cevap kartlarını tek ekranda çalışma
  - Flip animasyonu, karıştırma ve silme

## 🔐 Supabase Notları

- Proje, quizler, flashcardlar ve community için **Supabase tabloları + RLS** kullanır.
- Storage içinde `pdfs` bucket’ı gereklidir (PDF dosyaları için).
- Eski SQL migration rehber dosyaları repo’dan temizlenmiştir; üretim ortamında direkt Supabase Dashboard veya ayrı migration araçları kullanılmalıdır.

## 📄 Lisans & Durum

- Proje **akademik/kişisel** kullanım içindir.
- Aktif geliştirme altındadır; arayüz ve özellikler sık sık güncellenmektedir. 2026.***
