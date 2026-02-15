# 4.1 Analiz

Proje analizi kapsamında fonksiyonel ve fonksiyonel olmayan gereksinimler ile sistemin ana senaryoları analiz edilmiştir.

## 4.1.1 Fonksiyonel Gereksinimler

- Kullanıcı, e-posta ve şifre ile kayıt olabilmeli ve kullanıcı hesabı oluşturabilmeli.
- Kullanıcı, oluşturduğu hesap bilgileri ile uygulamada oturum açabilmeli.
- Kullanıcı, uygulamadan güvenli bir şekilde çıkış yapabilmeli.
- Kullanıcı, profil bilgilerini (ad, soyad, üniversite vb.) görüntüleyebilmeli ve güncelleyebilmeli.
- Kullanıcı, PDF dosyası yükleyebilmeli; yüklenen dosya sunucuda saklanabilmeli ve kullanıcıya listelenebilmeli.
- Kullanıcı, yüklediği PDF’leri görüntüleyebilmeli, indirebilmeli ve silebilmeli; PDF’leri gizli (private) veya herkese açık (public) olarak işaretleyebilmeli.
- Kullanıcı, PDF’lerden oluşturulmuş kurslar (koleksiyonlar) oluşturabilmeli; kurslara PDF ekleyebilmeli ve PDF tamamlanma durumunu işaretleyebilmeli.
- Sistem, kullanıcının seçtiği PDF’ten yapay zeka (Gemini veya Groq/Llama) kullanarak çoktan seçmeli quiz sorusu üretebilmeli; kullanıcı soru sayısı, zorluk ve quiz görünürlüğünü (gizli/herkese açık) seçebilmeli.
- Kullanıcı, oluşturulan quiz’i başlatabilmeli, soruları yanıtlayabilmeli ve quiz sonunda puanını (doğru/toplam ve yüzde) görebilmeli.
- Sistem, kullanıcının her quiz için son denemesindeki puanı (örn. 10’da 6) kaydedebilmeli ve kullanıcıya quiz listesinde “Score X/Y” olarak gösterebilmeli.
- Kullanıcı, artık istemediği quiz’i silebilmeli (onay ile).
- Kullanıcı, herkese açık PDF’leri ve herkese açık quiz’leri paylaşılan içerik bölümünde listeleyebilmeli; kurs adı, üniversite ve sınıf gibi kriterlere göre filtreleyebilmeli.
- Kullanıcı, paylaşılan bir quiz’e tıklayarak o quiz’i çözebilmeli (izin varsa).

## 4.1.2 Fonksiyonel Olmayan Gereksinimler

- Kullanıcı, arayüzü (dashboard, quiz ekranı, PDF görüntüleyici) modern bir web tarayıcısı üzerinden hatasız kullanabilmeli.
- Quiz sorusu üretimi için kullanılan yapay zeka servisi (Gemini veya Groq) kota aşımında kullanıcıya anlamlı hata mesajı verilmeli; sahte (mock) soru ile quiz oluşturulmamalı.
- PDF metin çıkarma ve quiz üretimi işlemleri sunucu tarafında (backend) yapılmalı; API anahtarları ve hassas ayarlar ortam değişkenleri (.env) ile yönetilmeli.
- Frontend React 19, Vite 7 ve Tailwind CSS; backend Node.js ve Express; veri ve kimlik doğrulama Supabase (PostgreSQL, Auth, Storage) kullanılarak implemente edilmiş olmalı.
- Quiz ve PDF listeleri, kullanıcıya özel verilerle yüklenebilmeli; paylaşılan içerik yalnızca public işaretli kayıtları göstermeli.

## 4.1.3 Use Case

Projenin ana senaryoları şu şekildedir:

- Kullanıcı kaydı ve oturum yönetimi
- PDF yükleme ve yönetimi
- Quiz oluşturma (yapay zeka ile)
- Quiz çözme ve sonuç görüntüleme
- Paylaşılan içerikten quiz çözme

---

**Use Case 01: Kullanıcı Kaydı ve Oturum Açma**

**Level:** User Goal  
**Primary Actor:** Öğrenci / Kullanıcı  

**Preconditions:**
- Kullanıcı uygulama giriş sayfasına erişmiş olmalı.
- Kayıt için e-posta ve şifre belirlenmemiş olmalı (yeni kullanıcı).

**Post Conditions:**
- Kullanıcı hesabı oluşturulur ve kullanıcı oturum açmış olur; dashboard’a yönlendirilir.

**Main Success Scenario:**
1. Kullanıcı kayıt (Register) sayfasına gider.
2. Kullanıcı e-posta, şifre ve isteğe bağlı profil bilgilerini girer.
3. Sistem, Supabase Auth ile kullanıcıyı oluşturur.
4. Sistem, kullanıcıyı oturum açmış kabul eder ve dashboard’a yönlendirir.

