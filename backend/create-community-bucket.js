/**
 * Supabase Storage'da 'community' bucket'ını oluşturur
 * 
 * Kullanım:
 * 1. Supabase Dashboard'dan Service Role Key'i al (Settings > API > service_role key)
 * 2. .env dosyasına ekle: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 * 3. Çalıştır: node create-community-bucket.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://weakxpyxpmqckfnofkrl.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY bulunamadı!');
  console.log('\n📝 Adımlar:');
  console.log('1. Supabase Dashboard → Settings → API');
  console.log('2. "service_role" key\'i kopyala (⚠️ Gizli tut!)');
  console.log('3. backend/.env dosyasına ekle: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCommunityBucket() {
  console.log('🔄 Community bucket oluşturuluyor...\n');

  try {
    // Mevcut bucket'ları kontrol et
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }

    const existingBucket = buckets?.find(b => b.name === 'community');
    
    if (existingBucket) {
      console.log('✅ "community" bucket zaten mevcut!');
      console.log(`   ID: ${existingBucket.id}`);
      console.log(`   Public: ${existingBucket.public ? 'Evet' : 'Hayır'}`);
      
      if (!existingBucket.public) {
        console.log('\n⚠️  Bucket public değil! Public yapmak için:');
        console.log('   Supabase Dashboard → Storage → community → Settings → Public bucket: ON');
      }
      return;
    }

    // Yeni bucket oluştur
    const { data, error } = await supabase.storage.createBucket('community', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (error) {
      throw error;
    }

    console.log('✅ "community" bucket başarıyla oluşturuldu!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Public: Evet`);
    console.log('\n🎉 Artık Community özelliğini kullanabilirsin!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
    
    if (error.message?.includes('already exists')) {
      console.log('\n💡 Bucket zaten var gibi görünüyor. Dashboard\'dan kontrol et.');
    } else if (error.message?.includes('permission') || error.message?.includes('403')) {
      console.log('\n⚠️  İzin hatası! Service Role Key doğru mu kontrol et.');
    }
    
    process.exit(1);
  }
}

createCommunityBucket();
