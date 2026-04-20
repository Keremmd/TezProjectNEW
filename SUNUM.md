# StudyPDF — Yapay Zekâ Destekli İşbirlikçi Öğrenme Platformu

## Tez Sunumu Doküman ve Notları

> Bu doküman, haftaya yapılacak tez sunumu için hazırlanmıştır. Hem projeyi
> bir bütün olarak anlatır, hem de PowerPoint sunumundaki **6 temel başlığa**
> (Konu ve Amaç, Özgün Değer, Yaygın Etki, Uygulanabilirlik, Gerçekleştirme
> Yöntemi, Başarı Ölçütleri) birebir hizalanmış içerik sunar.

---

## 1. Projeye Genel Bakış (Executive Summary)

**StudyPDF**, yükseköğretim öğrencilerinin ders PDF’lerini merkezine alan,
**üretken yapay zekâ (Google Gemini 2.5 Flash)** ile güçlendirilmiş bir
**işbirlikçi öğrenme platformudur**.

Platform tek cümleyle şöyle özetlenebilir:

> “PDF yükle → Quiz, flashcard, kavram haritası ve AI sohbeti üret → Sonuçları
> topluluğa ortak (public) paylaş → Diğer öğrencilerle birlikte çalış, soru sor,
> puan topla.”

Bu yapı, ders notu tüketimini pasif (okuma) bir faaliyetten **aktif, ölçülen ve
sosyalleşen** bir faaliyete dönüştürür.

### 1.1 Hangi İhtiyacı Çözüyoruz?

- Üniversite öğrencilerinin çoğunluğu sınav dönemlerinde **dağınık PDF
  slaytlar, ders notları ve kaynak kitap PDF’leri** arasında kaybolur.
- Mevcut araçlar (ChatGPT, NotebookLM, PDF chat uygulamaları) genelde
  **tek kullanıcı** odaklıdır: öğrenci kendi PDF’ine kendisi soru sorar,
  kendi quizini çözer, üretilen içerikler kimseyle paylaşılmaz.
- **Bölüm/sınıf arkadaşlarıyla ortak bir öğrenme havuzu** ve bu havuz
  üzerinden puanlanabilir, filtrelenebilir, yorumlanabilir içerikler yoktur.

StudyPDF bu boşluğu; **kişisel AI asistanı + paylaşımlı topluluk kütüphanesi +
sosyal soru–cevap alanı** olmak üzere tek bir arayüzde birleştirerek kapatır.

---

## 2. Projenin İçeriği ve Modülleri

Platform mimarisi 7 ana fonksiyonel modülden oluşur:

### 2.1 Kimlik Doğrulama ve Profil Yönetimi

- **Supabase Auth** üzerinden e-posta/şifre tabanlı kayıt ve giriş.
- Profil bilgileri: ad-soyad, üniversite, profil fotoğrafı (Supabase Storage’da
  saklanıyor).
- Korumalı rotalar için frontend tarafında `ProtectedRoute` bileşeni.

### 2.2 PDF Yönetimi

- Drag-and-drop yükleme, Supabase Storage üzerinde `pdfs` bucket’ında saklama.
- Her PDF için meta veri: üniversite, sınıf seviyesi, ders adı, **gizlilik
  (public/private)**.
- Modern PDF görüntüleyici (`react-pdf` + `pdfjs-dist`): sayfa sayfa
  inceleme, sayfa kaydırma, zoom.
- Sağ panelde sürekli açık olan **AI asistan** ile sayfa bazlı soru–cevap.

### 2.3 AI PDF Sohbet Modülü (RAG Tabanlı)

Bu modül projenin **en teknik olarak öne çıkan kısmıdır**. Üç farklı stratejiyi
tek bir uç noktada (`POST /api/analyze/pdf/ask`) birleştirir:

1. **Sayfa bazlı sorgu tespiti** — “ilk 5 sayfayı anlat”, “3. sayfa ne
   anlatıyor”, “sayfa 10–12 arası özet” gibi soruları regex tabanlı
   detektörle yakalar (`detectPageQuery`) ve RAG’ı atlayarak o sayfaların
   tam metnini kullanır. Çünkü semantik arama pozisyonel olarak yanlış
   sayfalar getirebilir.