---

**Use Case 02: PDF Yükleme ve Listeleme**

**Level:** User Goal  
**Primary Actor:** Öğrenci / Kullanıcı  

**Preconditions:**
- Kullanıcı uygulamada oturum açmış olmalı.
- Kullanıcı Dashboard’da “My PDFs” bölümünde olmalı.

**Post Conditions:**
- PDF sunucuda (Supabase Storage) saklanır; veritabanına kayıt düşülür ve kullanıcı listesinde görünür.

**Main Success Scenario:**
1. Kullanıcı “Upload PDF” (veya benzeri) işlemini başlatır.
2. Kullanıcı dosya seçer; isteğe bağlı olarak kurs adı, üniversite, sınıf ve gizlilik (public/private) bilgilerini girer.
3. Sistem, dosyayı Supabase Storage’a yükler ve `pdfs` tablosuna kayıt ekler.
4. Sistem, güncel PDF listesini kullanıcıya gösterir; kullanıcı PDF’i görüntüleyebilir, indirebilir veya silebilir.

---

**Use Case 03: Yapay Zeka ile Quiz Oluşturma**

**Level:** User Goal  
**Primary Actor:** Öğrenci / Kullanıcı  

**Preconditions:**
- Kullanıcı oturum açmış olmalı.
- En az bir PDF yüklenmiş ve listeleniyor olmalı.
- Backend servisi çalışıyor olmalı; AI sağlayıcısı (Groq veya Gemini) için geçerli API anahtarı tanımlı olmalı.

**Post Conditions:**
- Seçilen PDF’ten üretilen sorularla yeni bir quiz veritabanında oluşturulur; kullanıcı “My Quizzes” listesinde quiz’i görür.

**Main Success Scenario:**
1. Kullanıcı Dashboard’da “My Quizzes” bölümüne gider ve “New Quiz” butonuna tıklar.
2. Kullanıcı bir PDF seçer, quiz başlığı girer; soru sayısı (10/15/20), zorluk (easy/medium/hard) ve görünürlük (private/public) seçer.
3. Kullanıcı “Create” butonuna basar.
4. Sistem, backend’e quiz oluşturma isteği gönderir; backend PDF metnini çıkarır ve yapay zeka (Groq veya Gemini) ile çoktan seçmeli sorular üretir.
5. Sistem, üretilen soruları `quizzes` ve `quiz_questions` tablolarına yazar.
6. Kullanıcıya başarı mesajı gösterilir ve quiz listesi güncellenir; kullanıcı “Start Quiz” ile quiz’i çözebilir.

---

**Use Case 04: Quiz Çözme ve Sonuç Görüntüleme**

**Level:** User Goal  
**Primary Actor:** Öğrenci / Kullanıcı  

**Preconditions:**
- Kullanıcı oturum açmış olmalı.
- En az bir quiz mevcut olmalı; kullanıcı quiz sayfasına (örn. /quiz/:id) erişmiş olmalı.

**Post Conditions:**
- Kullanıcının cevapları hesaplanır; doğru/toplam ve yüzde olarak sonuç gösterilir; bu deneme `quiz_attempts` tablosuna kaydedilir.

**Main Success Scenario:**
1. Kullanıcı quiz kartında “Start Quiz” butonuna tıklar ve quiz sayfasına yönlendirilir.
2. Sistem, quiz sorularını ve seçeneklerini gösterir; kullanıcı her soru için bir seçenek işaretler ve “Next” / “Previous” ile ilerler.
3. Kullanıcı tüm soruları yanıtladıktan sonra sonuçları görmek için ilgili butona tıklar.
4. Sistem, doğru cevap sayısı ve yüzdesini hesaplar; sonucu ekranda gösterir.
5. Sistem, bu denemeyi `quiz_attempts` tablosuna (kullanıcı id, quiz id, score, total_points, percentage, completed_at) kaydeder.
6. Kullanıcı dashboard’a döndüğünde ilgili quiz kartında “Score X/Y” (son deneme puanı) bilgisini görür.

---

**Use Case 05: Paylaşılan İçerikten Quiz Görüntüleme ve Çözme**

**Level:** User Goal  
**Primary Actor:** Öğrenci / Kullanıcı  

**Preconditions:**
- Kullanıcı oturum açmış olmalı.
- En az bir quiz “public” olarak işaretlenmiş olmalı.

**Post Conditions:**
- Kullanıcı paylaşılan quiz listesinde public quiz’i görür; quiz’e tıklayarak çözebilir ve sonucu kendi deneme geçmişine kaydedilir.

