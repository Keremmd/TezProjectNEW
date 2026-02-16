# Community Bucket Oluşturma Rehberi

## 🎯 Yöntem 1: Supabase Dashboard (Önerilen - En Kolay)

### Adım 1: Supabase Dashboard'a Git
1. Tarayıcında şu adrese git:
   ```
   https://supabase.com/dashboard/project/weakxpyxpmqckfnofkrl/storage/buckets
   ```
   Veya:
   - https://supabase.com/dashboard → Projeni seç → Sol menüden **Storage** → **Buckets**

### Adım 2: Yeni Bucket Oluştur
1. Sağ üstte **"New bucket"** butonuna tıkla
2. Açılan formda:
   - **Name**: `community` (tam olarak bu isim, küçük harf)
   - **Public bucket**: ✅ **Açık** (ON) - Bu çok önemli!
   - Diğer ayarlar varsayılan kalabilir

### Adım 3: Oluştur
1. **"Create bucket"** butonuna tıkla
2. ✅ Başarılı! Artık Community özelliğini kullanabilirsin

---

## 🚀 Yöntem 2: Script ile (Alternatif)

Eğer Dashboard'a girmek istemiyorsan, script ile de oluşturabilirsin:

### Adım 1: Service Role Key Al
1. Supabase Dashboard → **Settings** → **API**
2. **"service_role"** key'ini kopyala (⚠️ Bu key çok gizli, kimseyle paylaşma!)

### Adım 2: .env Dosyasına Ekle
`backend/.env` dosyasına şu satırı ekle:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Adım 3: Script'i Çalıştır
```bash
cd backend
node create-community-bucket.js
```

---

## ✅ Kontrol Et

Bucket oluşturulduktan sonra:
- Dashboard'da **Storage** → **Buckets** altında `community` görünmeli
- **Public** kolonunda ✅ işareti olmalı

---

## 🐛 Sorun mu var?

- **"Bucket already exists"**: Zaten var, sorun yok!
- **"Permission denied"**: Service Role Key yanlış veya eksik
- **Fotoğraf yüklenmiyor**: Bucket'ın **Public** olduğundan emin ol