2. **Özet sorguları** — “özetle”, “ne anlatıyor”, “ana konular” gibi
   soruları (`detectSummaryQuery`) yakalar ve PDF’in her sayfasından dengeli
   şekilde örneklenmiş bir bağlam üretir (belgenin sonunu kaçırmamak için).
3. **Kavramsal sorgular** — Bunun için **RAG (Retrieval Augmented
   Generation)** devreye girer:
   - PDF sayfalara bölünür → sayfalar 1000 karakterlik **chunk**’lara ayrılır
     (150 karakter overlap ile).
   - Her chunk, `gemini-embedding-001` ile **768 boyutlu bir vektöre**
     (Matryoshka truncation + L2 normalizasyon) dönüştürülür.
   - Vektörler Supabase PostgreSQL’deki `pdf_chunks` tablosuna (pgvector
     eklentisi) yazılır.
   - Kullanıcı soru sorduğunda, sorgu da aynı modelle vektöre dönüşür;
     `match_pdf_chunks` PostgreSQL RPC fonksiyonu **cosine similarity** ile
     top-N en benzer chunk’ı döndürür (IVFFlat indeks).
   - Sayfa numaralı [p.X] etiketleriyle chunk’lar Gemini’ye prompt olarak
     verilir; model sadece bu bağlamdan cevap üretir ve “(s. 4)” şeklinde
     sayfa referansı ekler.

Bu **hibrit yaklaşım** (sayfa-farkındalıklı + özet-farkındalıklı + semantik),
saf RAG kullanan NotebookLM benzeri araçların yapamadığı sayfa-özel cevapları
doğru üretmemizi sağlar.

### 2.4 Otomatik Quiz Üretimi ve Çözme

- **Gemini 2.5 Flash** prompt mühendisliği ile PDF’ten **tam istenen sayıda**
  (5–30) çoktan seçmeli soru üretir.
- Zorluk: easy / medium / hard. Easy → direkt tanımlar; hard → analiz, neden-
  sonuç, karşılaştırma, “hangi sonuç doğrudur” tarzı.
- **Hallucination önleme**: prompt’ta “PDF tek kaynağındır, dış bilgi
  kullanma” kuralı katı şekilde vurgulanır.
- Süreli quiz (opsiyonel, dakika bazlı) → otomatik bitirme.
- Quiz sonucunda:
  - Doğru/yanlış sayısı ve yüzde skor.
  - Soru bazlı inceleme (açıklamalarla).
  - **CSV** ve yazdırılabilir **PDF rapor** çıktısı.
- Kota aşımı (429) durumunda placeholder soru üretmez; kullanıcıya açık bir
  hata mesajı döner (veriyi kirletmemek için bilinçli tasarım).

### 2.5 Flashcard Modu

- Quiz sorularından veya doğrudan PDF’ten **front/back flashcard**’lar
  üretir.
- Modern kart tasarımı: gradient arka plan, smooth flip animasyonu
  (Framer Motion).
- Karıştırma, sırayı sıfırlama, tek tek silme.

### 2.6 Çok Bölümlü Deneme Sınavı (Exam) Modülü

Gerçek bir vize/final kâğıdını simüle eder:

- Tek sınavda **birden fazla PDF** birleştirilebilir.
- Bölümler: **Çoktan seçmeli (mcq), Doğru/Yanlış, Boşluk doldurma (cloze),
  Kısa cevaplı (short), Klasik/açık uçlu (open)**.
- Tüm bölümler **tek Gemini çağrısıyla** üretilir (`generateExamInOneCall`)
  — ücretsiz kota dostu.
- **Açık uçlu soruların otomatik değerlendirilmesi**: öğrenci cevabı,
  beklenen rubric cevabıyla karşılaştırılarak Gemini tarafından
  0–100 arası puanlanır ve kısa geri bildirim üretilir
  (`gradeOpenEndedAnswers`).

### 2.7 Kavram Haritası (MindMap) Modülü

- PDF’ten **hiyerarşik kavram ağacı** (root → branches → leaves) üretir.
- Her düğümde **sayfa numarası** bulunur → kullanıcı düğüme tıkladığında PDF
  o sayfaya atlar.
- `reactflow` ile interaktif görselleştirme.
- **Cache mekanizması**: aynı PDF için bir kez üretilen mindmap
  `pdf_mindmaps` tablosuna yazılır ve tekrar istek geldiğinde AI çağrısı
  yapılmadan döner (maliyet tasarrufu).

