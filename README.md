# 🎓 LearnAI - AI-Powered Collaborative Learning Platform

> Yapay Zeka ile Güçlendirilmiş İşbirlikçi Öğrenme Platformu

## 📋 Proje Hakkında

LearnAI, yükseköğretim öğrencilerinin akademik materyallerini daha etkili bir şekilde öğrenmelerine yardımcı olmak için geliştirilmiş, yapay zeka destekli bir web platformudur.

### 🎯 Ana Özellikler

- 📄 **PDF İşleme**: Akademik PDF'leri otomatik olarak analiz eder
- 🤖 **AI Özetleme**: GPT-4 kullanarak akıllı özetler oluşturur
- 📝 **Quiz Üretimi**: Otomatik quiz ve soru oluşturma
- 🔑 **Anahtar Kavram Çıkarma**: Önemli tanım ve formülleri tespit eder
- 👥 **Sosyal Öğrenme**: Paylaşma, oylama ve yorum özellikleri
- 📊 **Akran Değerlendirme**: Topluluk destekli içerik kalite kontrolü

## 🏗️ Proje Yapısı

```
TezProject/
├── frontend/           # React frontend uygulaması
│   ├── src/
│   │   ├── pages/     # Sayfa componentleri
│   │   ├── components/ # Reusable UI componentleri
│   │   └── ...
│   └── README.md
├── backend/           # Spring Boot backend (yakında)
└── Req.md            # Detaylı proje gereksinimleri
```

## 🛠️ Teknoloji Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide Icons** - Icon library

### Backend (Planlanan)
- **Java Spring Boot** - Backend framework
- **PostgreSQL** - Veritabanı
- **Spring Security** - Authentication
- **JWT** - Token-based auth
- **JPA/Hibernate** - ORM

### AI & Processing
- **OpenAI API (GPT-4)** - AI işlemleri
- **PyMuPDF** - PDF işleme
- **Prompt Engineering** - AI optimizasyonu

## 🚀 Başlangıç

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5174

### Backend (Yakında)

Backend implementasyonu için Req.md dosyasındaki spesifikasyonları takip edilecektir.

## 📱 Ekran Görüntüleri

### ✅ Tamamlanan Sayfalar

- ✅ Landing Page - Modern hero section, features, CTA
- ✅ Login Page - Professional authentication UI
- ✅ Register Page - User registration with validation

### 🚧 Geliştirilecek Sayfalar

- 🚧 Dashboard - Ana kullanıcı paneli
- 🚧 PDF Upload - Dosya yükleme arayüzü
- 🚧 Summary View - AI özetlerini görüntüleme
- 🚧 Quiz Interface - Soru çözme ekranı
- 🚧 Social Feed - Paylaşım akışı
- 🚧 Profile - Kullanıcı profil yönetimi

## 📋 Geliştirme Aşamaları

### Phase 1: Frontend Foundation ✅
- [x] Proje setup (Vite + React)
- [x] Tailwind CSS configuration
- [x] Routing setup
- [x] Landing page
- [x] Login page
- [x] Register page

### Phase 2: Backend Development 🚧
- [ ] Spring Boot proje kurulumu
- [ ] PostgreSQL veritabanı tasarımı
- [ ] JWT authentication
- [ ] User management API
- [ ] PDF upload endpoint

### Phase 3: AI Integration 📅
- [ ] OpenAI API entegrasyonu
- [ ] PDF text extraction
- [ ] Summarization service
- [ ] Quiz generation service
- [ ] Key concept extraction

### Phase 4: Social Features 📅
- [ ] Paylaşım sistemi
- [ ] Oylama mekanizması
- [ ] Yorum sistemi
- [ ] Kullanıcı puanlama

### Phase 5: Testing & Deployment 📅
- [ ] Unit tests
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Production deployment

## 🎨 Design Philosophy

- **Modern & Clean**: Dribbble ve 21st.dev'den ilham alınmış
- **User-Centric**: Kullanıcı deneyimi odaklı
- **Accessible**: WCAG standartlarına uygun
- **Responsive**: Tüm cihazlarda mükemmel görünüm
- **Performance**: Hızlı ve optimize edilmiş

## 🔧 Supabase (Community özelliği)

Dashboard’daki **Community** bölümü (fotoğraf paylaşımı ve yorumlar) için Supabase’de şunlar gerekir:

- **Tablo ve RLS**: `community_posts` ve `community_comments` migration ile oluşturulmuş olmalı.
- **Storage**: Supabase Dashboard → **Storage** → **New bucket** → isim: `community`, **Public bucket** işaretli olsun. Böylece yüklenen fotoğraflar herkese açık URL ile kullanılabilir.

## 📚 Dokümantasyon

Detaylı teknik spesifikasyonlar ve sistem mimarisi için [Req.md](./Req.md) dosyasına bakınız.

## 🤝 Katkıda Bulunma

Bu proje tez çalışması kapsamında geliştirilmektedir.

## 📄 Lisans

Bu proje akademik amaçlı geliştirilmiştir.

---

**Not**: Proje aktif geliştirme aşamasındadır. Her gün yeni özellikler eklenmektedir.

**Geliştirme**: 2026
