import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const I18nContext = createContext(null);

const MESSAGES = {
  en: {
    // Global
    language_en: 'English',
    language_tr: 'Turkish',

    // Dashboard – navigation & common labels
    nav_home: 'Home',
    nav_my_pdfs: 'My PDFs',
    nav_my_courses: 'My Courses',
    nav_my_quizzes: 'My Quizzes',
    nav_flashcards: 'Flashcards',
    nav_shared_content: 'Shared Content',
    nav_community: 'Community',
    nav_settings: 'Settings',
    nav_logout: 'Logout',
    search_placeholder: 'Search PDFs or quizzes...',

    // Dashboard – quiz time limit
    quiz_time_limit_label: 'Time Limit (minutes)',
    quiz_time_limit_minutes_short: '{minutes} min',
    quiz_time_limit_selected: '{minutes} minutes selected. The quiz will be submitted automatically when time is up.',
    quiz_time_limit_none: 'If you do not select a time limit, the quiz will have no time limit.',
    quiz_time_limit_badge: 'Time limit: {minutes} min',

    // PDF viewer – AI assistant
    pdf_ai_title: 'AI Assistant',
    pdf_ai_subtitle: 'Ask questions about this PDF. Answers are based only on the opened document.',
    pdf_ai_welcome_with_course:
      'Hello! I\'m your AI assistant. I can help you understand "{title}" for the course "{course}". Ask me anything about this PDF!',
    pdf_ai_welcome_without_course:
      'Hello! I\'m your AI assistant. I can help you understand "{title}". Ask me anything about this PDF!',
    pdf_ai_input_placeholder: 'Ask a question about this PDF...',
    pdf_ai_send: 'Send',
    pdf_ai_sending: 'Sending...',
    pdf_ai_error_generic:
      'Sorry, there was an error while answering this question. Please try again in a moment.',

    // Quiz page – timer
    quiz_timer_remaining_suffix: 'left',

    // Sections
    section_my_pdfs_title: 'My PDFs',
    section_my_pdfs_subtitle: 'All your uploaded PDF documents',
    section_my_courses_title: 'My Courses',
    section_my_courses_subtitle: 'All your PDFs and courses',
    section_my_quizzes_title: 'My Quizzes',
    section_my_quizzes_subtitle: 'Test your knowledge on uploaded PDFs',
    section_flashcards_title: 'Flashcards',
    section_flashcards_subtitle: 'Study from quiz decks or create decks from any PDF.',
    section_shared_title: 'Shared Content',
    section_shared_subtitle: 'Explore public PDFs and quizzes from all users',
    section_community_title: 'Community',
    section_community_subtitle: 'Share photos, ask questions, answer with comments to others',
    section_settings_title: 'Settings',
    section_settings_subtitle: 'Account and app settings',

    // Shared content controls
    shared_tab_pdfs: 'PDFs',
    shared_tab_quizzes: 'Quizzes',
    shared_refresh: 'Refresh',
    shared_filters_title: 'Filters',
    shared_filters_course_label: 'Course Name',
    shared_filters_course_placeholder: 'e.g., ISG, Math...',
    shared_filters_university_label: 'University',
    shared_filters_university_placeholder: 'e.g., Ege, Boğaziçi...',
    shared_filters_grade_label: 'Grade (Select multiple)',
    shared_filters_sort_label: 'Sort by:',
    shared_filters_sort_default: 'Default',
    shared_filters_sort_most_votes: 'Most votes',
    shared_filters_sort_highest_rating: 'Highest rating',
    shared_filters_clear_all: 'Clear all filters',
    shared_filters_no_pdfs_match: 'No PDFs match your filters',
    shared_filters_no_public_pdfs: 'No public PDFs yet',
    shared_filters_try_adjusting: 'Try adjusting your filters',
    shared_filters_when_users_share: 'When users share PDFs publicly, they will appear here!',
    shared_votes_label: '{count} vote{suffix}',
    shared_no_votes_yet: 'No votes yet',
    shared_view_button: 'View',

    // Community controls
    community_add_post: 'Add Post',
    community_filter_placeholder: 'Filter by course name...',
    community_clear_filter: 'Clear',

    // My PDFs – card labels & buttons
    pdf_card_course: 'Course:',
    pdf_card_university: 'University:',
    pdf_card_grade: 'Grade:',
    pdf_card_privacy: 'Privacy:',
    pdf_card_status: 'Status:',
    pdf_card_privacy_public: 'Public',
    pdf_card_privacy_private: 'Private',
    pdf_card_status_in_progress: 'In Progress',
    pdf_card_status_completed: 'Completed',
    pdf_card_open: 'Open',
    pdf_card_cards: 'Cards',

    // Quizzes – labels & buttons
    quiz_questions_label: '{count} questions',
    quiz_score_label: 'Score {score}/{total}',
    quiz_start_button: 'Start Quiz',
    quiz_study_cards_button: 'Study cards',
    quiz_new_button: 'New Quiz',
    quiz_modal_title: 'Create New Quiz',
    quiz_attempt_chip_label: 'Attempt {index}',

    // Home stats
    home_welcome: 'Welcome, {name}! 👋',
    home_subtitle: 'Which PDF do you want to learn today?',
    home_stat_total_pdfs_label: 'Total PDFs',
    home_stat_total_pdfs_change: '{count} completed',
    home_stat_quizzes_label: 'Quizzes',
    home_stat_quizzes_change: '{count} created',
    home_stat_shared_label: 'Shared',
    home_stat_shared_change: '{count} public',
    home_stat_points_label: 'Learning Points',
    home_stat_points_change: 'Keep learning!',
    home_upload_title: 'Upload PDF',
    home_upload_subtitle: 'Drag & drop or click',
    home_upload_button: 'Choose File',
    home_upload_hint: 'Max 50MB • PDF format only',
    home_recent_uploads: 'Recent Uploads',

    // Analytics – quiz performance
    analytics_title: 'Learning analytics',
    analytics_subtitle: 'See how your quiz performance changes over time.',
    analytics_best_score_label: 'Best score',
    analytics_attempts_label: '{count} attempts',
    analytics_last_attempt_label: 'Last attempt',
    analytics_no_attempts_title: 'No quiz data yet',
    analytics_no_attempts_subtitle: 'Take a quiz to see detailed statistics and charts here.',

    // Courses – section & modal
    courses_new_button: 'New Course',
    courses_progress_label: 'Progress',
    courses_continue_button: 'Continue',
    courses_empty_title: 'No courses yet',
    courses_empty_subtitle: 'Create your first course by grouping PDFs together!',
    courses_empty_create_button: 'Create Course',
    courses_modal_title: 'Create New Course',
    courses_modal_title_label: 'Course Title *',
    courses_modal_title_placeholder: 'e.g., Mathematics PDFs, Physics Notes...',

    // Flashcards
    flashcards_title: 'Flashcards',
    flashcards_subtitle: 'Study from quiz decks or create decks from any PDF.',
    flashcards_create_from_pdf_button: 'Create deck from PDF',
    flashcards_from_pdfs_title: 'From PDFs',
    flashcards_from_quizzes_title: 'From Quizzes',
    flashcards_pdf_deck_badge: 'PDF deck',
    flashcards_study_deck_button: 'Study deck',
    flashcards_quiz_cards_label: '{count} cards',
    flashcards_no_quiz_decks_title: 'No quiz decks yet',
    flashcards_no_quiz_decks_subtitle: 'Create a quiz from My Quizzes to study as cards.',
    flashcards_go_to_my_quizzes_button: 'Go to My Quizzes',
  },
  tr: {
    // Global
    language_en: 'İngilizce',
    language_tr: 'Türkçe',

    // Dashboard – navigation & common labels
    nav_home: 'Ana Sayfa',
    nav_my_pdfs: 'PDF\'lerim',
    nav_my_courses: 'Kurslarım',
    nav_my_quizzes: 'Quizlerim',
    nav_flashcards: 'Kartlar',
    nav_shared_content: 'Paylaşılan İçerik',
    nav_community: 'Topluluk',
    nav_settings: 'Ayarlar',
    nav_logout: 'Çıkış Yap',
    search_placeholder: 'PDF veya quiz ara...',

    // Dashboard – quiz time limit
    quiz_time_limit_label: 'Süre Sınırı (dakika)',
    quiz_time_limit_minutes_short: '{minutes} dk',
    quiz_time_limit_selected:
      '{minutes} dakika seçildi. Süre dolunca quiz otomatik gönderilir.',
    quiz_time_limit_none: 'Süre seçmezsen quiz süresiz olur.',
    quiz_time_limit_badge: 'Süre: {minutes} dk',

    // PDF viewer – AI assistant
    pdf_ai_title: 'Yapay Zekâ Asistanı',
    pdf_ai_subtitle:
      'Bu PDF hakkında sorular sor. Cevaplar yalnızca açık olan dokümana dayanır.',
    pdf_ai_welcome_with_course:
      'Merhaba! Ben senin yapay zekâ asistanınım. "{course}" dersi için "{title}" PDF\'ini anlamana yardım edebilirim. Bu PDF hakkında istediğini sor!',
    pdf_ai_welcome_without_course:
      'Merhaba! Ben senin yapay zekâ asistanınım. "{title}" PDF\'ini anlamana yardım edebilirim. Bu PDF hakkında istediğini sor!',
    pdf_ai_input_placeholder: 'Bu PDF hakkında bir soru sor...',
    pdf_ai_send: 'Gönder',
    pdf_ai_sending: 'Gönderiliyor...',
    pdf_ai_error_generic:
      'Üzgünüm, bu soruya yanıt verirken bir hata oluştu. Lütfen biraz sonra tekrar dene.',

    // Quiz page – timer
    quiz_timer_remaining_suffix: 'kaldı',

    // Sections
    section_my_pdfs_title: 'PDF\'lerim',
    section_my_pdfs_subtitle: 'Yüklediğin tüm PDF dokümanları',
    section_my_courses_title: 'Kurslarım',
    section_my_courses_subtitle: 'Tüm PDF ve kursların',
    section_my_quizzes_title: 'Quizlerim',
    section_my_quizzes_subtitle: 'Yüklediğin PDF\'ler üzerinden kendini test et',
    section_flashcards_title: 'Kartlar',
    section_flashcards_subtitle: 'Quiz ve PDF\'lerden çalışma kartları ile tekrar et.',
    section_shared_title: 'Paylaşılan İçerik',
    section_shared_subtitle: 'Tüm kullanıcıların paylaştığı PDF ve quizleri keşfet',
    section_community_title: 'Topluluk',
    section_community_subtitle: 'Fotoğraf paylaş, soru sor, yorumlarla diğerlerine yardım et',
    section_settings_title: 'Ayarlar',
    section_settings_subtitle: 'Hesap ve uygulama ayarları',

    // Shared content controls
    shared_tab_pdfs: 'PDF\'ler',
    shared_tab_quizzes: 'Quizler',
    shared_refresh: 'Yenile',
    shared_filters_title: 'Filtreler',
    shared_filters_course_label: 'Ders Adı',
    shared_filters_course_placeholder: 'Örn: İSG, Matematik...',
    shared_filters_university_label: 'Üniversite',
    shared_filters_university_placeholder: 'Örn: Ege, Boğaziçi...',
    shared_filters_grade_label: 'Sınıf (Birden fazla seçilebilir)',
    shared_filters_sort_label: 'Sırala:',
    shared_filters_sort_default: 'Varsayılan',
    shared_filters_sort_most_votes: 'En çok oy',
    shared_filters_sort_highest_rating: 'En yüksek puan',
    shared_filters_clear_all: 'Tüm filtreleri temizle',
    shared_filters_no_pdfs_match: 'Filtrelerine uyan PDF yok',
    shared_filters_no_public_pdfs: 'Henüz herkese açık PDF yok',
    shared_filters_try_adjusting: 'Filtrelerini değiştirmeyi dene',
    shared_filters_when_users_share: 'Kullanıcılar PDF paylaştığında burada gözükecek!',
    shared_votes_label: '{count} oy',
    shared_no_votes_yet: 'Henüz oy yok',
    shared_view_button: 'Görüntüle',

    // Community controls
    community_add_post: 'Gönderi Ekle',
    community_filter_placeholder: 'Derse göre filtrele...',
    community_clear_filter: 'Temizle',

    // My PDFs – card labels & buttons
    pdf_card_course: 'Ders:',
    pdf_card_university: 'Üniversite:',
    pdf_card_grade: 'Sınıf:',
    pdf_card_privacy: 'Gizlilik:',
    pdf_card_status: 'Durum:',
    pdf_card_privacy_public: 'Herkese Açık',
    pdf_card_privacy_private: 'Gizli',
    pdf_card_status_in_progress: 'Devam ediyor',
    pdf_card_status_completed: 'Tamamlandı',
    pdf_card_open: 'Aç',
    pdf_card_cards: 'Kartlar',

    // Quizzes – labels & buttons
    quiz_questions_label: '{count} soru',
    quiz_score_label: 'Skor {score}/{total}',
    quiz_start_button: 'Quizi Başlat',
    quiz_study_cards_button: 'Kartlarla çalış',
    quiz_new_button: 'Yeni Quiz',
    quiz_modal_title: 'Yeni Quiz Oluştur',
    quiz_attempt_chip_label: '{index}. deneme',

    // Home stats
    home_welcome: 'Hoş geldin, {name}! 👋',
    home_subtitle: 'Bugün hangi PDF\'i çalışmak istiyorsun?',
    home_stat_total_pdfs_label: 'Toplam PDF',
    home_stat_total_pdfs_change: '{count} tamamlandı',
    home_stat_quizzes_label: 'Quizler',
    home_stat_quizzes_change: '{count} oluşturuldu',
    home_stat_shared_label: 'Paylaşılan',
    home_stat_shared_change: '{count} herkese açık',
    home_stat_points_label: 'Öğrenme Puanı',
    home_stat_points_change: 'Öğrenmeye devam et!',
    home_upload_title: 'PDF Yükle',
    home_upload_subtitle: 'Sürükleyip bırak veya tıkla',
    home_upload_button: 'Dosya Seç',
    home_upload_hint: 'Maksimum 50MB • PDF formatı',
    home_recent_uploads: 'Son Yüklenenler',

    // Analytics – quiz performance
    analytics_title: 'Gelişmiş analiz ve ilerleme',
    analytics_subtitle:
      'Quiz denemelerin, başarı oranların ve en iyi skorun bu panelde gösterilir.',
    analytics_best_score_label: 'En iyi skor',
    analytics_attempts_label: '{count} deneme',
    analytics_last_attempt_label: 'Son deneme',
    analytics_no_attempts_title: 'Henüz analiz için veri yok',
    analytics_no_attempts_subtitle:
      'Önce birkaç quiz çöz, ardından burada detaylı istatistikleri ve grafiklerini gör.',

    // Courses – section & modal
    courses_new_button: 'Yeni Kurs',
    courses_progress_label: 'İlerleme',
    courses_continue_button: 'Devam et',
    courses_empty_title: 'Henüz kurs yok',
    courses_empty_subtitle: 'PDF\'leri gruplayarak ilk kursunu oluştur.',
    courses_empty_create_button: 'Kurs Oluştur',
    courses_modal_title: 'Yeni Kurs Oluştur',
    courses_modal_title_label: 'Kurs Başlığı *',
    courses_modal_title_placeholder: 'Örn: Matematik PDF\'leri, Fizik Notları...',

    // Flashcards
    flashcards_title: 'Kartlar',
    flashcards_subtitle: 'Quiz destelerinden çalış veya herhangi bir PDF\'ten kart destesi oluştur.',
    flashcards_create_from_pdf_button: 'PDF\'ten deste oluştur',
    flashcards_from_pdfs_title: 'PDF\'lerden',
    flashcards_from_quizzes_title: 'Quizlerden',
    flashcards_pdf_deck_badge: 'PDF destesi',
    flashcards_study_deck_button: 'Desteyi çalış',
    flashcards_quiz_cards_label: '{count} kart',
    flashcards_no_quiz_decks_title: 'Henüz quiz destesi yok',
    flashcards_no_quiz_decks_subtitle: 'Kartlarla çalışmak için Quizlerim bölümünden bir quiz oluştur.',
    flashcards_go_to_my_quizzes_button: 'Quizlerime git',
  },
};

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : `{${key}}`,
  );
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem('language');
    if (stored === 'tr' || stored === 'en') return stored;
    const browser = window.navigator.language?.toLowerCase() || '';
    return browser.startsWith('tr') ? 'tr' : 'en';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('language', language);
    } catch {
      // ignore storage errors
    }
  }, [language]);

  const t = useMemo(
    () =>
      (key, vars) => {
        const langTable = MESSAGES[language] || MESSAGES.en;
        const fallbackTable = language === 'en' ? MESSAGES.tr : MESSAGES.en;
        const raw =
          langTable[key] ??
          fallbackTable[key] ??
          key;
        return typeof raw === 'string' ? interpolate(raw, vars) : key;
      },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