### 2.8 Sözlük (Glossary) Modülü

- PDF’teki kritik kavramları (8–20 adet) **tanımı, kategorisi ve önem
  seviyesi** (high/medium/low) ile çıkarır — sınav öncesi hızlı tekrar için.

### 2.9 Topluluk (Community) Modülü

Projenin **en ayırt edici parçası**. İki ayrı katmandan oluşur:

1. **Paylaşımlı İçerik Kütüphanesi (Shared Content)**
   - Kullanıcılar yükledikleri PDF’leri ve oluşturdukları quiz’leri
     `privacy=public` işaretleyebilir.
   - Public içerikler **tüm kullanıcıların** erişimine açılır.
   - Üniversite, sınıf, ders adı filtreleri; oy sayısına veya ortalama
     yıldız puanına göre sıralama.
   - 1–5 yıldız puanlama, yararlı/faydasız oylama.
2. **Topluluk Soru–Cevap Akışı (Community Feed)**
   - Öğrenciler bir konu fotoğrafı + açıklama + ders adı ile soru paylaşır
     (`community_posts`).
   - Diğer kullanıcılar altına yorum/cevap yazar (`community_comments`).
   - Ders adına göre filtreleme, kendi gönderini silme.
   - Bu akış **bir ödevde takıldığında arkadaşına soru sormanın dijital
     hali**dir; Stack Overflow mantığını akademik PDF dünyasına taşır.

### 2.10 Liderlik Tablosu (Gamification)

- Kullanıcılar PDF yükleyince, quiz çözünce, topluluğa katkı sağlayınca
  **öğrenme puanı** kazanır.
- `get_learning_leaderboard` Supabase RPC fonksiyonu ile global sıralama.
- Kullanıcı top-20 dışında olsa bile kendi rütbesini görür.
- Üst 3 için Crown/Medal/Trophy ikonları ile görsel ödüller.

---

## 3. Kullanılan Teknolojiler

### 3.1 Frontend

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **React 19 + Vite** | SPA altyapısı, hızlı geliştirme ve HMR |
| **Tailwind CSS** | Modern, responsive, utility-first tasarım |
| **Framer Motion** | Sayfa geçişleri, kart flip, glassmorphism animasyonlar |
| **React Router DOM 7** | SPA yönlendirme, korumalı rotalar |
| **lucide-react** | 600+ ikonluk tutarlı ikon seti |
| **react-pdf / pdfjs-dist** | Tarayıcıda PDF render |
| **reactflow** | Kavram haritası görselleştirmesi |
| **jspdf** | Quiz sonuç raporunu PDF olarak indirme |

### 3.2 Backend

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **Node.js + Express 4** | REST API katmanı |
| **@google/generative-ai** | Gemini 2.5 Flash (LLM) + gemini-embedding-001 |
| **@supabase/supabase-js** | Supabase istemcisi (DB + Storage + Auth) |
| **pdf-parse** | PDF’lerden sayfa sayfa metin çıkarımı (pagerender callback) |
| **multer** | Dosya yükleme middleware |
| **cors, dotenv** | Güvenli origin listesi ve ortam değişkenleri |

### 3.3 Veri Katmanı — Supabase

- **PostgreSQL** tabloları: `pdfs`, `quizzes`, `quiz_questions`, `exams`,
  `exam_questions`, `exam_submissions`, `flashcard_decks`, `flashcards`,
  `pdf_chunks` (pgvector), `pdf_mindmaps`, `pdf_highlights`,
  `community_posts`, `community_comments`, `pdf_ratings`, `quiz_ratings`,
  `learning_points`, `profiles`.
- **pgvector** eklentisi → 768 boyutlu embedding araması
  (IVFFlat indeks + cosine similarity).
- **Row Level Security (RLS)** → her kullanıcı sadece kendi verisini
  değiştirebilir; public içerikler herkese okunabilir.
- **RPC fonksiyonları**: `match_pdf_chunks`, `get_learning_leaderboard`,
  `insert_community_post`.
- **Storage**: `pdfs` bucket (ders PDF’leri), `community` bucket (soru
  fotoğrafları), `avatars` bucket (profil resimleri).

### 3.4 Yapay Zekâ Altyapısı

