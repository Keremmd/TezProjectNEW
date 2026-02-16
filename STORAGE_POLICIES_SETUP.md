# Storage Bucket Policies Kurulumu

## Sorun
`community` bucket'ında **0 policies** var, bu yüzden fotoğraf yükleme başarısız oluyor.

## Çözüm: Storage Policies Ekle

### Yöntem 1: Supabase Dashboard (Önerilen)

1. **Supabase Dashboard'a git:**
   ```
   https://supabase.com/dashboard/project/weakxpyxpmqckfnofkrl/storage/policies
   ```

2. **`community` bucket'ını seç** (sağdaki ok ikonuna tıkla)

3. **"New Policy"** butonuna tıkla

4. **Policy 1: Authenticated users can upload**
   - **Policy name:** `Authenticated users can upload`
   - **Allowed operation:** `INSERT`
   - **Policy definition:**
     ```sql
     (bucket_id = 'community' AND auth.role() = 'authenticated')
     ```
   - **Save**

5. **"New Policy"** butonuna tekrar tıkla

6. **Policy 2: Anyone can read**
   - **Policy name:** `Anyone can read`
   - **Allowed operation:** `SELECT`
   - **Policy definition:**
     ```sql
     (bucket_id = 'community')
     ```
   - **Save**

7. **"New Policy"** butonuna tekrar tıkla

8. **Policy 3: Users can delete own files**
   - **Policy name:** `Users can delete own files`
   - **Allowed operation:** `DELETE`
   - **Policy definition:**
     ```sql
     (bucket_id = 'community' AND auth.uid()::text = (storage.foldername(name))[1])
     ```
   - **Save**

### Yöntem 2: SQL ile (Alternatif - Storage policies için SQL çalışmaz, ama deneyebilirsin)

Storage policies SQL ile direkt eklenemez, ama Supabase'in `storage.policies` view'ına bakabilirsin:

```sql
-- Mevcut storage policies'i görüntüle
SELECT * FROM storage.policies WHERE bucket_id = 'community';
```

---

## Alternatif Çözüm: Backend üzerinden upload

Eğer Storage policies eklemek istemiyorsan, fotoğraf upload'ını backend'e taşıyabiliriz. Bu durumda:
- Frontend → Backend API'ye fotoğraf gönderir
- Backend → Service Role Key ile Supabase Storage'a yükler (RLS bypass)
- Backend → Public URL'i döner
- Frontend → URL ile post oluşturur

Bu yaklaşımı tercih edersen söyle, backend'e endpoint ekleyeyim.
