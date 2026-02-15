Yapay Zeka ile Güçlendirilmiş İşbirlikçi Öğrenme Platformu
Teknik Proje Planı ve Sistem Mimarisi Dokümanı
1. Proje Amacı
Bu projenin amacı, yükseköğretim öğrencilerinin PDF formatındaki akademik materyallerini:
Otomatik olarak özetleyen
Anahtar kavram ve formülleri çıkaran
Otomatik quiz üreten
Sosyal paylaşım ve akran değerlendirmesi imkanı sunan
entegre bir web platformu geliştirmektir.
Sistem, üretken yapay zekâ modellerini işbirlikçi öğrenme yaklaşımıyla birleştirerek aktif öğrenmeyi teşvik etmeyi hedeflemektedir.
2. Kullanılacak Teknolojiler (Form ile Uyumlu Nihai Liste)
2.1 Backend Teknolojileri
Java
Spring Boot
Spring Web
Spring Security
JPA (Java Persistence API)
Hibernate
PostgreSQL
H2 Database (Development ve Test için)
Log4j veya SLF4J / Logback
2.2 Frontend Teknolojileri
JavaScript (ES6+)
React
2.3 Yapay Zeka Entegrasyonu
OpenAI API (GPT-4o veya GPT-4)
Prompt Engineering teknikleri
2.4 PDF İşleme
PyMuPDF (fitz)
2.5 Veri İletişimi ve Güvenlik
REST API (JSON formatında)
JWT (JSON Web Token) Authentication
2.6 Test ve Kalite Güvencesi
JUnit 5
Postman
Jest
3. Sistem Mimarisi
Sistem çok katmanlı ve modüler bir yapıda tasarlanacaktır.
3.1 Genel Mimari Akış
React (Frontend)
        ↓
Spring Boot REST API (Backend)
        ↓
AI Servis Katmanı (OpenAI API)
        ↓
PostgreSQL Veritabanı
        ↓
PDF İşleme Servisi (PyMuPDF)
4. Sistem Modülleri
4.1 Kullanıcı Yönetim Modülü
Özellikler:
Kullanıcı kayıt (Register)
Kullanıcı giriş (Login)
JWT tabanlı kimlik doğrulama
Rol bazlı yetkilendirme
Profil yönetimi
Teknik Gereksinimler:
Spring Security
BCrypt ile şifre hashleme
JWT access token
Stateless authentication mimarisi
4.2 PDF Yükleme ve İşleme Modülü
İş Akışı:
Kullanıcı PDF yükler
Dosya sunucuya kaydedilir
PyMuPDF ile metin çıkarılır
Metin temizleme işlemleri uygulanır
Metin parçalara (chunk) bölünür
Yapay zekâ servisine gönderilir
Metin Temizleme İşlemleri:
Header ve footer temizleme
Sayfa numarası silme
Fazla boşlukların temizlenmesi
Kodlama düzeltmeleri
4.3 Yapay Zeka Modülleri
4.3.1 Özetleme Modülü
Fonksiyon:
Sayfa bazlı özet
Doküman bazlı özet
Yapılandırılmış akademik özet
Prompt Engineering ile:
Halüsinasyon azaltma
Formüllerin korunması
JSON formatında çıktı zorunluluğu
4.3.2 Anahtar Kavram ve Formül Çıkarma
Beklenen çıktı formatı:
Tanımlar listesi
Anahtar kavramlar
Matematiksel formüller
Çıktı JSON formatında saklanacaktır.
4.3.3 Quiz Üretim Modülü
Desteklenen Soru Türleri:
Çoktan seçmeli (4 seçenekli)
Doğru/Yanlış
Kısa cevaplı
Zorluk seviyeleri:
Kolay
Orta
Zor
Her soru için:
Doğru cevap
Açıklama metni
4.4 Sosyal ve İşbirlikçi Modül
Özellikler:
Not paylaşma (public / private)
Faydalı / faydasız oylama
Yorum yapma
İçerik puanlama
Popüler içerik sıralama
Bu modül akran değerlendirme mekanizmasını oluşturur.
5. Veritabanı Tasarımı
5.1 Ana Tablolar
USERS
id
name
email
password
role
created_at
DOCUMENTS
id
user_id
title
pdf_path
created_at
SUMMARIES
id
document_id
summary_text
QUIZZES
id
document_id
difficulty
QUESTIONS
id
quiz_id
question_text
option_a
option_b
option_c
option_d
correct_answer
explanation
VOTES
id
user_id
document_id
vote_type
COMMENTS
id
user_id
document_id
content
created_at
6. Güvenlik Mimarisi
JWT ile kimlik doğrulama
Spring Security ile endpoint koruması
Role-based authorization
CORS yapılandırması
Input validation
SQL injection koruması (JPA sayesinde)
7. Test ve Doğrulama Süreci
7.1 Backend Testleri
JUnit 5 ile unit test
Repository testleri
Service katmanı testleri
7.2 API Testleri
Postman koleksiyonları
Endpoint doğrulama
JWT testleri
7.3 Frontend Testleri
Jest ile component testleri
Snapshot testleri
8. Değerlendirme Metodolojisi
8.1 Nicel Değerlendirme
Quiz doğruluk oranı
Özet kalitesi ölçümü
Kullanım istatistikleri
Quiz tamamlama oranı
8.2 Nitel Değerlendirme
Pilot kullanıcı grubu (en az 10 öğrenci)
SUS (System Usability Scale)
Yarı yapılandırılmış mülakat
Hedef SUS skoru: 70 ve üzeri
9. Non-Functional Requirements
Performans
Asenkron AI çağrıları
Büyük PDF’ler için parçalara bölme
H2 ile hızlı test ortamı
Ölçeklenebilirlik
Stateless backend
REST tabanlı mimari
Ayrık frontend-backend yapısı
Loglama ve İzleme
Log4j veya SLF4J/Logback
Hata kayıt sistemi