- **LLM**: Google Gemini 2.5 Flash (fallback: `gemini-2.5-flash-lite`).
- **Embedding**: `gemini-embedding-001`, Matryoshka truncation ile 768-dim.
- **Prompt Engineering** teknikleri:
  - “Source-of-truth” kısıtlaması (dış bilgi yasağı).
  - JSON-only çıktı zorlaması.
  - Tam soru sayısı zorlaması (AI fazla üretirse trim, az üretirse hata).
  - Geri çekilme (`retryDelay` parse + üstel bekleme).
  - Overload (503) durumunda otomatik **lite model fallback**.

### 3.5 Deployment

- **Frontend**: Vercel / Netlify (Vite static build).
- **Backend**: Render.com (`render.yaml` ile IaC).
- **DB & Storage**: Supabase Cloud.

---

## 4. API Referansı (Backend Uç Noktaları)

Express sunucusu, aşağıdaki ana uç noktalarla çalışır:

### Quiz
- `POST /api/quiz/generate` — PDF’ten quiz üret ve DB’ye kaydet.

### PDF Analizi & Sohbet
- `POST /api/analyze/pdf` — PDF özet + anahtar noktalar + tahmini çalışma süresi.
- `POST /api/analyze/pdf/glossary` — 8–20 kritik terim + tanım + önem seviyesi.
- `POST /api/analyze/pdf/ask` — PDF’e sorular (hibrit RAG akışı).
- `POST /api/analyze/pdf/ingest` — PDF’i chunk’la, embedle ve indeksle.
- `GET  /api/analyze/pdf/ingest/status` — PDF indekslendi mi?
- `GET  /api/analyze/pdf/mindmap` — Cache’den mindmap getir.
- `POST /api/analyze/pdf/mindmap` — Yeni mindmap üret (veya cache’den getir).

### Flashcard
- `POST /api/flashcards/generate` — Flashcard destesi üret.

### Exam
- `POST /api/exam/generate` — Çok bölümlü sınav üret.
- `GET  /api/exam/:id` — Sınavı ve sorularını getir.
- `POST /api/exam/:id/submit` — Cevapları değerlendir, açık uçluları
  Gemini ile otomatik puanla.

### Leaderboard
- `GET  /api/leaderboard` — Küresel öğrenme puanı sıralaması.

### Diğer
- `GET  /api/health` — Durum kontrolü + Gemini API key konfig kontrolü.

---

## 5. Tipik Kullanıcı Akışı (End-to-End)

```
Kayıt/Giriş
   ↓
Dashboard'da "Yeni PDF yükle" → üniversite, ders, privacy seç
   ↓
(Arka planda) PDF Storage'a yüklenir, pdf_chunks tablosuna embedding'leri yazılır
   ↓
PDF Viewer açılır → sağ panelde AI asistan aktif
   │
   ├──> "Özetle" → Gemini sayfa örneklemeli özet
   ├──> "3. sayfada ne var?" → Sayfa-özel cevap
   ├──> "Entropi nedir?" → RAG ile ilgili chunk'lardan cevap
   │
   ├──> Quiz Üret (10 soru, orta zorluk, 20 dk) → QuizPage
   │       ↓
   │     Sonuç: 8/10 doğru → CSV/PDF rapor indir, liderlik puanı +X
   │
   ├──> Flashcard Üret (12 kart) → FlashcardPage → flip animasyonu
   │
   ├──> MindMap Oluştur → ReactFlow ile kavram ağacı, düğüme tıkla → PDF'te o sayfa
   │
   └──> Exam Oluştur (MCQ 10 + Cloze 5 + Open 3) → ExamPage → gönder → otomatik puan
   ↓
Dashboard > Shared Content sekmesi
   → Public PDF'lere 5 yıldız ver, yorum yap, indir
   → Community Feed'de foto ile soru paylaş / başkasının sorusuna cevap yaz
   ↓
Leaderboard > Kendi puanını ve rütbeni gör
```

---

# PowerPoint Sunumu İçin 6 Temel Başlık

> Aşağıdaki bölümler doğrudan slaytlara taşınabilir. Her başlıkta önce
> **kısa slayt metni**, sonra **hocanıza karşı sözlü açıklamada
> kullanabileceğiniz detay** yer alır.

---

## 1) Konu ve Amaç

### Slayt Metni

- **Konu:** Yükseköğretim öğrencileri için PDF odaklı, yapay zekâ destekli
  işbirlikçi bir öğrenme platformu geliştirmek.