**Main Success Scenario:**
1. Kullanıcı Dashboard’da “Shared Content” bölümüne gider ve “Quizzes” sekmesini seçer.
2. Sistem, gizliliği “public” olan quiz’leri listeler (isteğe bağlı filtreler uygulanabilir).
3. Kullanıcı bir quiz’e tıklar ve quiz sayfasına yönlendirilir.
4. Kullanıcı quiz’i çözer ve sonuç ekranını görür; deneme kendi kullanıcı hesabına `quiz_attempts` ile kaydedilir.
5. Kullanıcı dashboard’a döndüğünde “My Quizzes” içinde kendi quiz’lerinde “Score X/Y” güncellenir; paylaşılan quiz’i çözdüyse kendi son skoru görünür (ilgili quiz kullanıcının kendi quiz’i ise).

---

## 4.1.4 İleride Yapılacak / Planlanan Çalışmalar

Mevcut sistemin geliştirilmesi ve tez kapsamı sonrasındaki olası çalışmalar aşağıda özetlenmiştir:

- **PDF tabanlı sohbet (chatbot):** Yüklenen PDF’e dayalı soru–cevap veya özet sohbeti. Kullanıcı metinle ilgili soru yazacak; sistem mevcut `/api/analyze/pdf` veya genişletilmiş bir endpoint ile yapay zeka kullanarak yanıt üretecek. Bu özellik analiz bölümünde bahsedilen “PDF yükledikten sonra chatbot’a yazma” senaryosuna karşılık gelir.

- **Quiz deneme geçmişi ve istatistikler:** Her quiz için tüm denemelerin listelenmesi (tarih, puan, yüzde); zaman içinde puan grafiği veya “en iyi skor” gösterimi. Kullanıcının ilerlemesini takip etmek için dashboard’a bir “Quiz history” veya “Stats” bölümü eklenebilir.

- **PDF özeti (AI summary):** Yüklenen PDF için otomatik kısa özet veya anahtar kelimeler üretimi. Mevcut analiz API’si genişletilerek özet sonucu veritabanında saklanıp PDF kartında gösterilebilir.

- **Süre sınırlı quiz (time limit):** Quiz başlarken süre seçimi (örn. 5/10/15 dakika); süre dolunca otomatik gönderim ve sonuç hesaplama. Veritabanında `time_limit` alanı mevcut; frontend ve quiz sayfasına zamanlayıcı entegrasyonu planlanabilir.

- **Bildirimler ve hatırlatmalar:** Kullanıcıya “kursunda tamamlanmamış PDF var” veya “quiz’i tekrar çöz” gibi e-posta veya uygulama içi bildirimler. Supabase veya üçüncü taraf servislerle entegrasyon düşünülebilir.

- **Mobil uyumluluk ve PWA:** Arayüzün mobil cihazlarda daha iyi kullanılması; gerekirse PWA (Progressive Web App) ile çevrimdışı önbellekleme veya “uygulama gibi” kurulum deneyimi.

- **Çoklu dil desteği:** Arayüz metinlerinin Türkçe/İngilizce (veya daha fazla dil) seçeneği ile sunulması; quiz sorusu üretiminde dil seçimi zaten mevcut, arayüz için i18n kütüphanesi eklenebilir.

- **Erişilebilirlik (accessibility):** Klavye navigasyonu, ekran okuyucu uyumu (ARIA etiketleri), yeterli kontrast ve odak yönetimi ile erişilebilir kullanım hedeflenebilir.

- **Performans ve ölçeklenebilirlik:** Büyük PDF’ler için parçalı işleme veya arka planda quiz üretimi (job queue); Supabase ve API rate limit’leri göz önüne alınarak optimizasyon planlanabilir.

Bu maddeler, tez sürecinde “gelecek çalışmalar” veya “öneriler” bölümünde genişletilerek sunulabilir.

---

## 4.2 Tasarım

Tasarım bölümünde yukarıdaki Use Case’lere ait system sequence diyagramları (SSD) ve gerekli diğer mimari diyagramlar çizilebilir. Örneğin:

- **Şekil 4.1** – “Yapay Zeka ile Quiz Oluşturma” Use Case’i için SSD (Kullanıcı – Frontend – Backend – Supabase – Groq/Gemini API).
- **Şekil 4.2** – “Quiz Çözme ve Sonuç Kaydetme” Use Case’i için SSD (Kullanıcı – Frontend – Supabase).
- **Şekil 4.3** – “PDF Yükleme ve Listeleme” Use Case’i için SSD (Kullanıcı – Frontend – Supabase Auth & Storage).

Bu diyagramlar, tezde ilgili bölüme elle veya bir çizim aracı ile eklenebilir.