- **Amaç:**
  - Ders PDF’lerinden **otomatik quiz, flashcard, özet, kavram haritası**
    ve **çok bölümlü sınav** üretmek.
  - Bu içerikleri **topluluk tarafından paylaşılabilir** hale getirerek
    tek kullanıcılı AI araçlarının ötesine geçmek.
  - Üretken yapay zekâyı **akran destekli (peer-supported) öğrenmeyle**
    birleştirmek.

### Sözlü Açıklama

> Bugün ChatGPT ya da NotebookLM gibi araçlarla bir öğrenci kendi PDF’i
> üzerinde sohbet edebiliyor, quiz ürettirebiliyor. Ama üretilen içerikler
> o öğrencinin hesabında kalıyor, bir sonraki sene aynı dersi alan
> arkadaşına miras kalmıyor; bir arkadaşına soru soramıyor.
> Biz bu projede **hem kişisel bir AI ders asistanı** hem de **ortak bir
> paylaşım havuzu** oluşturduk: Bir öğrenci kendi ders PDF’ini public
> olarak paylaştığında, aynı üniversite/bölümdeki tüm öğrenciler bu
> PDF’ten üretilen quizleri çözebiliyor, puanlayabiliyor; takıldığı bir
> soruyu fotoğraflayıp topluluğa atabiliyor. Amacımız, aktif öğrenmeyi ve
> akran öğrenmesini aynı platformda kurumsallaştırmak.

---

## 2) Özgün Değer

### Slayt Metni — Bizi Diğerlerinden Ayıran Noktalar

| Özellik | ChatGPT / tek kullanıcı AI | NotebookLM | **StudyPDF (biz)** |
|---------|---------------------------|------------|--------------------|
| PDF üzerinden sohbet | ✓ | ✓ | ✓ |
| Otomatik quiz üretimi | Kısmî | Kısmî | ✓ (1–30 soru, 3 zorluk) |
| Flashcard | ✗ | Yeni | ✓ |
| **Public PDF paylaşımı (üniversite/ders filtreli)** | ✗ | ✗ | **✓** |
| **Topluluğa fotoğrafla soru sorma (Q&A feed)** | ✗ | ✗ | **✓** |
| **Ortak quiz havuzu + yıldız/oy puanlama** | ✗ | ✗ | **✓** |
| Liderlik tablosu (gamification) | ✗ | ✗ | **✓** |
| Sayfa-farkındalıklı hibrit RAG (ilk N sayfa + semantik) | ✗ | Kısmî | **✓** |
| Çok bölümlü sınav + açık uçlu AI puanlama | ✗ | ✗ | **✓** |
| Kavram haritasında sayfaya jump | ✗ | ✗ | **✓** |

### Sözlü Açıklama — 3 Kritik Özgün Değer

1. **Public PDF Ekosistemi (Shared Content)**
   > NotebookLM’de veya benzeri ödevlerde yapılan uygulamalarda PDF
   > tamamen kişiseldir. Bizde kullanıcı yüklediği PDF’i `public`
   > işaretlediği anda, aynı dersi alan tüm öğrenciler bu PDF’i
   > kütüphanelerinde görüyor, indirebiliyor, yıldız veriyor,
   > üzerinden quiz çözüyor. Bu — bildiğimiz kadarıyla — tek
   > kullanıcılı AI ders asistanlarının hiçbirinde yok.
2. **Topluluk Soru–Cevap Akışı (Community Feed)**
   > Öğrenci bir soruda takıldığında telefonuyla fotoğraf çekip
   > topluluğa atabiliyor; başkaları altına cevap yazıyor. Bu,
   > sınıf WhatsApp grubunun akademik, ders-filtreli ve arşivlenebilir
   > versiyonudur.
3. **Hibrit RAG Mimarisi**
   > Saf bir vektör araması “3. sayfada ne anlatılıyor?” gibi pozisyonel
   > sorulara yanlış cevap verir çünkü RAG anlam benzerliğine göre arar.
   > Biz **sayfa-özel sorguları** ve **özet sorgularını** regex + sezgi ile
   > tespit edip RAG’ı bypass ediyoruz; kavramsal sorularda ise pgvector
   > ile cosine similarity araması yapıyoruz. Bu 3-yönlü akış bizim
   > teknik özgün değerimizdir.

---

## 3) Yaygın Etki

### Slayt Metni — Kimlere, Nasıl Fayda?

**Bireysel etki (öğrenci düzeyinde)**
- Sınav hazırlığını saatlerce sürebilecek özet çıkarma işinden kurtarır.
- Zorluk seviyeli quizlerle **aktif hatırlama (active recall)** ve
  flashcard ile **aralıklı tekrar (spaced repetition)** yöntemlerini
  erişilebilir kılar.
- Puan ve liderlik tablosu ile motivasyon sağlar.

**Kurumsal etki (üniversite/bölüm düzeyinde)**
- Her yıl aynı derslerde üretilen içerik birikir → **kümülatif bir
  kurumsal bilgi havuzu** oluşur (eski öğrencinin kaliteli quizleri
  yeni gelen öğrencilere miras kalır).
- Üniversite + ders + sınıf filtreleriyle kurumsal segmentasyon.

**Sosyal etki**
- Ekonomik fırsat eşitsizliği: özel ders alamayan öğrenciler bile
  **24/7 AI asistan + akran desteği** alabilir.
- Dil erişilebilirliği: tüm AI çıktıları Türkçe olarak zorlanıyor; prompt
  seviyesinde “Language: Turkish” sabitlenmiş.

**Akademik / bilimsel etki**
- Hibrit RAG akışı (sayfa-farkındalıklı + semantik) küçük ölçekte bir
  **araştırma katkısıdır** ve tez kapsamında bir yayına dönüşme
  potansiyeli taşır.

### Sözlü Açıklama

> Yaygın etki sadece “öğrenci sınavda daha iyi not alır” ile sınırlı değil.
> Asıl etki şu: birkaç dönem sonrasında her ders için dönüp dönüp
> kullanılan, **topluluk tarafından yıldızlanmış ve iyileştirilmiş bir
> açık kaynak quiz havuzu** oluşacak. Bu, açık ders materyallerine
> benzer ama yapay zekâ ile genişletilmiş, akran-onaylı bir versiyondur.

---

## 4) Uygulanabilirlik

### Slayt Metni — Neden Bu Proje Bugün Yapılabilir?

**Teknik olarak uygulanabilir:**
- Tüm bağımlılıklar **ücretsiz tier’da** çalışır:
  - Supabase: 500 MB DB + 1 GB Storage + 50K MAU.
  - Google AI Studio: Gemini 2.5 Flash için ücretsiz günlük kota.
  - Render.com: ücretsiz backend host.
- Proje ölçeklendiğinde **stateless Express** ve **managed PostgreSQL**
  sayesinde yatay ölçekleme mümkün.

**Ekonomik olarak uygulanabilir:**
- Gemini Flash 1M token bağlamı → uzun PDF’lerde bile 1 cent civarı
  maliyet.
- Mindmap cache mekanizması sayesinde aynı PDF için tekrar üretim
  maliyeti 0.

**Kullanıcı kabulü açısından uygulanabilir:**
- Hedef kitle (üniversite öğrencileri) zaten **dijital-yerli**,
  ChatGPT/Instagram gibi uygulamalara aşina.
- Arayüz Türkçe + İngilizce (I18n context).
- Mobil-duyarlı Tailwind tasarım → telefonda da kullanılabilir.

**Yasal / etik olarak:**
- RLS politikaları ile kullanıcılar sadece kendi verilerine yazabilir.
- Public paylaşım opt-in (default **private**); kullanıcı açıkça
  seçmedikçe içerik paylaşılmaz.
- Gemini prompt’ları “sadece verilen PDF’i kullan, dış bilgi yasak”
  kısıtıyla hallucination riskini düşürür → yanlış bilgi yayma riski
  azaltılır.

### Sözlü Açıklama

> Projeyi “yapılabilir” kılan en önemli üç şey: (1) tüm servislerin
> ücretsiz başlangıç paketi olması, (2) tek geliştiricinin
> tamamlayabileceği teknoloji stack’i (Vercel + Supabase + Render +
> Gemini), ve (3) kullanıcıların eklenti yüklemeden sadece tarayıcıyla
> platforma ulaşabilmesi. Yani hem geliştirme hem dağıtım tarafında
> maliyet ve karmaşıklık düşük.

---

## 5) Gerçekleştirme Yöntemi

### Slayt Metni — Sistem Mimarisi

```
┌──────────────────────┐
│  React 19 Frontend   │  (Vite, Tailwind, Framer Motion, react-pdf, reactflow)
│  (Vercel)            │
└──────────┬───────────┘
           │  HTTPS + JWT (Supabase Auth)
           ▼
┌──────────────────────┐        ┌──────────────────────┐
│  Supabase Cloud      │◀──────▶│  Express Backend     │
│  - PostgreSQL        │        │  (Render.com)        │
│  - Storage (PDFs)    │        │  routes/             │
│  - Auth              │        │   ├── quiz.js        │
│  - pgvector          │        │   ├── analyze.js     │
│  - RLS policies      │        │   ├── flashcards.js  │
│  - RPC functions     │        │   ├── exams.js       │
└──────────────────────┘        │   └── leaderboard.js │
                                └──────────┬───────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │  Google AI Platform  │
                                │  - Gemini 2.5 Flash  │
                                │  - gemini-embedding  │
                                └──────────────────────┘
```

### Geliştirme Aşamaları (İş Paketleri)

1. **Gereksinim analizi ve şema tasarımı** — Supabase tabloları,
   RLS politikaları, Storage bucket’ları.
2. **Kimlik doğrulama ve Dashboard iskeleti** — ProtectedRoute,
   AuthContext, sidebar ve sekmeli arayüz.
3. **PDF yükleme + görüntüleme** — Supabase Storage, `react-pdf`,
   pagerender callback ile sayfa-sayfa metin çıkarma.
4. **Quiz üretim boru hattı** — pdf-parse → Gemini prompt → JSON
   doğrulama → DB insert.
5. **RAG boru hattı** — chunking algoritması (sentence-boundary aware),
   Gemini embedding, pgvector RPC, cosine similarity.
6. **Hibrit sohbet akışı** — `detectPageQuery` + `detectSummaryQuery`
   + RAG fallback.
7. **Flashcard + MindMap + Glossary + Exam** — aynı prompt mühendisliği
   kalıbının farklı çıktılara uyarlanması.
8. **Topluluk modülleri** — community_posts, community_comments, shared
   filtreler, yıldız puanlama, oylama.
9. **Gamification** — öğrenme puanı RPC’si, liderlik tablosu.
10. **UI cilalama** — glassmorphism, dark/light tema, i18n (TR/EN),
    duyarlı tasarım.
11. **Deployment** — `render.yaml`, `.env.example` dosyaları, CORS
    ayarları, production testleri.

### Öne Çıkan Teknik Kararlar

- **Neden Gemini 2.5 Flash?** 1M token bağlam + düşük maliyet +
  yerel Türkçe desteği güçlü.
- **Neden Supabase?** Auth + Postgres + Storage + Realtime + pgvector
  tek platformda → kod ve operasyon karmaşıklığı düşük.
- **Neden tek-çağrılı sınav üretimi?** Ücretsiz kota dakikada ~5 istek
  ile sınırlı; her bölüm için ayrı çağrı yaparsak kota bitiyor.
- **Neden mindmap cache’i?** Aynı PDF’in kavram haritası deterministik;
  gereksiz re-generation kullanıcıya para/zaman kaybettiriyor.

### Sözlü Açıklama

> Projenin omurgası üç servis arasında kurulmuş durumda: React
> frontend (Vercel), Express backend (Render) ve Supabase (DB +
> Storage + Auth + pgvector). Gemini API’si backend’den çağrılıyor
> çünkü API key’i frontend’e gömmek güvensiz. Kritik olan şey şu:
> Biz her AI çağrısından önce **prompt’a katı bir kuralname**
> ekliyoruz: “Sadece PDF’i kullan, dış bilgi kullanma, JSON dışı
> çıktı verme, tam N soru üret.” Bu, eğitimde AI kullanımında en
> büyük endişe olan hallucination’ı büyük ölçüde azaltıyor.

---

## 6) Başarı Ölçütleri ve Değerlendirme

### Slayt Metni — Nasıl Başardığımızı Ölçüyoruz?

**Teknik / Fonksiyonel Başarı**
- [ ] 30 sayfalık bir PDF’ten < 15 saniyede 10 quiz sorusu üretimi.
- [ ] RAG araması 500 ms altında cevap.
- [ ] Gemini kota hatası (429) sonrasında kullanıcıya veri bozmadan
      net hata dönme.
- [ ] Aynı PDF için mindmap cache hit oranı > %95.
- [ ] Sayfa-özel soruların doğru sayfalara yönlenmesi > %95
      (regex test seti).

**Kullanıcı Deneyimi Başarısı**
- [ ] SUS (System Usability Scale) skoru hedef: **≥ 70** (iyi
      kullanılabilirlik eşiği).
- [ ] 10+ pilot öğrenci ile yarı yapılandırılmış mülakat.
- [ ] Quiz tamamlama oranı ≥ %70 (kullanıcı sınavı yarıda bırakıyor mu?).

**Öğrenme Çıktısı Başarısı**
- [ ] AI quizinden yüksek alan öğrencilerin gerçek sınav notlarıyla
      karşılaştırılması (korelasyon analizi).
- [ ] Kullanıcıların self-report’una göre çalışma süresinde azalma.

**Topluluk Başarısı**
- [ ] Kayıtlı kullanıcıların en az %20’sinin PDF’ini public paylaşması.
- [ ] Ortalama public PDF puanı ≥ 3.5/5.
- [ ] Community feed’de soru başına ortalama yorum sayısı ≥ 1.

### Sözlü Açıklama

> Başarımızı sadece “çalışıyor mu?” ile değil, üç katmanda ölçüyoruz:
> **teknik performans** (gecikme, doğruluk, cache oranı), **kullanıcı
> deneyimi** (SUS, mülakat) ve **öğrenme etkisi** (AI quiz skoru ile
> gerçek sınav notu korelasyonu). Bu çok katmanlı ölçüm, akademik bir
> tez için projenin tamamlanmışlığını ispatlayan en güçlü kanıttır.

---

# EK — Sunumda Sorulabilecek Kritik Sorulara Hazırlık

### S1: “Neden ChatGPT yerine bunu kullanmalı?”

> ChatGPT tek kullanıcılıdır, geçicidir, arkadaşlarınızla
> paylaşılamaz ve PDF’inizi ekleme/çıkarma sürtünmesi vardır. Biz
> PDF’i bir kez yüklüyor, **kalıcı bir topluluk havuzu** oluşturuyor,
> üzerine quiz/flashcard/mindmap **üretip saklıyor** ve sınıf
> arkadaşlarınızla soru–cevap yapma imkânı veriyoruz.

### S2: “AI yanlış bilgi üretirse?”

> Bu nedenle prompt’larımızda sadece verilen PDF’i “source of
> truth” olarak kabul ediyoruz; dış bilgiyi yasaklıyoruz. Ayrıca
> RAG ile cevap verirken her iddianın yanında sayfa referansı
> (s. X) üretmesini istiyoruz — kullanıcı doğrulayabiliyor.

### S3: “Ücretsiz kota biter mi?”

> Biter. O yüzden üç savunma katmanımız var: (1) mindmap cache,
> (2) tek çağrılı sınav üretimi, (3) 429 olduğunda placeholder
> yerine açık hata mesajı + retry backoff + gemini-flash-lite
> fallback.

### S4: “Güvenlik nasıl?”

> Auth Supabase tarafında (JWT), private content’e RLS politikası
> ile sadece sahibi erişiyor, API key’ler sadece backend’de
> (frontend’e sızmıyor), CORS whitelist ile bilinmeyen origin’ler
> engelleniyor.

### S5: “Ölçeklenebilir mi?”

> Backend stateless (her istek bağımsız), Supabase Postgres
> managed, storage CDN üzerinden. Binlerce kullanıcıya kadar ek
> mimari değişiklik gerekmez; üstüne chıkılırsa Gemini cache
> katmanı ve kuyruk (BullMQ) eklenebilir.

---

## Sunum İpuçları

- İlk slaytta **ekran görüntüsü** göster: Dashboard → Shared
  Content → Community Feed → Quiz ekranı → MindMap. Canlı demo
  riskli ise GIF/video kullan.
- Teknik slaytlarda mimari diyagramı + bir *kod parçası*
  (örn. `detectPageQuery` regex’leri) göster — hoca “gerçekten
  kendisi yazmış” kanaatine varsın.
- “Özgün Değer” slaytında **karşılaştırma tablosunu** ortaya koy;
  hoca “diğerlerinden farkı ne?” dediğinde cevap hazır.
- Son slaytta **başarı metrikleri tablosu** + pilot testten örnek
  SUS sonucu ver (varsa).

Başarılar. 🎯
