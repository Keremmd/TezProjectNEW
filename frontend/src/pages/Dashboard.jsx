import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import {
  Upload,
  FileText,
  BookOpen,
  Brain,
  Users,
  Search,
  Settings,
  LogOut,
  Home,
  Plus,
  Clock,
  TrendingUp,
  Star,
  Share2,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Sun,
  Moon,
  MessageCircle,
  ImagePlus,
  Send,
  Layers,
  GraduationCap,
  FileCheck2,
  Timer,
  Loader
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [dragActive, setDragActive] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadData, setUploadData] = useState({
    university: '',
    grade: '',
    courseName: '',
    privacy: 'private'
  });
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    university: ''
  });
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [userPDFs, setUserPDFs] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [courses, setCourses] = useState([]);
  const [newCourseModalOpen, setNewCourseModalOpen] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    title: '',
    description: '',
    selectedPDFs: []
  });
  const [addCoursePdfsSelection, setAddCoursePdfsSelection] = useState([]);
  const [addCourseQuizzesSelection, setAddCourseQuizzesSelection] = useState([]);
  const [examPlanPreviewCourse, setExamPlanPreviewCourse] = useState(null);
  const [courseStudyPlans, setCourseStudyPlans] = useState({}); // { [courseId]: plan }
  const [examPlanModalOpen, setExamPlanModalOpen] = useState(false);
  const [examPlanCourse, setExamPlanCourse] = useState(null);
  const [examPlanDate, setExamPlanDate] = useState('');
  const [examPlanSelectedPdfs, setExamPlanSelectedPdfs] = useState([]);
  const [examPlanSelectedQuizzes, setExamPlanSelectedQuizzes] = useState([]);
  const [favoriteCourses, setFavoriteCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deleteCourseModalOpen, setDeleteCourseModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [publicPDFs, setPublicPDFs] = useState([]);
  const [publicPdfRatings, setPublicPdfRatings] = useState({}); // { [pdfId]: { avg, count } }
  const [userPdfRatings, setUserPdfRatings] = useState({}); // { [pdfId]: rating }
  const [sharedFilters, setSharedFilters] = useState({
    courseName: '',
    university: '',
    grades: []
  });
  const [sharedSort, setSharedSort] = useState('default'); // 'default' | 'most_votes' | 'highest_rating'
  const [refreshingPublic, setRefreshingPublic] = useState(false);
  const [publicQuizzes, setPublicQuizzes] = useState([]);
  const [publicQuizRatings, setPublicQuizRatings] = useState({}); // { [quizId]: { avg, count } }
  const [userQuizRatings, setUserQuizRatings] = useState({}); // { [quizId]: rating }
  const [sharedView, setSharedView] = useState('pdfs'); // 'pdfs' | 'quizzes'
  const [deleteQuizModalOpen, setDeleteQuizModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  // Theme: 'light' | 'dark' (uyum için html class ile senkron)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Community (photo Q&A)
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityPostModalOpen, setCommunityPostModalOpen] = useState(false);
  const [communityNewPost, setCommunityNewPost] = useState({ imageFile: null, caption: '', courseName: '' });
  const [communityPosting, setCommunityPosting] = useState(false);
  const [selectedCommunityPost, setSelectedCommunityPost] = useState(null);
  const [communityComments, setCommunityComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentImage, setNewCommentImage] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imagePreview, setImagePreview] = useState({ open: false, url: null, alt: '' });
  const [communityFilterCourse, setCommunityFilterCourse] = useState('');
  const [deleteCommunityPostModalOpen, setDeleteCommunityPostModalOpen] = useState(false);
  const [communityPostToDelete, setCommunityPostToDelete] = useState(null);
  const [deletingCommunityPost, setDeletingCommunityPost] = useState(false);
  const profileImageInputRef = useRef(null);
  const commentsContainerRef = useRef(null);
  
  // Quiz states
  const [quizzes, setQuizzes] = useState([]);
  const [newQuizModalOpen, setNewQuizModalOpen] = useState(false);
  const [newQuizData, setNewQuizData] = useState({
    pdfId: '',
    title: '',
    questionCount: 10,
    difficulty: 'medium',
    privacy: 'private',
    timeLimitMinutes: null
  });
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [lastScoreByQuizId, setLastScoreByQuizId] = useState({}); // { [quizId]: { score, total_points } }
  const [quizAttempts, setQuizAttempts] = useState([]); // full attempt history for analytics

  // PDF flashcard decks (source_type = 'pdf')
  const [pdfDecks, setPdfDecks] = useState([]);
  const [createDeckModalOpen, setCreateDeckModalOpen] = useState(false);
  const [createDeckPdfId, setCreateDeckPdfId] = useState('');
  const [createDeckTitle, setCreateDeckTitle] = useState('');
  const [createDeckCardCount, setCreateDeckCardCount] = useState(12);
  const [generatingDeck, setGeneratingDeck] = useState(false);
  const [deleteDeckModalOpen, setDeleteDeckModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState(null);
  const [deletingDeck, setDeletingDeck] = useState(false);

  // ---- Exam Simulator state ----
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [examError, setExamError] = useState(null);
  const [examForm, setExamForm] = useState({
    title: '',
    pdfIds: [],
    durationMinutes: 60,
    language: 'Turkish',
    sections: [
      { name: 'Çoktan Seçmeli', type: 'mcq', count: 10, difficulty: 'medium', points_per_question: 2 },
      { name: 'Doğru/Yanlış', type: 'true_false', count: 5, difficulty: 'easy', points_per_question: 1 },
      { name: 'Boşluk Doldurma', type: 'cloze', count: 5, difficulty: 'medium', points_per_question: 2 },
      { name: 'Klasik', type: 'open', count: 3, difficulty: 'hard', points_per_question: 10 }
    ]
  });
  const [deleteExamModalOpen, setDeleteExamModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [examFormOpen, setExamFormOpen] = useState(false);

  // Load user profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        university: user.user_metadata?.university || ''
      });
      if (user.user_metadata?.avatar_url) {
        setProfileImagePreview(user.user_metadata.avatar_url);
      }
    }
  }, [user]);

  // Sync theme to DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load user PDFs
  const loadUserPDFs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pdfs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserPDFs(data || []);
    } catch (error) {
      console.error('Error loading PDFs:', error);
    }
  };

  // Load user courses
  const loadUserCourses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_pdfs (
            id,
            pdf_id,
            completed,
            completed_at,
            order_index,
            pdfs (*)
          ),
          course_quizzes (
            id,
            quiz_id,
            quizzes (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedCourses = data || [];
      setCourses(loadedCourses);

      // Load any stored study plans for these courses from localStorage
      if (typeof window !== 'undefined') {
        setCourseStudyPlans((prev) => {
          const next = { ...prev };
          for (const course of loadedCourses) {
            const key = `studyplan_${user.id}_${course.id}`;
            try {
              const raw = window.localStorage.getItem(key);
              if (raw) {
                next[course.id] = JSON.parse(raw);
              }
            } catch {
              // ignore parse/storage errors
            }
          }
          return next;
        });
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Apply shared sort (by votes / rating)
  const applySharedSort = (items, getRatingStats) => {
    if (sharedSort === 'most_votes') {
      return [...items].sort((a, b) => {
        const aStats = getRatingStats(a) || { count: 0, avg: 0 };
        const bStats = getRatingStats(b) || { count: 0, avg: 0 };

        if (bStats.count !== aStats.count) return bStats.count - aStats.count;
        return (bStats.avg || 0) - (aStats.avg || 0);
      });
    }

    if (sharedSort === 'highest_rating') {
      return [...items].sort((a, b) => {
        const aStats = getRatingStats(a) || { count: 0, avg: 0 };
        const bStats = getRatingStats(b) || { count: 0, avg: 0 };

        if ((bStats.avg || 0) !== (aStats.avg || 0)) return (bStats.avg || 0) - (aStats.avg || 0);
        return bStats.count - aStats.count;
      });
    }

    return items;
  };

  // Filter + sort public PDFs
  const getFilteredPublicPDFs = () => {
    const filtered = publicPDFs.filter(pdf => {
      const matchCourse = !sharedFilters.courseName || 
        pdf.course_name.toLowerCase().includes(sharedFilters.courseName.toLowerCase());
      const matchUniversity = !sharedFilters.university || 
        pdf.university.toLowerCase().includes(sharedFilters.university.toLowerCase());
      const matchGrade = sharedFilters.grades.length === 0 || 
        sharedFilters.grades.includes(pdf.grade.toString());
      
      return matchCourse && matchUniversity && matchGrade;
    });

    return applySharedSort(filtered, (pdf) => publicPdfRatings[pdf.id]);
  };

  // Refresh public PDFs
  const refreshPublicPDFs = async () => {
    setRefreshingPublic(true);
    await Promise.all([loadPublicPDFs(), loadPublicQuizzes()]);
    setRefreshingPublic(false);
  };

  // Toggle grade filter
  const toggleGradeFilter = (grade) => {
    setSharedFilters(prev => {
      if (prev.grades.includes(grade)) {
        return { ...prev, grades: prev.grades.filter(g => g !== grade) };
      } else {
        return { ...prev, grades: [...prev.grades, grade] };
      }
    });
  };

  // Rate a public PDF (1-5 stars)
  const handleRatePdf = async (pdfId, rating) => {
    if (!user) {
      alert('Please log in to rate PDFs.');
      return;
    }
    try {
      const current = userPdfRatings[pdfId];

      if (current && current === rating) {
        // Same star clicked again -> remove rating
        const { error: deleteError } = await supabase
          .from('pdf_ratings')
          .delete()
          .eq('pdf_id', pdfId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        // Refresh ratings for this PDF
        const { data: rows, error: rowsError } = await supabase
          .from('pdf_ratings')
          .select('rating')
          .eq('pdf_id', pdfId);

        if (!rowsError && rows) {
          const sum = rows.reduce((acc, r) => acc + r.rating, 0);
          const count = rows.length;

          setPublicPdfRatings((prev) => ({
            ...prev,
            [pdfId]: count > 0 ? { avg: sum / count, count } : undefined
          }));

          setUserPdfRatings((prev) => {
            const copy = { ...prev };
            delete copy[pdfId];
            return copy;
          });
        }
        return;
      }

      // New rating or change
      const { error } = await supabase
        .from('pdf_ratings')
        .upsert(
          {
            pdf_id: pdfId,
            user_id: user.id,
            rating
          },
          { onConflict: 'pdf_id,user_id' }
        );

      if (error) throw error;

      // Refresh ratings for this PDF (simple select and compute on client)
      const { data: rows, error: rowsError } = await supabase
        .from('pdf_ratings')
        .select('rating')
        .eq('pdf_id', pdfId);

      if (!rowsError && rows) {
        const sum = rows.reduce((acc, r) => acc + r.rating, 0);
        const count = rows.length;

        setPublicPdfRatings((prev) => ({
          ...prev,
          [pdfId]: {
            avg: count > 0 ? sum / count : 0,
            count
          }
        }));

        // Set current user's rating so stars show exactly what they chose
        setUserPdfRatings((prev) => ({
          ...prev,
          [pdfId]: rating
        }));
      }
    } catch (err) {
      console.error('Error rating PDF:', err);
      alert(err.message || 'Unable to submit rating.');
    }
  };

  // Rate a public Quiz (1-5 stars)
  const handleRateQuiz = async (quizId, rating) => {
    if (!user) {
      alert('Please log in to rate quizzes.');
      return;
    }
    try {
      const current = userQuizRatings[quizId];

      if (current && current === rating) {
        // Same star clicked again -> remove rating
        const { error: deleteError } = await supabase
          .from('quiz_ratings')
          .delete()
          .eq('quiz_id', quizId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        // Refresh ratings for this quiz
        const { data: rows, error: rowsError } = await supabase
          .from('quiz_ratings')
          .select('rating')
          .eq('quiz_id', quizId);

        if (!rowsError && rows) {
          const sum = rows.reduce((acc, r) => acc + r.rating, 0);
          const count = rows.length;

          setPublicQuizRatings((prev) => ({
            ...prev,
            [quizId]: count > 0 ? { avg: sum / count, count } : undefined
          }));

          setUserQuizRatings((prev) => {
            const copy = { ...prev };
            delete copy[quizId];
            return copy;
          });
        }
        return;
      }

      // New rating or change
      const { error } = await supabase
        .from('quiz_ratings')
        .upsert(
          {
            quiz_id: quizId,
            user_id: user.id,
            rating
          },
          { onConflict: 'quiz_id,user_id' }
        );

      if (error) throw error;

      // Refresh ratings for this quiz (simple select and compute on client)
      const { data: rows, error: rowsError } = await supabase
        .from('quiz_ratings')
        .select('rating')
        .eq('quiz_id', quizId);

      if (!rowsError && rows) {
        const sum = rows.reduce((acc, r) => acc + r.rating, 0);
        const count = rows.length;

        setPublicQuizRatings((prev) => ({
          ...prev,
          [quizId]: {
            avg: count > 0 ? sum / count : 0,
            count
          }
        }));

        // Set current user's rating so stars show exactly what they chose
        setUserQuizRatings((prev) => ({
          ...prev,
          [quizId]: rating
        }));
      }
    } catch (err) {
      console.error('Error rating quiz:', err);
      alert(err.message || 'Unable to submit rating.');
    }
  };

  // Load public PDFs for Shared Content
  const loadPublicPDFs = async () => {
    try {
      console.log('🌍 Loading public PDFs...');
      
      const { data, error } = await supabase
        .from('pdfs')
        .select('*')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading public PDFs:', error);
        throw error;
      }

      console.log('✅ Public PDFs loaded:', data);
      const pdfList = data || [];
      setPublicPDFs(pdfList);

      // Load ratings for these PDFs and compute average + current user's rating on the client
      if (pdfList.length > 0) {
        const pdfIds = pdfList.map((p) => p.id);
        const { data: ratingRows, error: ratingError } = await supabase
          .from('pdf_ratings')
          .select('pdf_id, user_id, rating')
          .in('pdf_id', pdfIds);

        if (ratingError) {
          console.error('❌ Error loading PDF ratings:', ratingError);
          setPublicPdfRatings({});
          setUserPdfRatings({});
        } else {
          const statsMap = {};
          const userMap = {};
          (ratingRows || []).forEach((row) => {
            if (!statsMap[row.pdf_id]) {
              statsMap[row.pdf_id] = { sum: 0, count: 0 };
            }
            statsMap[row.pdf_id].sum += row.rating;
            statsMap[row.pdf_id].count += 1;

            if (user && row.user_id === user.id) {
              userMap[row.pdf_id] = row.rating;
            }
          });

          const finalMap = {};
          Object.entries(statsMap).forEach(([pdfId, { sum, count }]) => {
            finalMap[pdfId] = {
              avg: count > 0 ? sum / count : 0,
              count
            };
          });
          setPublicPdfRatings(finalMap);
          setUserPdfRatings(userMap);
        }
      } else {
        setPublicPdfRatings({});
        setUserPdfRatings({});
      }
    } catch (error) {
      console.error('❌ Error loading public PDFs:', error);
    }
  };

  // Load public quizzes for Shared Content
  const loadPublicQuizzes = async () => {
    try {
      console.log('🌍 Loading public quizzes...');
      
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          pdf:pdfs(file_name, course_name, university, grade)
        `)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading public quizzes:', error);
        throw error;
      }

      console.log('✅ Public quizzes loaded:', data);
      const quizList = data || [];
      setPublicQuizzes(quizList);

      // Load ratings for these quizzes and compute average + current user's rating on the client
      if (quizList.length > 0) {
        const quizIds = quizList.map((q) => q.id);
        const { data: ratingRows, error: ratingError } = await supabase
          .from('quiz_ratings')
          .select('quiz_id, user_id, rating')
          .in('quiz_id', quizIds);

        if (ratingError) {
          console.error('❌ Error loading quiz ratings:', ratingError);
          setPublicQuizRatings({});
          setUserQuizRatings({});
        } else {
          const statsMap = {};
          const userMap = {};
          (ratingRows || []).forEach((row) => {
            if (!statsMap[row.quiz_id]) {
              statsMap[row.quiz_id] = { sum: 0, count: 0 };
            }
            statsMap[row.quiz_id].sum += row.rating;
            statsMap[row.quiz_id].count += 1;

            if (user && row.user_id === user.id) {
              userMap[row.quiz_id] = row.rating;
            }
          });

          const finalMap = {};
          Object.entries(statsMap).forEach(([quizId, { sum, count }]) => {
            finalMap[quizId] = {
              avg: count > 0 ? sum / count : 0,
              count
            };
          });
          setPublicQuizRatings(finalMap);
          setUserQuizRatings(userMap);
        }
      } else {
        setPublicQuizRatings({});
        setUserQuizRatings({});
      }
    } catch (error) {
      console.error('❌ Error loading public quizzes:', error);
    }
  };

  // Load user quizzes
  const loadUserQuizzes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          pdf:pdfs(file_name, course_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Quizzes loaded:', data);
      setQuizzes(data || []);
    } catch (error) {
      console.error('❌ Error loading quizzes:', error);
    }
  };

  // Load last attempt score per quiz (for "Score X/Y" on cards)
  const loadLastScores = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, total_points, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      const byQuiz = {};
      (data || []).forEach((a) => {
        if (!byQuiz[a.quiz_id]) byQuiz[a.quiz_id] = { score: a.score, total_points: a.total_points };
      });
      setLastScoreByQuizId(byQuiz);
    } catch (err) {
      console.error('Error loading last scores:', err);
    }
  };

  // Load full quiz attempts history for analytics
  const loadQuizAnalytics = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('id, quiz_id, score, total_points, percentage, created_at, quiz:quizzes(title, difficulty)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuizAttempts(data || []);
    } catch (error) {
      console.error('Error loading quiz analytics:', error);
    }
  };

  // Parse exam date from user input (supports "YYYY-MM-DD" and "DD.MM.YYYY")
  const parseExamDateString = (value) => {
    if (!value) return null;
    let d = null;

    // ISO format: 2026-03-17
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      d = new Date(value);
    }
    // Turkish style: 17.03.2026
    else if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
      const [day, month, year] = value.split('.');
      d = new Date(Number(year), Number(month) - 1, Number(day));
    }

    if (!d || Number.isNaN(d.getTime())) return null;
    return d;
  };

  // Build a simple study schedule from today until exam date
  const buildCourseStudyPlan = (
    course,
    examDateStr,
    selectedPdfIds,
    courseQuizzes = [],
    selectedQuizIds = [],
  ) => {
    if (!course || !examDateStr || !selectedPdfIds.length) return null;

    const examDate = parseExamDateString(examDateStr);
    if (!examDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysCount =
      Math.round((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (daysCount < 1) daysCount = 1;

    const days = [];
    for (let i = 0; i < daysCount; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        date: d.toISOString().slice(0, 10),
        items: []
      });
    }

    const pdfMap = {};
    (course.course_pdfs || []).forEach((cp) => {
      if (cp.pdf_id && cp.pdfs) {
        pdfMap[cp.pdf_id] = cp.pdfs;
      }
    });

    const pdfs = selectedPdfIds
      .map((id) => ({ id, meta: pdfMap[id] }))
      .filter((p) => p.meta)
      // Chapter1, Chapter2, ... gibi isimlere göre sırala
      .sort((a, b) => (a.meta.file_name || '').localeCompare(b.meta.file_name || undefined, undefined, { numeric: true, sensitivity: 'base' }));

    if (!pdfs.length) return null;

    // Spread PDFs across the full period until the exam
    pdfs.forEach((pdf, index) => {
      // Evenly distribute indexes over [0, days.length - 1]
      const rawPos = ((index + 0.5) * days.length) / pdfs.length;
      const dayIndex = Math.min(
        days.length - 1,
        Math.max(0, Math.round(rawPos) - 1)
      );

      days[dayIndex].items.push({
        type: 'pdf',
        pdfId: pdf.id,
        title: pdf.meta.file_name
      });
    });

    // Also distribute related quizzes (if any) across the period
    const quizzesForPlan = (courseQuizzes || [])
      .map((row) => row.quizzes)
      .filter(Boolean)
      .filter((quiz) => !selectedQuizIds || selectedQuizIds.includes(quiz.id));

    quizzesForPlan.forEach((quiz, index) => {
      const rawPos = ((index + 0.5) * days.length) / quizzesForPlan.length;
      const dayIndex = Math.min(
        days.length - 1,
        Math.max(0, Math.round(rawPos) - 1)
      );

      days[dayIndex].items.push({
        type: 'quiz',
        quizId: quiz.id,
        title: `Quiz: ${quiz.title}`
      });
    });

    return {
      examDate: examDate.toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      days
    };
  };

  // Load PDF-based flashcard decks
  const loadPdfDecks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('id, title, source_id, created_at')
        .eq('user_id', user.id)
        .eq('source_type', 'pdf')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPdfDecks(data || []);
    } catch (err) {
      console.error('Error loading PDF flashcard decks:', err);
    }
  };

  useEffect(() => {
    if (user && activeSection === 'flashcards') {
      loadPdfDecks();
    }
  }, [user, activeSection]);

  // ---- Exam Simulator: load exams ----
  const loadExams = async () => {
    if (!user) return;
    setLoadingExams(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error('Error loading exams:', err);
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    if (user && activeSection === 'exams') {
      loadExams();
    }
  }, [user, activeSection]);

  const toggleExamPdf = (pdfId) => {
    setExamForm((prev) => ({
      ...prev,
      pdfIds: prev.pdfIds.includes(pdfId)
        ? prev.pdfIds.filter((id) => id !== pdfId)
        : [...prev.pdfIds, pdfId],
    }));
  };

  const updateExamSection = (index, updates) => {
    setExamForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  };

  const addExamSection = () => {
    setExamForm((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { name: 'Yeni Bölüm', type: 'mcq', count: 5, difficulty: 'medium', points_per_question: 2 },
      ],
    }));
  };

  const removeExamSection = (index) => {
    setExamForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const totalExamQuestions = examForm.sections.reduce(
    (sum, s) => sum + (Number(s.count) || 0),
    0
  );
  const totalExamPoints = examForm.sections.reduce(
    (sum, s) => sum + (Number(s.count) || 0) * (Number(s.points_per_question) || 0),
    0
  );

  const handleGenerateExam = async () => {
    if (!user) return;
    setExamError(null);
    const trimmedTitle = examForm.title.trim();
    if (!trimmedTitle) {
      setExamError('Sınav başlığı zorunludur.');
      return;
    }
    if (examForm.pdfIds.length === 0) {
      setExamError('En az bir PDF seçmelisin.');
      return;
    }
    const hasQuestions = examForm.sections.some((s) => Number(s.count) > 0);
    if (!hasQuestions) {
      setExamError('En az bir bölümde soru sayısı 0\'dan büyük olmalı.');
      return;
    }

    setGeneratingExam(true);
    try {
      const response = await fetch('http://localhost:3001/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: trimmedTitle,
          pdfIds: examForm.pdfIds,
          language: language === 'tr' ? 'Turkish' : 'English',
          durationMinutes: examForm.durationMinutes || null,
          sections: examForm.sections
            .filter((s) => Number(s.count) > 0)
            .map((s) => ({
              name: s.name,
              type: s.type,
              count: Number(s.count),
              difficulty: s.difficulty,
              points_per_question: Number(s.points_per_question),
            })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Sınav üretilemedi');
      }
      await loadExams();
      setExamForm((prev) => ({ ...prev, title: '', pdfIds: [] }));
      navigate(`/exam/${data.exam.id}`);
    } catch (err) {
      console.error('Exam generation error:', err);
      setExamError(err.message || 'Sınav üretilemedi');
    } finally {
      setGeneratingExam(false);
    }
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examToDelete.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setExams((prev) => prev.filter((e) => e.id !== examToDelete.id));
    } catch (err) {
      console.error('Error deleting exam:', err);
    } finally {
      setDeleteExamModalOpen(false);
      setExamToDelete(null);
    }
  };

  const handleDeleteDeck = (deck, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setDeckToDelete(deck);
    setDeleteDeckModalOpen(true);
  };

  const confirmDeleteDeck = async () => {
    if (!deckToDelete || !user) return;
    setDeletingDeck(true);
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', deckToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPdfDecks(prev => prev.filter(d => d.id !== deckToDelete.id));
      setSuccessMessage({ type: 'success', text: `Deck "${deckToDelete.title}" deleted.` });
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeleteDeckModalOpen(false);
      setDeckToDelete(null);
    } catch (err) {
      console.error('Error deleting deck:', err);
      setSuccessMessage({ type: 'error', text: err.message || 'Failed to delete deck.' });
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setDeletingDeck(false);
    }
  };

  // Create flashcard deck from PDF (AI) - same flow as quiz creation
  const handleCreateDeckFromPdf = () => {
    if (!createDeckPdfId || !user) {
      alert('Please select a PDF');
      return;
    }
    const pdf = userPDFs.find((p) => p.id === createDeckPdfId);
    if (!pdf) return;

    // IMMEDIATELY close modal and reset
    setCreateDeckModalOpen(false);
    const pdfId = createDeckPdfId;
    const cardCount = createDeckCardCount;
    const title = createDeckTitle.trim() || pdf.file_name.replace(/\.pdf$/i, '');
    setCreateDeckPdfId('');
    setCreateDeckTitle('');
    setCreateDeckCardCount(12);
    setGeneratingDeck(true);

    // Show initial message
    setSuccessMessage({ 
      type: 'info', 
      text: '🔄 Creating flashcard deck... This may take 20-40 seconds.' 
    });

    // Create deck in background
    fetch('http://localhost:3001/api/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfId,
        cardCount,
        language: 'Turkish',
      }),
    })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 404) {
          throw new Error('Backend endpoint not found. Make sure backend is running on port 3001.');
        }
        throw new Error(errorData.error || `Server error (${res.status}): Failed to generate flashcards`);
      }
      return await res.json();
    })
    .then(async (data) => {
      const finalTitle = title || data.title || pdf.file_name.replace(/\.pdf$/i, '');
      const cards = data.cards || [];

      if (cards.length === 0) {
        throw new Error('No cards generated. Please try again.');
      }

      // Create deck in Supabase
      const { data: deck, error: deckErr } = await supabase
        .from('flashcard_decks')
        .insert({
          user_id: user.id,
          title: finalTitle,
          source_type: 'pdf',
          source_id: pdfId,
        })
        .select('id')
        .single();

      if (deckErr || !deck) throw new Error(deckErr?.message || 'Failed to create deck');

      // Insert all cards
      for (let i = 0; i < cards.length; i++) {
        const { error: cardErr } = await supabase.from('flashcards').insert({
          deck_id: deck.id,
          front: cards[i].front,
          back: cards[i].back,
          order_index: i,
        });
        if (cardErr) throw cardErr;
      }

      // Success!
      setSuccessMessage({ 
        type: 'success', 
        text: `✅ Deck "${finalTitle}" created! ${cards.length} cards ready.` 
      });
      setTimeout(() => setSuccessMessage(null), 5000);
      loadPdfDecks();
      
      // Navigate to the deck after a short delay
      setTimeout(() => {
        navigate(`/flashcards/deck/${deck.id}`);
      }, 1000);
    })
    .catch((err) => {
      console.error('❌ Deck creation error:', err);
      const isQuota = err.message?.includes('quota') || err.message?.includes('Too Many Requests');
      const isTokenLimit = err.message?.includes('Request too large') || err.message?.includes('tokens per minute') || err.message?.includes('TPM');
      
      let errorMsg = err.message || 'Failed to create deck. Try again.';
      if (isTokenLimit) {
        errorMsg = 'PDF is too large. Try reducing the number of cards (8 or 12) or use a shorter PDF.';
      } else if (isQuota) {
        errorMsg = err.message || 'API quota exceeded. Please try again later.';
      }
      
      setSuccessMessage({ 
        type: 'error', 
        text: errorMsg
      });
      setTimeout(() => setSuccessMessage(null), 8000);
    })
    .finally(() => {
      setGeneratingDeck(false);
    });
  };

  // Create new quiz — only place we call AI (Gemini); no auto/polling requests
  const handleCreateQuiz = () => {
    // Validate
    if (!newQuizData.pdfId || !newQuizData.title) {
      alert('Please select a PDF and enter a quiz title');
      return;
    }

    // Save data (include privacy and time limit so backend saves it)
    const quizData = {
      pdfId: newQuizData.pdfId,
      userId: user.id,
      title: newQuizData.title,
      questionCount: newQuizData.questionCount,
      difficulty: newQuizData.difficulty,
      privacy: newQuizData.privacy || 'private',
      timeLimitMinutes: newQuizData.timeLimitMinutes
    };
    
    // IMMEDIATELY close modal and reset
    setNewQuizModalOpen(false);
    setNewQuizData({ 
      pdfId: '', 
      title: '', 
      questionCount: 10, 
      difficulty: 'medium', 
      privacy: 'private',
      timeLimitMinutes: null
    });
    setCreatingQuiz(true);
    
    // Create quiz in background
    fetch('http://localhost:3001/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData)
    })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      console.log('📡 Response status:', res.status, res.statusText);
      console.log('📦 Response data:', data);
      if (!res.ok || !data?.success) {
        const msg = data?.message || data?.error || `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
      }
      return data;
    })
    .then((data) => {
      if (data && data.quiz) {
        console.log('✅ Quiz created!');
        setSuccessMessage({ 
          type: 'success', 
          text: `✅ Quiz Created! ${data.quiz.total_questions} questions ready.` 
        });
        setTimeout(() => setSuccessMessage(null), 7000);
        loadUserQuizzes();
      } else {
        console.error('❌ Invalid response:', data);
        throw new Error('Invalid response from server');
      }
    })
    .catch((err) => {
      console.error('❌ Quiz creation error:', err);
      const isQuota = err.status === 429 || err.message?.includes('quota') || err.message?.includes('Too Many Requests');
      setSuccessMessage({ 
        type: 'error', 
        text: isQuota && err.message
          ? err.message
          : (err.message || 'Quiz creation failed. Try again.')
      });
      setTimeout(() => setSuccessMessage(null), 8000);
    })
    .finally(() => {
      console.log('🏁 Quiz creation finished');
      setCreatingQuiz(false);
    });
  };

  // Delete quiz
  const handleDeleteQuiz = (quiz) => {
    setQuizToDelete(quiz);
    setDeleteQuizModalOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    try {
      await supabase.from('quizzes').delete().eq('id', quizToDelete.id);
      setQuizzes(prev => prev.filter(q => q.id !== quizToDelete.id));
      setPublicQuizzes(prev => prev.filter(q => q.id !== quizToDelete.id));
      setSuccessMessage({
        type: 'success',
        text: 'Quiz deleted successfully.'
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setSuccessMessage({
        type: 'error',
        text: 'Failed to delete quiz.'
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setDeleteQuizModalOpen(false);
      setQuizToDelete(null);
    }
  };

  // Load community posts
  const loadCommunityPosts = async () => {
    setCommunityLoading(true);
    try {
      let query = supabase
        .from('community_posts')
        .select('*');
      
      // Apply course name filter if provided
      if (communityFilterCourse.trim()) {
        query = query.ilike('course_name', `%${communityFilterCourse.trim()}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setCommunityPosts(data || []);
    } catch (err) {
      console.error('Error loading community posts:', err);
      setCommunityPosts([]);
    } finally {
      setCommunityLoading(false);
    }
  };

  const loadCommunityComments = async (postId) => {
    if (!postId) return;
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCommunityComments(data || []);
    } catch (err) {
      console.error('Error loading comments:', err);
      setCommunityComments([]);
    }
  };

  const submitCommunityPost = async () => {
    if (!user || !communityNewPost.imageFile) return;
    setCommunityPosting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        alert('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        setCommunityPosting(false);
        return;
      }
      const ext = communityNewPost.imageFile.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('community')
        .upload(path, communityNewPost.imageFile, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('community').getPublicUrl(path);
      const authorName = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || 'Kullanıcı';
      // RLS bypass için Supabase RPC fonksiyonu kullanılıyor (auth.uid() fonksiyon içinde kontrol ediliyor)
      const { error: insertError } = await supabase.rpc('insert_community_post', {
        p_image_url: urlData.publicUrl,
        p_caption: communityNewPost.caption || null,
        p_author_name: authorName,
        p_course_name: communityNewPost.courseName || null
      });
      if (insertError) throw insertError;
      setCommunityPostModalOpen(false);
      setCommunityNewPost({ imageFile: null, caption: '', courseName: '' });
      loadCommunityPosts();
    } catch (err) {
      console.error('Error creating community post:', err);
      alert(err.message || 'Gönderi yüklenemedi. Storage bucket "community" oluşturulmuş mu kontrol edin.');
    } finally {
      setCommunityPosting(false);
    }
  };

  const submitCommunityComment = async () => {
    if (!user || !selectedCommunityPost) return;
    if (!newCommentText.trim() && !newCommentImage) return;
    setSubmittingComment(true);
    try {
      const authorName = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || 'Kullanıcı';
      let imageUrl = null;

      if (newCommentImage) {
        const ext = newCommentImage.name.split('.').pop() || 'jpg';
        // Storage RLS policy bu bucket için muhtemelen "{auth.uid()}/..." formatını bekliyor.
        // Bu yüzden postlarda kullandığımız path yapısını burada da tekrar kullanıyoruz.
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('community')
          .upload(path, newCommentImage, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('community').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: selectedCommunityPost.id,
          user_id: user.id,
          content: newCommentText.trim() || null,
          author_name: authorName,
          image_url: imageUrl
        });
      if (error) throw error;
      setNewCommentText('');
      setNewCommentImage(null);
      loadCommunityComments(selectedCommunityPost.id);
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Yorum eklenemedi.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const openCommunityPostDetail = (post) => {
    setSelectedCommunityPost(post);
    loadCommunityComments(post.id);
  };

  // Delete community post
  const handleDeleteCommunityPost = (post, e) => {
    e?.stopPropagation(); // Prevent opening the detail modal
    // Close detail modal if it's open (to prevent z-index issues)
    if (selectedCommunityPost) {
      setSelectedCommunityPost(null);
      setCommunityComments([]);
      setNewCommentText('');
    }
    // Close new post modal if it's open
    if (communityPostModalOpen) {
      setCommunityPostModalOpen(false);
    }
    setCommunityPostToDelete(post);
    setDeleteCommunityPostModalOpen(true);
  };

  const confirmDeleteCommunityPost = async () => {
    if (!communityPostToDelete || !user) return;
    setDeletingCommunityPost(true);
    try {
      // Extract file path from image_url
      // URL format: https://...supabase.co/storage/v1/object/public/community/{userId}/{filename}
      const imageUrl = communityPostToDelete.image_url;
      const urlParts = imageUrl.split('/community/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('community')
          .remove([filePath]);
        if (storageError) {
          console.error('Storage delete error:', storageError);
          // Continue with database delete even if storage delete fails
        }
      }

      // Delete comments first (cascade should handle this, but let's be explicit)
      await supabase
        .from('community_comments')
        .delete()
        .eq('post_id', communityPostToDelete.id);

      // Delete from database
      const { error: dbError } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', communityPostToDelete.id)
        .eq('user_id', user.id); // Ensure user can only delete their own posts

      if (dbError) throw dbError;

      // Close detail modal if the deleted post is currently open
      if (selectedCommunityPost?.id === communityPostToDelete.id) {
        setSelectedCommunityPost(null);
        setCommunityComments([]);
      }

      // Reload posts
      loadCommunityPosts();
      setDeleteCommunityPostModalOpen(false);
      setCommunityPostToDelete(null);
    } catch (err) {
      console.error('Error deleting community post:', err);
      alert(err.message || 'Gönderi silinemedi.');
    } finally {
      setDeletingCommunityPost(false);
    }
  };

  // Load PDFs, Courses, Quizzes, last scores, analytics and Public content when user changes
  useEffect(() => {
    if (user) {
      loadUserPDFs();
      loadUserCourses();
      loadPublicPDFs();
      loadPublicQuizzes();
      loadUserQuizzes();
      loadLastScores();
      loadCommunityPosts();
      loadQuizAnalytics();
    }
  }, [user]);

  // Load community posts when section changes
  useEffect(() => {
    if (activeSection === 'community') loadCommunityPosts();
  }, [activeSection]);

  // Load community posts when filter changes (with debounce)
  useEffect(() => {
    if (activeSection === 'community' && communityFilterCourse !== undefined) {
      const timeoutId = setTimeout(() => {
        loadCommunityPosts();
      }, 300); // 300ms debounce for filter changes
      return () => clearTimeout(timeoutId);
    }
  }, [communityFilterCourse]);

  // Toggle PDF status
  const handleStatusToggle = async (pdfId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'processing' : 'completed';
    
    try {
      const { error } = await supabase
        .from('pdfs')
        .update({ status: newStatus })
        .eq('id', pdfId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh PDF list
      loadUserPDFs();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    }
  };

  // Download PDF
  const handleDownload = async (pdf) => {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(pdf.file_path);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = pdf.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF: ' + error.message);
    }
  };

  // Delete PDF
  const handleDelete = (pdf) => {
    setPdfToDelete(pdf);
    setDeleteModalOpen(true);
  };

  // Add PDFs to an existing course
  const handleAddPdfsToCourse = async () => {
    if (!selectedCourse || !user) return;
    if (!addCoursePdfsSelection.length) return;

    try {
      const baseIndex = selectedCourse.course_pdfs?.length || 0;
      const rows = addCoursePdfsSelection.map((pdfId, idx) => ({
        course_id: selectedCourse.id,
        pdf_id: pdfId,
        order_index: baseIndex + idx
      }));

      const { error } = await supabase.from('course_pdfs').insert(rows);
      if (error) throw error;

      // Update total_pdfs and progress on the course
      const newTotalPdfs =
        (selectedCourse.total_pdfs || selectedCourse.course_pdfs?.length || 0) +
        addCoursePdfsSelection.length;

      const { error: updateCourseError } = await supabase
        .from('courses')
        .update({ total_pdfs: newTotalPdfs })
        .eq('id', selectedCourse.id);

      if (updateCourseError) throw updateCourseError;

      await updateCourseProgress(selectedCourse.id);

      // Reload courses list and fresh course data
      await loadUserCourses();

      const { data: freshCourse, error: freshError } = await supabase
        .from('courses')
        .select(`
          *,
          course_pdfs (
            id,
            pdf_id,
            completed,
            completed_at,
            order_index,
            pdfs (*)
          )
        `)
        .eq('id', selectedCourse.id)
        .single();

      if (!freshError && freshCourse) {
        setSelectedCourse(freshCourse);
      }

      setAddCoursePdfsSelection([]);
    } catch (error) {
      console.error('Error adding PDFs to course:', error);
      alert('Failed to add PDFs to course: ' + (error.message || 'Unknown error'));
    }
  };

  // Add quizzes to an existing course
  const handleAddQuizzesToCourse = async () => {
    if (!selectedCourse || !user) return;
    if (!addCourseQuizzesSelection.length) return;

    try {
      const rows = addCourseQuizzesSelection.map((quizId) => ({
        course_id: selectedCourse.id,
        quiz_id: quizId
      }));

      const { error } = await supabase.from('course_quizzes').insert(rows);
      if (error) throw error;

      const newTotalQuizzes =
        (selectedCourse.total_quizzes || selectedCourse.course_quizzes?.length || 0) +
        addCourseQuizzesSelection.length;

      const { error: updateCourseError } = await supabase
        .from('courses')
        .update({ total_quizzes: newTotalQuizzes })
        .eq('id', selectedCourse.id);

      if (updateCourseError) throw updateCourseError;

      await loadUserCourses();

      const { data: freshCourse, error: freshError } = await supabase
        .from('courses')
        .select(`
          *,
          course_pdfs (
            id,
            pdf_id,
            completed,
            completed_at,
            order_index,
            pdfs (*)
          ),
          course_quizzes (
            id,
            quiz_id,
            quizzes (*)
          )
        `)
        .eq('id', selectedCourse.id)
        .single();

      if (!freshError && freshCourse) {
        setSelectedCourse(freshCourse);
      }

      setAddCourseQuizzesSelection([]);
    } catch (error) {
      console.error('Error adding quizzes to course:', error);
      alert('Failed to add quizzes to course: ' + (error.message || 'Unknown error'));
    }
  };

  // Toggle PDF completion in course
  const togglePDFCompletion = async (coursePDFId, courseId, currentStatus) => {
    console.log('🔄 Toggling completion:', { coursePDFId, courseId, currentStatus });
    
    // Optimistic UI update
    if (selectedCourse) {
      const updatedCoursePDFs = selectedCourse.course_pdfs.map(cp => 
        cp.id === coursePDFId 
          ? { ...cp, completed: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null }
          : cp
      );
      
      const optimisticCourse = {
        ...selectedCourse,
        course_pdfs: updatedCoursePDFs
      };
      
      setSelectedCourse(optimisticCourse);
      console.log('🎨 Optimistic UI update applied');
    }
    
    try {
      const { error } = await supabase
        .from('course_pdfs')
        .update({ 
          completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', coursePDFId);

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }

      console.log('✅ Database update successful');

      // Update course progress
      const newProgress = await updateCourseProgress(courseId);

      // Reload courses list
      await loadUserCourses();

      // Fetch fresh course data to update modal
      const { data: freshCourse, error: freshError } = await supabase
        .from('courses')
        .select(`
          *,
          course_pdfs (
            id,
            pdf_id,
            completed,
            completed_at,
            order_index,
            pdfs (*)
          )
        `)
        .eq('id', courseId)
        .single();

      if (!freshError && freshCourse) {
        console.log('🔄 Fresh course data fetched:', freshCourse);
        setSelectedCourse(freshCourse);
      }

      console.log('✅ All updates completed, progress:', newProgress);
    } catch (error) {
      console.error('❌ Error toggling PDF completion:', error);
      
      // Revert optimistic update on error
      const { data: revertedCourse } = await supabase
        .from('courses')
        .select(`
          *,
          course_pdfs (
            id,
            pdf_id,
            completed,
            completed_at,
            order_index,
            pdfs (*)
          )
        `)
        .eq('id', courseId)
        .single();
      
      if (revertedCourse) {
        setSelectedCourse(revertedCourse);
      }
      
      setSuccessMessage({ type: 'error', text: 'Failed to update completion status' });
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Update course progress based on completed PDFs
  const updateCourseProgress = async (courseId) => {
    try {
      console.log('📊 Updating course progress for:', courseId);
      
      // Get all course PDFs
      const { data: coursePDFs, error: fetchError } = await supabase
        .from('course_pdfs')
        .select('completed')
        .eq('course_id', courseId);

      if (fetchError) throw fetchError;

      // Calculate progress
      const totalPDFs = coursePDFs.length;
      const completedPDFs = coursePDFs.filter(pdf => pdf.completed).length;
      const progress = totalPDFs > 0 ? Math.round((completedPDFs / totalPDFs) * 100) : 0;

      console.log('📊 Progress calculation:', { totalPDFs, completedPDFs, progress });

      // Update course
      const { error: updateError } = await supabase
        .from('courses')
        .update({ progress })
        .eq('id', courseId);

      if (updateError) throw updateError;
      
      console.log('✅ Course progress updated successfully');
      
      return progress;
    } catch (error) {
      console.error('❌ Error updating course progress:', error);
      return null;
    }
  };

  // Delete course
  const handleDeleteCourse = (course) => {
    setCourseToDelete(course);
    setDeleteCourseModalOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Close modals
      setDeleteCourseModalOpen(false);
      setCourseToDelete(null);
      if (selectedCourse?.id === courseToDelete.id) {
        setSelectedCourse(null);
      }

      // Refresh courses
      loadUserCourses();

      // Show success message
      setSuccessMessage({ type: 'success', text: `✅ Course "${courseToDelete.title}" deleted.` });
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error deleting course:', error);
      setSuccessMessage({ type: 'error', text: 'Failed to delete course: ' + error.message });
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  // Toggle favorite course
  const toggleFavorite = (courseId) => {
    setFavoriteCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  // Create new course
  const handleCreateCourse = async () => {
    if (!newCourseData.title.trim()) {
      alert('Please enter a course title!');
      return;
    }

    if (newCourseData.selectedPDFs.length === 0) {
      alert('Please select at least one PDF!');
      return;
    }

    try {
      // Create course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          title: newCourseData.title,
          description: newCourseData.description,
          total_pdfs: newCourseData.selectedPDFs.length,
          progress: 0
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Add PDFs to course
      const coursePDFs = newCourseData.selectedPDFs.map((pdfId, index) => ({
        course_id: courseData.id,
        pdf_id: pdfId,
        order_index: index
      }));

      const { error: pdfError } = await supabase
        .from('course_pdfs')
        .insert(coursePDFs);

      if (pdfError) throw pdfError;

      // Close modal and refresh
      setNewCourseModalOpen(false);
      setNewCourseData({
        title: '',
        description: '',
        selectedPDFs: []
      });
      loadUserCourses();

      // Show success message
      setSuccessMessage({ type: 'success', text: `✅ Course "${courseData.title}" created.` });
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course: ' + error.message);
    }
  };

  const confirmDelete = async () => {
    if (!pdfToDelete) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pdfs')
        .remove([pdfToDelete.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('pdfs')
        .delete()
        .eq('id', pdfToDelete.id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      // Close modal and refresh
      setDeleteModalOpen(false);
      const deletedFileName = pdfToDelete.file_name;
      setPdfToDelete(null);
      loadUserPDFs();
      
      // Show success message
      setSuccessMessage({ 
        type: 'success', 
        text: `✅ PDF "${deletedFileName}" deleted.` 
      });
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error deleting PDF:', error);
      setSuccessMessage({ 
        type: 'error', 
        text: 'Failed to delete PDF: ' + error.message 
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          university: profileData.university
        }
      });

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to update profile' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile image upload
  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setSaveMessage({ type: 'error', text: 'Please select a valid image file.' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Maximum image size is 5MB.' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setProfileImageUploading(true);
    setSaveMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (publicUrl) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            avatar_url: publicUrl
          }
        });

        if (updateError) throw updateError;

        setProfileImagePreview(publicUrl);
        setSaveMessage({ type: 'success', text: 'Profile photo updated!' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile photo.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setProfileImageUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Mock data
  // Calculate user statistics
  const sharedPDFsCount = userPDFs.filter(pdf => pdf.privacy === 'public').length;
  const completedPDFsCount = userPDFs.filter(pdf => pdf.status === 'completed').length;
  const learningPoints = (quizzes.length * 35) + (completedPDFsCount * 10);

  const stats = [
    { 
      icon: FileText, 
      label: t('home_stat_total_pdfs_label'), 
      value: userPDFs.length.toString(), 
      change: t('home_stat_total_pdfs_change', { count: completedPDFsCount }),
      color: 'from-blue-500 to-blue-600'
    },
    { 
      icon: Brain, 
      label: t('home_stat_quizzes_label'), 
      value: quizzes.length.toString(), 
      change: t('home_stat_quizzes_change', { count: quizzes.length }),
      color: 'from-purple-500 to-purple-600'
    },
    { 
      icon: Users, 
      label: t('home_stat_shared_label'), 
      value: sharedPDFsCount.toString(), 
      change: t('home_stat_shared_change', { count: sharedPDFsCount }),
      color: 'from-green-500 to-green-600'
    },
    { 
      icon: TrendingUp, 
      label: t('home_stat_points_label'), 
      value: learningPoints.toString(), 
      change: t('home_stat_points_change'),
      color: 'from-orange-500 to-orange-600'
    },
  ];

  const recentPDFs = [
    {
      id: 1,
      name: 'Machine Learning Fundamentals.pdf',
      date: '2 hours ago',
      pages: 45,
      progress: 65,
      status: 'processing'
    },
    {
      id: 2,
      name: 'Data Structures and Algorithms.pdf',
      date: 'Yesterday',
      pages: 120,
      progress: 100,
      status: 'completed'
    },
    {
      id: 3,
      name: 'Web Development Guide.pdf',
      date: '3 days ago',
      pages: 89,
      progress: 100,
      status: 'completed'
    },
  ];

  // Courses are now loaded from state via loadUserCourses()
  // Quizzes are now loaded from state via loadUserQuizzes()

  // Public PDFs are now loaded from state via loadPublicPDFs()

  const navItems = [
    { id: 'home', icon: Home, label: t('nav_home') },
    { id: 'pdfs', icon: FileText, label: t('nav_my_pdfs') },
    { id: 'courses', icon: BookOpen, label: t('nav_my_courses') },
    { id: 'quizzes', icon: Brain, label: t('nav_my_quizzes') },
    { id: 'flashcards', icon: Layers, label: t('nav_flashcards') },
    { id: 'exams', icon: GraduationCap, label: t('nav_exam_simulator') },
    { id: 'shared', icon: Share2, label: t('nav_shared_content') },
    { id: 'community', icon: MessageCircle, label: t('nav_community') },
    { id: 'settings', icon: Settings, label: t('nav_settings') },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setUploadFile(file);
        setUploadModalOpen(true);
      } else {
        alert('Lütfen bir PDF dosyası seçin!');
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setUploadFile(file);
        setUploadModalOpen(true);
      } else {
        alert('Lütfen bir PDF dosyası seçin!');
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadData.university || !uploadData.grade || !uploadData.courseName) {
      alert('Please fill all required fields!');
      return;
    }

    // Debug: Check user info
    console.log('🔍 User Info:', {
      userId: user?.id,
      email: user?.email,
      fullUser: user
    });

    if (!user?.id) {
      alert('Error: User not authenticated. Please login again.');
      return;
    }

    setUploadProgress(10);

    try {
      // Generate unique file name
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('📁 File path:', filePath);

      setUploadProgress(30);

      // Upload to Supabase Storage
      console.log('📤 Starting storage upload...');
      const { data: uploadData_storage, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }
      console.log('✅ Storage upload success:', uploadData_storage);

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath);

      setUploadProgress(80);

      // Save metadata to database
      const insertData = {
        user_id: user.id,
        file_name: uploadFile.name,
        file_path: filePath,
        file_size: uploadFile.size,
        university: uploadData.university,
        grade: uploadData.grade,
        course_name: uploadData.courseName,
        privacy: uploadData.privacy,
        status: 'processing'
      };

      console.log('💾 Inserting to database:', insertData);

      const { data: pdfData, error: dbError } = await supabase
        .from('pdfs')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        throw dbError;
      }
      console.log('✅ Database insert success:', pdfData);

      setUploadProgress(100);

      // Success! Close modal and reset
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadFile(null);
        setUploadProgress(0);
        setUploadData({
          university: '',
          grade: '',
          courseName: '',
          privacy: 'private'
        });
        // Refresh PDF list
        loadUserPDFs();
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
      setUploadProgress(0);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-100 dark:bg-black flex">
      {/* Sidebar - fixed height so Logout stays at bottom of viewport */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0, width: sidebarCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3 }}
        className={`fixed lg:static inset-y-0 left-0 z-50 h-screen flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-gray-200 dark:border-zinc-800`}>
            {!sidebarCollapsed && (
              <span className="text-2xl font-bold text-gray-900 dark:text-white">StudyPDF</span>
            )}
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setSidebarCollapsed(!sidebarCollapsed);
                } else {
                  setSidebarOpen(false);
                }
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {window.innerWidth >= 1024 ? (
                sidebarCollapsed ? (
                  <ChevronRight className="w-6 h-6" />
                ) : (
                  <ChevronLeft className="w-6 h-6" />
                )
              ) : (
                <X className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center' : 'space-x-3'
                  } px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-500 text-white dark:bg-white dark:text-black'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center' : 'space-x-3'
              } px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors`}
              title={sidebarCollapsed ? t('nav_logout') : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">{t('nav_logout')}</span>
              )}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content - only this area scrolls */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-zinc-800 rounded-lg px-4 py-2 w-96">
                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  className="bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language toggle */}
              <div className="flex items-center rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1.5 font-medium ${
                    language === 'en'
                      ? 'bg-blue-500 text-white'
                      : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('tr')}
                  className={`px-2.5 py-1.5 font-medium border-l border-gray-200 dark:border-zinc-700 ${
                    language === 'tr'
                      ? 'bg-blue-500 text-white'
                      : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  TR
                </button>
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => {
                  console.log('Home button clicked');
                  navigate('/');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Home Page</span>
              </button>
              
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {user?.user_metadata?.first_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.user_metadata?.first_name || 'Kullanıcı'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gradient-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
          {activeSection === 'home' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-500 dark:text-purple-400 mb-2">
                    Dashboard
                  </p>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {t('home_welcome', { name: user?.user_metadata?.first_name || 'User' })}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('home_subtitle')}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 text-zinc-200 border border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    StudyPDF • Beta
                  </span>
                </div>
              </div>

              {/* Stats + Upload row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:col-span-2">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="relative overflow-hidden bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-purple-500/60 transition-all shadow-sm dark:shadow-none"
                      >
                        <div
                          className={`absolute inset-x-0 -top-10 h-24 bg-gradient-to-r ${stat.color} opacity-20 blur-2xl pointer-events-none`}
                        />
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`w-11 h-11 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg shadow-black/40`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                          <p className="text-sm text-gray-500 dark:text-zinc-300">{stat.label}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* PDF Upload Area */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900/80 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-sm dark:shadow-none min-h-[210px]"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {t('home_upload_title')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                      {t('home_upload_subtitle')}
                    </p>
                    <label className="px-4 py-2.5 bg-gray-100 text-gray-900 dark:bg-white dark:text-gray-900 rounded-lg font-semibold border border-gray-300 dark:border-transparent hover:bg-gray-200 dark:hover:bg-zinc-100 cursor-pointer inline-flex items-center gap-2 text-sm">
                      {t('home_upload_button')}
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
                    {t('home_upload_hint')}
                  </p>
                </motion.div>
              </div>

              {/* Recent PDFs */}
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('home_recent_uploads')}
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {userPDFs.length > 0 ? userPDFs.slice(0, 3).map((pdf) => (
                    <motion.div
                      key={pdf.id}
                      whileHover={{ y: -4 }}
                      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-gray-300 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                              {pdf.file_name}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {pdf.course_name} • {new Date(pdf.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Course Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {t('pdf_card_university')}
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {pdf.university}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {t('pdf_card_grade')}
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {pdf.grade}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {t('pdf_card_status')}
                          </span>
                          <button
                            onClick={() => handleStatusToggle(pdf.id, pdf.status)}
                            className={`font-medium px-3 py-1 rounded-full transition-all hover:opacity-80 ${
                              pdf.status === 'completed'
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            }`}
                          >
                            {pdf.status === 'processing'
                              ? t('pdf_card_status_in_progress')
                              : t('pdf_card_status_completed')}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/pdf/${pdf.id}`)}
                          className="flex-1 px-3 py-2 bg-gray-100 dark:bg-white text-gray-900 dark:text-black text-sm font-medium rounded-lg border-2 border-gray-300 dark:border-transparent hover:bg-gray-200 dark:hover:bg-gray-100 transition-colors"
                        >
                          {t('pdf_card_open')}
                        </button>
                        <button 
                          onClick={() => handleDownload(pdf)}
                          className="p-2 border-2 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-400 rounded-lg hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-3 text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-lg">No PDFs uploaded yet</p>
                      <p className="text-gray-500 text-sm mt-2">Upload your first PDF to get started!</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeSection === 'pdfs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('section_my_pdfs_title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('section_my_pdfs_subtitle')}
                  </p>
                </div>
                <button 
                  onClick={() => setUploadModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload PDF</span>
                </button>
              </div>

              {/* PDF Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total PDFs</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{userPDFs.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {userPDFs.filter(pdf => pdf.status === 'processing').length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                      <p className="text-2xl font-bold text-green-400">
                        {userPDFs.filter(pdf => pdf.status === 'completed').length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPDFs.length > 0 ? userPDFs.map((pdf) => (
                  <motion.div
                    key={pdf.id}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-purple-400/70 dark:hover:border-purple-500/70 transition-all shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/30">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="inline-flex items-center rounded-full bg-gray-50 dark:bg-zinc-800/80 px-3 py-1 mb-1 max-w-full">
                            <span className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                              {pdf.file_name}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {new Date(pdf.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* PDF Details */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('pdf_card_course')}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium truncate max-w-[55%] text-right">
                          {pdf.course_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('pdf_card_university')}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {pdf.university}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('pdf_card_grade')}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {pdf.grade}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('pdf_card_privacy')}
                        </span>
                        <span
                          className={`font-medium ${
                            pdf.privacy === 'public'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {pdf.privacy === 'public'
                            ? t('pdf_card_privacy_public')
                            : t('pdf_card_privacy_private')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('pdf_card_status')}
                        </span>
                        <button
                          onClick={() => handleStatusToggle(pdf.id, pdf.status)}
                          className={`font-medium px-2.5 py-0.5 rounded-full transition-all hover:opacity-80 text-[11px] ${
                            pdf.status === 'completed'
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          }`}
                        >
                          {pdf.status === 'processing'
                            ? t('pdf_card_status_in_progress')
                            : t('pdf_card_status_completed')}
                        </button>
                      </div>
                    </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => navigate(`/pdf/${pdf.id}`)}
                          className="flex-1 min-w-0 px-4 py-2 bg-gray-100 dark:bg-white text-gray-900 dark:text-black text-xs font-medium rounded-lg border-2 border-gray-300 dark:border-transparent hover:bg-gray-200 dark:hover:bg-gray-100 transition-colors"
                        >
                          {t('pdf_card_open')}
                        </button>
                        {pdf.status === 'completed' && (
                          <button
                            onClick={() => {
                              setCreateDeckPdfId(pdf.id);
                              setCreateDeckTitle(pdf.file_name.replace(/\.pdf$/i, ''));
                              setCreateDeckCardCount(12);
                              setCreateDeckModalOpen(true);
                            }}
                            className="px-3 py-2 border-2 border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors flex items-center gap-1.5"
                            title="Create flashcard deck from this PDF"
                          >
                            <Layers className="w-4 h-4" />
                            {t('pdf_card_cards')}
                          </button>
                        )}
                        <button 
                          onClick={() => handleDownload(pdf)}
                          className="p-2 border-2 border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 rounded-lg hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(pdf)}
                          className="p-2 border-2 border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 rounded-lg hover:text-red-500 dark:hover:text-red-400 hover:border-red-400 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                  </motion.div>
                )) : (
                  <div className="col-span-3 text-center py-16">
                    <FileText className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-xl mb-2">No PDFs uploaded yet</p>
                    <p className="text-gray-500 text-sm mb-6">Upload your first PDF to get started!</p>
                    <button 
                      onClick={() => setUploadModalOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center space-x-2"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'courses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('section_my_courses_title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('section_my_courses_subtitle')}
                  </p>
                </div>
                <button 
                  onClick={() => setNewCourseModalOpen(true)}
                  className="px-6 py-3 bg-gray-100 dark:bg-white text-gray-900 dark:text-black rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-100 transition-colors flex items-center space-x-2 border-2 border-gray-300 dark:border-transparent"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('courses_new_button')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courses.length > 0 ? courses.map((course) => {
                  const studyPlan = courseStudyPlans[course.id];
                  return (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-purple-400/70 dark:hover:border-purple-500/70 transition-all shadow-sm dark:shadow-none"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 max-w-full">
                          <span className="inline-block text-base font-semibold text-gray-900 dark:text-white truncate">
                            {course.title}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                            {(course.total_pdfs || 0)} PDF
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                            {(course.total_quizzes || 0)} Quiz
                          </span>
                        </div>
                        {course.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleFavorite(course.id)}
                        className={`p-2 rounded-full border border-transparent transition-colors ${
                          favoriteCourses.includes(course.id)
                            ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-500/10'
                            : 'text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                        title="Favorite"
                      >
                        <Star
                          className="w-4 h-4"
                          fill={favoriteCourses.includes(course.id) ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('courses_progress_label')}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-400 transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(course.created_at).toLocaleDateString()}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {studyPlan && (
                            <button
                              type="button"
                              onClick={() => setExamPlanPreviewCourse(course)}
                              className="px-2 py-1 rounded-full bg-purple-500/10 text-[11px] text-purple-500 dark:text-purple-300 border border-purple-500/40 hover:bg-purple-500/20 transition-colors"
                            >
                              Exam:{' '}
                              {new Date(studyPlan.examDate).toLocaleDateString(
                                language === 'tr' ? 'tr-TR' : 'en-US',
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedCourse(course)}
                            className="px-4 py-2 bg-gray-100 dark:bg-white text-gray-900 dark:text-black text-xs font-medium rounded-lg border-2 border-gray-300 dark:border-transparent hover:bg-gray-200 dark:hover:bg-gray-100 transition-colors"
                          >
                            {t('courses_continue_button')}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            const existingPlan = courseStudyPlans[course.id];
                            setExamPlanCourse(course);
                            if (existingPlan) {
                              setExamPlanDate(existingPlan.examDate);
                              const pdfIds = Array.from(
                                new Set(
                                  existingPlan.days.flatMap((d) =>
                                    d.items.map((it) => it.pdfId),
                                  ),
                                ),
                              );
                              setExamPlanSelectedPdfs(pdfIds);
                              const quizIds = Array.from(
                                new Set(
                                  existingPlan.days.flatMap((d) =>
                                    d.items
                                      .filter((it) => it.type === 'quiz' && it.quizId)
                                      .map((it) => it.quizId),
                                  ),
                                ),
                              );
                              setExamPlanSelectedQuizzes(quizIds);
                            } else {
                              const todayISO = new Date().toISOString().slice(0, 10);
                              setExamPlanDate(todayISO);
                              const allCoursePdfIds = (course.course_pdfs || []).map(
                                (cp) => cp.pdf_id,
                              );
                              setExamPlanSelectedPdfs(allCoursePdfIds);
                              const allCourseQuizIds = (course.course_quizzes || []).map(
                                (cq) => cq.quiz_id,
                              );
                              setExamPlanSelectedQuizzes(allCourseQuizIds);
                            }
                            setExamPlanModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          {studyPlan ? 'Edit exam plan' : 'Plan for exam'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}) : (
                  <div className="col-span-2 text-center py-16">
                    <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-xl mb-2">
                      {t('courses_empty_title')}
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                      {t('courses_empty_subtitle')}
                    </p>
                    <button 
                      onClick={() => setNewCourseModalOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{t('courses_empty_create_button')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'quizzes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('section_my_quizzes_title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('section_my_quizzes_subtitle')}
                  </p>
                </div>
                <button 
                  onClick={() => setNewQuizModalOpen(true)}
                  className="px-6 py-3 bg-gray-100 dark:bg-white text-gray-900 dark:text-black rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-100 transition-colors flex items-center space-x-2 border-2 border-gray-300 dark:border-transparent"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('quiz_new_button')}</span>
                </button>
              </div>

              {/* Global quiz analytics panel */}
              <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-none">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-transparent blur-3xl" />
                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {t('analytics_title')}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                      {t('analytics_subtitle')}
                    </p>
                  </div>

                  {quizAttempts.length === 0 ? (
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {t('analytics_no_attempts_title')}
                        </p>
                        <p className="text-xs mt-1">
                          {t('analytics_no_attempts_subtitle')}
                        </p>
                      </div>
                    </div>
                  ) : (
                      <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Summary chips */}
                      <div className="flex flex-wrap gap-3">
                        {(() => {
                          const totalAttempts = quizAttempts.length;
                          const toPct = (a) =>
                            Number(a.percentage) ||
                            (a.total_points
                              ? Math.round((a.score / a.total_points) * 100)
                              : 0);
                          const bestAttempt = quizAttempts.reduce((best, curr) =>
                            !best || toPct(curr) > toPct(best) ? curr : best,
                          null);
                          const lastAttempt = quizAttempts[quizAttempts.length - 1];
                          const bestPct = bestAttempt ? toPct(bestAttempt) : 0;
                          const lastPct = lastAttempt ? toPct(lastAttempt) : 0;
                          const avgPct =
                            totalAttempts > 0
                              ? Math.round(
                                  quizAttempts.reduce((sum, a) => sum + toPct(a), 0) /
                                    totalAttempts,
                                )
                              : 0;

                          return (
                            <>
                              <div className="px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/40 text-xs text-purple-500 dark:text-purple-300">
                                <p className="font-semibold mb-0.5">
                                  {t('analytics_best_score_label')}
                                </p>
                                <p className="text-[11px]">
                                  {bestPct}% ({bestAttempt.score}/{bestAttempt.total_points})
                                </p>
                              </div>
                              <div className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/40 text-xs text-indigo-600 dark:text-indigo-300">
                                <p className="font-semibold mb-0.5">
                                  Avg score
                                </p>
                                <p className="text-[11px]">
                                  {avgPct}%
                                </p>
                              </div>
                              <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/40 text-xs text-blue-600 dark:text-blue-300">
                                <p className="font-semibold mb-0.5">
                                  {t('analytics_attempts_label', { count: totalAttempts })}
                                </p>
                                <p className="text-[11px]">
                                  {new Date(lastAttempt.created_at).toLocaleDateString(
                                    language === 'tr' ? 'tr-TR' : 'en-US',
                                  )}
                                </p>
                              </div>
                              <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-600 dark:text-emerald-300">
                                <p className="font-semibold mb-0.5">
                                  {t('analytics_last_attempt_label')}
                                </p>
                                <p className="text-[11px]">
                                  {lastPct}% ({lastAttempt.score}/{lastAttempt.total_points})
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Difficulty distribution mini chart */}
                      <div className="flex-1">
                        {(() => {
                          const toPct = (a) =>
                            Number(a.percentage) ||
                            (a.total_points
                              ? Math.round((a.score / a.total_points) * 100)
                              : 0);
                          const levels = [
                            { key: 'easy', label: 'Easy', color: 'bg-emerald-500' },
                            { key: 'medium', label: 'Medium', color: 'bg-amber-500' },
                            { key: 'hard', label: 'Hard', color: 'bg-rose-500' },
                          ];

                          const counts = levels.map((level) => ({
                            level,
                            attempts: quizAttempts.filter(
                              (a) => a.quiz?.difficulty === level.key,
                            ),
                          }));

                          const totalCount = counts.reduce(
                            (sum, item) => sum + item.attempts.length,
                            0,
                          );

                          if (totalCount === 0) {
                            return null;
                          }

                          return (
                            <>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 text-right">
                                Difficulty performance
                              </p>
                              <div className="h-3 rounded-full bg-zinc-800/80 overflow-hidden flex">
                                {counts.map(({ level, attempts }) => {
                                  const width =
                                    totalCount === 0
                                      ? 0
                                      : (attempts.length / totalCount) * 100;
                                  if (width === 0) return null;
                                  const avg =
                                    attempts.length > 0
                                      ? Math.round(
                                          attempts.reduce(
                                            (sum, a) => sum + toPct(a),
                                            0,
                                          ) / attempts.length,
                                        )
                                      : 0;
                                  return (
                                    <div
                                      key={level.key}
                                      className={`${level.color} relative`}
                                      style={{ width: `${width}%` }}
                                      title={`${level.label}: ${avg}% avg`}
                                    />
                                  );
                                })}
                              </div>
                              <div className="mt-2 flex items-center justify-end gap-3">
                                {counts.map(({ level, attempts }) => {
                                  if (attempts.length === 0) return null;
                                  const avg =
                                    attempts.length > 0
                                      ? Math.round(
                                          attempts.reduce(
                                            (sum, a) => sum + toPct(a),
                                            0,
                                          ) / attempts.length,
                                        )
                                      : 0;
                                  return (
                                    <div
                                      key={level.key}
                                      className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500"
                                    >
                                      <span
                                        className={`${level.color} inline-block w-2 h-2 rounded-full`}
                                      />
                                      <span>{level.label}</span>
                                      <span className="opacity-80">{avg}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Creating Quiz Indicator */}
                {creatingQuiz && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 border-2 border-purple-500/50 rounded-xl p-6"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Creating Quiz...</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">AI is generating questions from your PDF. This may take 20-40 seconds.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Quiz List */}
                {quizzes.length > 0 ? quizzes.map((quiz) => {
                  const attemptsForQuiz = quizAttempts
                    .filter((a) => a.quiz_id === quiz.id)
                    .sort(
                      (a, b) =>
                        new Date(a.created_at) - new Date(b.created_at),
                    );

                  return (
                  <motion.div
                    key={quiz.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-purple-400/70 dark:hover:border-purple-500/70 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/30">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center space-x-2 truncate">
                            <span className="truncate">{quiz.title}</span>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                                quiz.privacy === 'public'
                                  ? 'bg-blue-500/15 text-blue-500 dark:text-blue-400'
                                  : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {quiz.privacy === 'public' ? 'Public' : 'Private'}
                            </span>
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>
                              {t('quiz_questions_label', { count: quiz.total_questions })}
                            </span>
                            {lastScoreByQuizId[quiz.id] && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[11px] font-medium border border-emerald-500/30">
                                  {t('quiz_score_label', {
                                    score: lastScoreByQuizId[quiz.id].score,
                                    total: lastScoreByQuizId[quiz.id].total_points,
                                  })}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className={`capitalize px-2 py-0.5 rounded-full text-[11px] ${
                              quiz.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                              quiz.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {quiz.difficulty}
                            </span>
                            {quiz.time_limit != null && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                                  {t('quiz_time_limit_badge', { minutes: quiz.time_limit })}
                                </span>
                              </>
                            )}
                            {quiz.pdf && (
                              <>
                                <span>•</span>
                                <span className="text-blue-400">{quiz.pdf.file_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quiz/${quiz.id}`);
                          }}
                          className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                        >
                        {t('quiz_start_button')}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/flashcards/quiz/${quiz.id}`);
                          }}
                          className="px-4 py-2 border-2 border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                          title="Study as flashcards"
                        >
                          <Layers className="w-4 h-4" />
                          {t('quiz_study_cards_button')}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz);
                          }}
                          className="p-2 border-2 border-gray-300 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Delete quiz"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Attempt history */}
                    {attemptsForQuiz.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                        <div className="flex flex-wrap gap-1.5">
                          {attemptsForQuiz
                            .slice(-3)
                            .reverse()
                            .map((attempt, idx) => {
                              const displayIndex =
                                attemptsForQuiz.length - idx;
                              const pct =
                                Number(attempt.percentage) ||
                                (attempt.total_points
                                  ? Math.round(
                                      (attempt.score /
                                        attempt.total_points) *
                                        100,
                                    )
                                  : 0);
                              return (
                                <div
                                  key={attempt.id}
                                  className="px-2.5 py-1 rounded-full bg-purple-500/10 text-[11px] text-purple-500 dark:text-purple-300 border border-purple-500/30"
                                >
                                  <span className="font-medium">
                                    {t('quiz_attempt_chip_label', { index: displayIndex })}
                                  </span>
                                  <span className="opacity-75">
                                    {' '}
                                    • {pct}% ({attempt.score}/
                                    {attempt.total_points})
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}) : !creatingQuiz && (
                  <div className="text-center py-16">
                    <Brain className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-xl mb-2">No quizzes yet</p>
                    <p className="text-gray-500 text-sm mb-6">Create your first quiz from your uploaded PDFs!</p>
                    <button 
                      onClick={() => setNewQuizModalOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Quiz</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'flashcards' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('flashcards_title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('flashcards_subtitle')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCreateDeckPdfId('');
                    setCreateDeckTitle('');
                    setCreateDeckCardCount(12);
                    setCreateDeckModalOpen(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Layers className="w-5 h-5" />
                  {t('flashcards_create_from_pdf_button')}
                </button>
              </div>

              {/* From PDFs */}
              {(pdfDecks.length > 0) && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {t('flashcards_from_pdfs_title')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pdfDecks.map((deck) => (
                      <motion.div
                        key={deck.id}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-purple-400/70 dark:hover:border-purple-500/70 transition-all shadow-sm dark:shadow-none group"
                      >
                        {/* Delete deck button */}
                        <button
                          onClick={(e) => handleDeleteDeck(deck, e)}
                          className="absolute top-3 right-3 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete this deck"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                              {deck.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t('flashcards_pdf_deck_badge')}
                            </p>
                            <button
                              onClick={() => navigate(`/flashcards/deck/${deck.id}`)}
                              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                            >
                              {t('flashcards_study_deck_button')}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* From Quizzes */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {t('flashcards_from_quizzes_title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                      <motion.div
                        key={quiz.id}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-purple-400/70 dark:hover:border-purple-500/70 transition-all group shadow-sm dark:shadow-none"
                      >
                        {/* Delete quiz deck button (removes quiz + its cards) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete this deck"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/30">
                            <Layers className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                              {quiz.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t('flashcards_quiz_cards_label', {
                                count: quiz.total_questions,
                              })}
                            </p>
                            <button
                              onClick={() => navigate(`/flashcards/quiz/${quiz.id}`)}
                              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                            >
                              {t('flashcards_study_deck_button')}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl">
                      <Brain className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {t('flashcards_no_quiz_decks_title')}
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        {t('flashcards_no_quiz_decks_subtitle')}
                      </p>
                      <button
                        onClick={() => setActiveSection('quizzes')}
                        className="px-4 py-2 text-purple-500 dark:text-purple-400 font-medium hover:underline"
                      >
                        {t('flashcards_go_to_my_quizzes_button')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'exams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('section_exam_simulator_title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('section_exam_simulator_subtitle')}
                  </p>
                </div>
              </div>

              {/* Generator card (collapsible) */}
              <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-zinc-700 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExamFormOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  aria-expanded={examFormOpen}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {t('exam_new_title')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {!examFormOpen && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                        {t('exam_open_form_hint')}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        examFormOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                {examFormOpen && (
                <div className="px-6 pb-6 pt-4 space-y-6 border-t border-gray-200 dark:border-zinc-800">

                {/* Title & duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      {t('exam_field_title')}
                    </label>
                    <input
                      type="text"
                      value={examForm.title}
                      onChange={(e) => setExamForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder={t('exam_field_title_placeholder')}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      {t('exam_field_duration')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={600}
                      value={examForm.durationMinutes ?? ''}
                      onChange={(e) =>
                        setExamForm((p) => ({
                          ...p,
                          durationMinutes: e.target.value === '' ? null : Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* PDF multi-select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t('exam_field_pdfs')}{' '}
                    <span className="text-gray-500">
                      ({examForm.pdfIds.length} {t('exam_selected')})
                    </span>
                  </label>
                  {userPDFs.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('exam_no_pdfs')}
                    </p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-zinc-700 rounded-lg divide-y divide-gray-200 dark:divide-zinc-800">
                      {userPDFs.map((p) => {
                        const checked = examForm.pdfIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer ${
                              checked
                                ? 'bg-purple-50 dark:bg-purple-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleExamPdf(p.id)}
                              className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                            />
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="flex-1 text-gray-900 dark:text-white truncate">
                              {p.file_name}
                            </span>
                            {p.course_name && (
                              <span className="text-[11px] text-gray-500">
                                {p.course_name}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sections */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {t('exam_field_sections')}
                    </label>
                    <button
                      type="button"
                      onClick={addExamSection}
                      className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('exam_add_section')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {examForm.sections.map((section, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 p-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) => updateExamSection(idx, { name: e.target.value })}
                            className="md:col-span-2 px-2 py-1.5 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white"
                            placeholder={t('exam_section_name')}
                          />
                          <select
                            value={section.type}
                            onChange={(e) => updateExamSection(idx, { type: e.target.value })}
                            className="px-2 py-1.5 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white"
                          >
                            <option value="mcq">{t('exam_type_mcq')}</option>
                            <option value="open">{t('exam_type_open')}</option>
                            <option value="cloze">{t('exam_type_cloze')}</option>
                            <option value="true_false">{t('exam_type_tf')}</option>
                            <option value="short">{t('exam_type_short')}</option>
                          </select>
                          <select
                            value={section.difficulty}
                            onChange={(e) => updateExamSection(idx, { difficulty: e.target.value })}
                            className="px-2 py-1.5 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white"
                          >
                            <option value="easy">{t('exam_difficulty_easy')}</option>
                            <option value="medium">{t('exam_difficulty_medium')}</option>
                            <option value="hard">{t('exam_difficulty_hard')}</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-500 uppercase">#</span>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={section.count}
                              onChange={(e) =>
                                updateExamSection(idx, { count: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1.5 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-500 uppercase">pts</span>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={section.points_per_question}
                              onChange={(e) =>
                                updateExamSection(idx, {
                                  points_per_question: Number(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => removeExamSection(idx)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              aria-label="Remove section"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals & action */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-zinc-800">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('exam_summary_total')}:{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {totalExamQuestions}
                    </span>{' '}
                    {t('exam_summary_questions')} ·{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {totalExamPoints}
                    </span>{' '}
                    {t('exam_summary_points')}
                    {examForm.durationMinutes ? ` · ${examForm.durationMinutes} ${t('exam_summary_minutes')}` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    {examError && (
                      <span className="text-xs text-red-500 dark:text-red-400">{examError}</span>
                    )}
                    <button
                      type="button"
                      disabled={generatingExam}
                      onClick={handleGenerateExam}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50"
                    >
                      {generatingExam ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          {t('exam_generating')}
                        </>
                      ) : (
                        <>
                          <FileCheck2 className="w-4 h-4" />
                          {t('exam_generate')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                </div>
                )}
              </div>

              {/* Existing exams list */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  {t('exam_history_title')}
                </h2>
                {loadingExams ? (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Loader className="w-4 h-4 animate-spin" />
                    {t('loading')}
                  </div>
                ) : exams.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('exam_history_empty')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="group relative bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700 rounded-2xl p-5 hover:border-purple-500 transition-colors cursor-pointer"
                        onClick={() => navigate(`/exam/${exam.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExamToDelete(exam);
                              setDeleteExamModalOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                          {exam.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span className="flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5" />
                            {exam.total_points} pts
                          </span>
                          {exam.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5" />
                              {exam.duration_minutes} dk
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {Array.isArray(exam.pdf_ids) ? exam.pdf_ids.length : 0} PDF
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                          {new Date(exam.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'shared' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('section_shared_title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('section_shared_subtitle')}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="hidden md:flex bg-gray-200 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-full p-1">
                    {['pdfs', 'quizzes'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSharedView(type)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                          sharedView === type
                            ? 'bg-white dark:bg-white text-gray-900 dark:text-black shadow border border-gray-300 dark:border-transparent'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {type === 'pdfs' ? t('shared_tab_pdfs') : t('shared_tab_quizzes')}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={refreshPublicPDFs}
                    disabled={refreshingPublic}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover.opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50"
                  >
                    {refreshingPublic ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{t('shared_refresh')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  {t('shared_filters_title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Course Name Filter */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t('shared_filters_course_label')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('shared_filters_course_placeholder')}
                      value={sharedFilters.courseName}
                      onChange={(e) => setSharedFilters({ ...sharedFilters, courseName: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* University Filter */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t('shared_filters_university_label')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('shared_filters_university_placeholder')}
                      value={sharedFilters.university}
                      onChange={(e) => setSharedFilters({ ...sharedFilters, university: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Grade Filter */}
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-3">
                      {t('shared_filters_grade_label')}
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {['1', '2', '3', '4', "Master's", 'Doctorate'].map((grade) => (
                        <button
                          key={grade}
                          onClick={() => toggleGradeFilter(grade)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            sharedFilters.grades.includes(grade)
                              ? 'bg-blue-500 text-white border-2 border-blue-500'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-400 border-2 border-gray-300 dark:border-zinc-700 hover:border-blue-500 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          {grade === "Master's" || grade === 'Doctorate' ? grade : `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              {/* Sort + Clear */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t('shared_filters_sort_label')}
                  </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSharedSort('default')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          sharedSort === 'default'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:border-blue-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {t('shared_filters_sort_default')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSharedSort('most_votes')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          sharedSort === 'most_votes'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:border-blue-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {t('shared_filters_sort_most_votes')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSharedSort('highest_rating')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          sharedSort === 'highest_rating'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:border-blue-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {t('shared_filters_sort_highest_rating')}
                      </button>
                    </div>
                  </div>

                  {(sharedFilters.courseName || sharedFilters.university || sharedFilters.grades.length > 0) && (
                    <button
                      onClick={() => setSharedFilters({ courseName: '', university: '', grades: [] })}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {t('shared_filters_clear_all')}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PDFs list */}
                {sharedView === 'pdfs' && (getFilteredPublicPDFs().length > 0 ? getFilteredPublicPDFs().map((pdf) => {
                  const ratingStats = publicPdfRatings[pdf.id];
                  const userRating = userPdfRatings[pdf.id];
                  return (
                    <motion.div
                      key={pdf.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-purple-400/70 dark:hover:border-purple-500/70 transition-all shadow-sm dark:shadow-none"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/30">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                              {pdf.file_name}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <span className="text-purple-500 dark:text-purple-400 font-medium">
                                Public PDF
                              </span>
                            </p>
                            <div className="flex items-center space-x-2 text-xs flex-wrap gap-1">
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded">
                                {pdf.university}
                              </span>
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded">
                                Grade {pdf.grade}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded">
                                {pdf.course_name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-[11px] font-medium rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
                          PDF
                        </span>
                      </div>

                      {/* Rating + Actions */}
                      <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                          {/* Stars + average */}
                          <div className="flex items-center gap-2">
                            {/* Stars (user's vote) */}
                            <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleRatePdf(pdf.id, star)}
                                className="p-0.5"
                                title={user ? `Rate ${star} star${star > 1 ? 's' : ''}` : 'Login to rate'}
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    userRating && userRating >= star
                                      ? 'text-yellow-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>

                            {/* Average + votes */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              {ratingStats ? (
                                <>
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {ratingStats.avg.toFixed(1)}
                                  </span>
                                  <span className="h-3 w-px bg-gray-300 dark:bg-zinc-700" />
                                  <span>
                                    {t('shared_votes_label', {
                                      count: ratingStats.count,
                                      suffix: ratingStats.count === 1 ? '' : 's',
                                    })}
                                  </span>
                                </>
                              ) : (
                                <span>{t('shared_no_votes_yet')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(pdf.created_at).toLocaleDateString()}</span>
                          </div>
                          <button 
                            onClick={() => navigate(`/pdf/${pdf.id}`)}
                            className="px-4 py-2 bg-gray-100 dark:bg-white text-gray-900 dark:text-black text-sm font-medium rounded-lg border-2 border-gray-300 dark:border-transparent hover:bg-gray-200 dark:hover:bg-gray-100 transition-colors"
                          >
                            {t('shared_view_button')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="col-span-2 text-center py-16">
                    <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-xl mb-2">
                      {publicPDFs.length > 0
                        ? t('shared_filters_no_pdfs_match')
                        : t('shared_filters_no_public_pdfs')}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {publicPDFs.length > 0
                        ? t('shared_filters_try_adjusting')
                        : t('shared_filters_when_users_share')}
                    </p>
                  </div>
                ))}

                {/* Quizzes list */}
                {sharedView === 'quizzes' && (
                  applySharedSort(publicQuizzes, (quiz) => publicQuizRatings[quiz.id]).length > 0 ? (
                    applySharedSort(publicQuizzes, (quiz) => publicQuizRatings[quiz.id]).map((quiz) => {
                      const ratingStats = publicQuizRatings[quiz.id];
                      const userRating = userQuizRatings[quiz.id];

                      return (
                        <motion.div
                          key={quiz.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-gray-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Brain className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                  {quiz.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <span className="text-purple-500 dark:text-purple-400 font-medium">Public Quiz</span>
                                  {quiz.pdf && (
                                    <> • <span className="text-blue-600 dark:text-blue-400">{quiz.pdf.file_name}</span></>
                                  )}
                                </p>
                                <div className="flex items-center flex-wrap gap-2 text-xs">
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded">
                                    {quiz.total_questions} questions
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded capitalize ${
                                      quiz.difficulty === 'easy'
                                        ? 'bg-green-500/20 text-green-400'
                                        : quiz.difficulty === 'medium'
                                          ? 'bg-yellow-500/20 text-yellow-400'
                                          : 'bg-red-500/20 text-red-400'
                                    }`}
                                  >
                                    {quiz.difficulty}
                                  </span>
                                  {quiz.time_limit != null && (
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded">
                                      {t('quiz_time_limit_badge', { minutes: quiz.time_limit })}
                                    </span>
                                  )}
                                  {quiz.time_limit != null && (
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded">
                                      Time limit: {quiz.time_limit} min
                                    </span>
                                  )}
                                  {quiz.pdf?.university && (
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded">
                                      {quiz.pdf.university}
                                    </span>
                                  )}
                                  {quiz.pdf?.grade && (
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded">
                                      Grade {quiz.pdf.grade}
                                    </span>
                                  )}
                                  {quiz.pdf?.course_name && (
                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">
                                      {quiz.pdf.course_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 flex-shrink-0">
                              Quiz
                            </span>
                          </div>

                          <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between">
                              {/* Stars + average */}
                              <div className="flex items-center gap-2">
                                {/* Stars (user's vote) */}
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRateQuiz(quiz.id, star);
                                      }}
                                      className="p-0.5"
                                      title={user ? `Rate ${star} star${star > 1 ? 's' : ''}` : 'Login to rate'}
                                    >
                                      <Star
                                        className={`w-4 h-4 ${
                                          userRating && userRating >= star
                                            ? 'text-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                {/* Average + votes */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  {ratingStats ? (
                                    <>
                                      <span className="font-semibold text-gray-900 dark:text-white">
                                        {ratingStats.avg.toFixed(1)}
                                      </span>
                                      <span className="h-3 w-px bg-gray-300 dark:bg-zinc-700" />
                                      <span>
                                        {ratingStats.count} vote{ratingStats.count === 1 ? '' : 's'}
                                      </span>
                                    </>
                                  ) : (
                                    <span>No votes yet</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/quiz/${quiz.id}`);
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
                              >
                                Start Quiz
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-16">
                      <Brain className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-xl mb-2">
                        {publicQuizzes.length > 0 ? 'No quizzes match your filters' : 'No public quizzes yet'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {publicQuizzes.length > 0 ? 'Try adjusting your filters' : 'When users share quizzes publicly, they will appear here!'}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeSection === 'community' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('section_community_title')}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('section_community_subtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setCommunityPostModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span>{t('community_add_post')}</span>
                </button>
              </div>

              {/* Course Filter */}
              <div className="relative overflow-hidden bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-sm dark:shadow-none">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-transparent blur-3xl" />
                <div className="relative flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={communityFilterCourse}
                    onChange={(e) => {
                      setCommunityFilterCourse(e.target.value);
                    }}
                    placeholder={t('community_filter_placeholder')}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/80 focus:border-transparent"
                  />
                  {communityFilterCourse && (
                    <button
                      onClick={() => {
                        setCommunityFilterCourse('');
                        loadCommunityPosts();
                      }}
                      className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {t('community_clear_filter')}
                    </button>
                  )}
                </div>
              </div>

              {communityLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-10 h-10 border-2 border-purple-500/70 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : communityPosts.length === 0 ? (
                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm dark:shadow-none">
                  <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-r from-purple-500/15 via-blue-500/10 to-transparent blur-3xl" />
                  <div className="relative">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300 mb-2 text-lg font-medium">No posts yet</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xl mx-auto">
                      Be the first to share a photo: ask a question or open a topic, others can respond with comments.
                    </p>
                    <button
                      onClick={() => setCommunityPostModalOpen(true)}
                      className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Add Post
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communityPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-purple-500/60 transition-all shadow-sm dark:shadow-none group"
                      onClick={() => openCommunityPostDetail(post)}
                    >
                      {/* Delete button - only show for user's own posts */}
                      {user && post.user_id === user.id && (
                        <button
                          onClick={(e) => handleDeleteCommunityPost(post, e)}
                          className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="aspect-video bg-gray-200 dark:bg-zinc-800 relative">
                        <img
                          src={post.image_url}
                          alt={post.caption || 'Gönderi'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          {post.course_name && (
                            <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                              {post.course_name}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {new Date(post.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                          {post.caption || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {post.author_name || 'User'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('section_settings_title')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('section_settings_subtitle')}
                </p>
              </div>

              {/* Profile Settings - simplified & modernized */}
              <div className="relative overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200/60 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-lg shadow-black/20">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/30 via-blue-500/20 to-transparent blur-3xl" />
                <div className="relative">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Profile Information
                  </h2>
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-8 space-y-6 md:space-y-0">
                    <div className="flex flex-col items-center md:items-start space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-4 ring-white/10 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          {profileImagePreview ? (
                            <img
                              src={profileImagePreview}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-2xl">
                              {profileData.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => profileImageInputRef.current?.click()}
                          disabled={profileImageUploading}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {profileImageUploading ? 'Uploading...' : 'Change Photo'}
                        </button>
                        <input
                          ref={profileImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="flex-1 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-purple-500/80 dark:focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-purple-500/80 dark:focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/40 dark:focus:ring-purple-400/40 focus:border-transparent opacity-60"
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                            University
                          </label>
                          <input
                            type="text"
                            value={profileData.university}
                            onChange={(e) => setProfileData({ ...profileData, university: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-purple-500/80 dark:focus:ring-purple-400 focus:border-transparent"
                            placeholder="University name..."
                          />
                        </div>
                      </div>

                      {/* Success/Error Message */}
                      {saveMessage && (
                        <div
                          className={`p-3 rounded-xl text-sm ${
                            saveMessage.type === 'success'
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-500/70 text-green-700 dark:text-green-300'
                              : 'bg-red-50 dark:bg-red-900/20 border border-red-500/70 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {saveMessage.text}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PDF Upload Modal */}
      {uploadModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (uploadProgress === 0) {
              setUploadModalOpen(false);
              setUploadFile(null);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Upload PDF</h2>
              {uploadProgress === 0 && (
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadFile(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {uploadProgress === 0 ? (
              <div className="space-y-6">
                {/* File Upload Area */}
                {!uploadFile ? (
                  <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-zinc-600 transition-colors">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="pdf-upload-input"
                    />
                    <label
                      htmlFor="pdf-upload-input"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-white font-semibold mb-2">Click to upload PDF</p>
                      <p className="text-sm text-gray-400">or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-2">PDF files only</p>
                    </label>
                  </div>
                ) : (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{uploadFile.name}</p>
                        <p className="text-sm text-gray-400">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setUploadFile(null)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* University */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    University *
                  </label>
                  <input
                    type="text"
                    value={uploadData.university}
                    onChange={(e) => setUploadData({ ...uploadData, university: e.target.value })}
                    placeholder="e.g: Boğaziçi University"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Grade *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: '1', label: '1st Grade' },
                      { value: '2', label: '2nd Grade' },
                      { value: '3', label: '3rd Grade' },
                      { value: '4', label: '4th Grade' },
                      { value: 'yuksek-lisans', label: "Master's" },
                      { value: 'doktora', label: 'Doctorate' },
                    ].map((grade) => (
                      <button
                        key={grade.value}
                        type="button"
                        onClick={() => setUploadData({ ...uploadData, grade: grade.value })}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          uploadData.grade === grade.value
                            ? 'border-white bg-white/10 text-white'
                            : 'border-zinc-700 text-gray-400 hover:border-zinc-600 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{grade.label}</span>
                          {uploadData.grade === grade.value && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Course Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={uploadData.courseName}
                    onChange={(e) => setUploadData({ ...uploadData, courseName: e.target.value })}
                    placeholder="e.g: Machine Learning"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>

                {/* Privacy */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Sharing Settings *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setUploadData({ ...uploadData, privacy: 'private' })}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        uploadData.privacy === 'private'
                          ? 'border-white bg-white/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          uploadData.privacy === 'private'
                            ? 'bg-white text-black'
                            : 'bg-zinc-800 text-gray-400'
                        }`}>
                          <Lock className="w-6 h-6" />
                        </div>
                        <p className={`font-medium ${
                          uploadData.privacy === 'private' ? 'text-white' : 'text-gray-400'
                        }`}>
                          Private
                        </p>
                        <p className="text-xs text-gray-400 text-center">
                          Only you can see
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setUploadData({ ...uploadData, privacy: 'public' })}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        uploadData.privacy === 'public'
                          ? 'border-white bg-white/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          uploadData.privacy === 'public'
                            ? 'bg-white text-black'
                            : 'bg-zinc-800 text-gray-400'
                        }`}>
                          <Users className="w-6 h-6" />
                        </div>
                        <p className={`font-medium ${
                          uploadData.privacy === 'public' ? 'text-white' : 'text-gray-400'
                        }`}>
                          Public
                        </p>
                        <p className="text-xs text-gray-400 text-center">
                          Everyone can see
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleUploadSubmit}
                  className="w-full py-4 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload & Process</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upload Progress */}
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white mb-2">Uploading PDF...</p>
                    <p className="text-gray-400">Please wait, processing your file</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Uploading PDF...</span>
                    <span className="text-white font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  </div>
                </div>

                {/* Upload Details */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">File:</span>
                    <span className="text-white font-medium">{uploadFile?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">University:</span>
                    <span className="text-white">{uploadData.university}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Grade:</span>
                    <span className="text-white">{uploadData.grade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Course:</span>
                    <span className="text-white">{uploadData.courseName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Privacy:</span>
                    <span className="text-white">
                      {uploadData.privacy === 'private' ? 'Private' : 'Public'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* New Course Modal */}
      {newCourseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-3xl w-full my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {t('courses_modal_title')}
              </h2>
              <button
                onClick={() => {
                  setNewCourseModalOpen(false);
                  setNewCourseData({ title: '', description: '', selectedPDFs: [] });
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Course Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('courses_modal_title_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('courses_modal_title_placeholder')}
                  value={newCourseData.title}
                  onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Course Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Brief description of this course..."
                  value={newCourseData.description}
                  onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Select PDFs */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select PDFs * ({newCourseData.selectedPDFs.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  {userPDFs.length > 0 ? userPDFs.map((pdf) => (
                    <label
                      key={pdf.id}
                      className="flex items-center space-x-3 p-3 bg-zinc-800 hover:bg-zinc-750 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={newCourseData.selectedPDFs.includes(pdf.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCourseData({
                              ...newCourseData,
                              selectedPDFs: [...newCourseData.selectedPDFs, pdf.id]
                            });
                          } else {
                            setNewCourseData({
                              ...newCourseData,
                              selectedPDFs: newCourseData.selectedPDFs.filter(id => id !== pdf.id)
                            });
                          }
                        }}
                        className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{pdf.file_name}</p>
                        <p className="text-xs text-gray-400">{pdf.course_name} • {pdf.university}</p>
                      </div>
                    </label>
                  )) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No PDFs available. Upload some PDFs first!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setNewCourseModalOpen(false);
                    setNewCourseData({ title: '', description: '', selectedPDFs: [] });
                  }}
                  className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Create Course
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => {
            setSelectedCourse(null);
            setAddCoursePdfsSelection([]);
            setAddCourseQuizzesSelection([]);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-4xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedCourse.title}</h2>
                {selectedCourse.description && (
                  <p className="text-gray-400">{selectedCourse.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteCourse(selectedCourse)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Delete Course"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setAddCoursePdfsSelection([]);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">PDFs</span>
                </div>
                <p className="text-2xl font-bold text-white">{selectedCourse.total_pdfs || 0}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Quizzes</span>
                </div>
                <p className="text-2xl font-bold text-white">{selectedCourse.total_quizzes || 0}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Progress</span>
                </div>
                <p className="text-2xl font-bold text-white">{selectedCourse.progress}%</p>
              </div>
            </div>

            {/* PDFs List */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Course PDFs</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedCourse.course_pdfs && selectedCourse.course_pdfs.length > 0 ? (
                  selectedCourse.course_pdfs.map((item, index) => (
                    <motion.div
                      key={item.pdf_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-zinc-600 transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{item.pdfs?.file_name}</h4>
                          <p className="text-xs text-gray-400">
                            {item.pdfs?.university} • {item.pdfs?.course_name}
                          </p>
                        </div>
                        
                        {/* Completed Checkbox */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePDFCompletion(item.id, selectedCourse.id, item.completed || false);
                          }}
                          className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                            item.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-zinc-600 hover:border-green-400 hover:bg-zinc-800'
                          }`}
                          title={item.completed ? 'Completed - Click to undo' : 'Mark as Complete'}
                        >
                          {item.completed && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        <button
                          onClick={() => navigate(`/pdf/${item.pdf_id}`)}
                          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Open
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No PDFs in this course</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Quizzes */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-white mb-3">Course quizzes</h3>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {(() => {
                  const related = selectedCourse.course_quizzes || [];
                  if (!related.length) {
                    return (
                      <p className="text-sm text-gray-500">
                        No quizzes in this course yet.
                      </p>
                    );
                  }
                  return related
                    .map((row) => row.quizzes)
                    .filter(Boolean)
                    .map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-3 flex-shrink-0">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {quiz.title}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {quiz.total_questions} questions • {quiz.difficulty}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                          className="px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Start
                        </button>
                      </div>
                    ));
                })()}
              </div>
            </div>

            {/* Add more quizzes to course */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-white mb-3">Add quizzes from My Quizzes</h3>
              <p className="text-sm text-gray-400 mb-3">
                Select additional quizzes to include in this course. Existing ones are hidden.
              </p>
              <div className="max-h-72 overflow-y-auto space-y-2 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                {(() => {
                  const existingQuizIds = new Set(
                    (selectedCourse.course_quizzes || []).map((cq) => cq.quiz_id),
                  );
                  const availableQuizzes = quizzes.filter(
                    (quiz) => !existingQuizIds.has(quiz.id),
                  );

                  if (!availableQuizzes.length) {
                    return (
                      <p className="text-sm text-gray-500 text-center">
                        All of your quizzes are already in this course.
                      </p>
                    );
                  }

                  return availableQuizzes.map((quiz) => (
                    <label
                      key={quiz.id}
                      className="flex items-center space-x-3 p-3 bg-zinc-800 hover:bg-zinc-750 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={addCourseQuizzesSelection.includes(quiz.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAddCourseQuizzesSelection((prev) => [...prev, quiz.id]);
                          } else {
                            setAddCourseQuizzesSelection((prev) =>
                              prev.filter((id) => id !== quiz.id),
                            );
                          }
                        }}
                        className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-purple-500 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm truncate">
                          {quiz.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {quiz.total_questions} questions • {quiz.difficulty}
                        </p>
                      </div>
                    </label>
                  ));
                })()}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setAddCourseQuizzesSelection([])}
                  className="px-4 py-2 bg-zinc-800 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleAddQuizzesToCourse}
                  disabled={!addCourseQuizzesSelection.length}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add selected quizzes
                </button>
              </div>
            </div>

            {/* Add more PDFs to course */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-white mb-3">Add PDFs from My PDFs</h3>
              <p className="text-sm text-gray-400 mb-3">
                Select additional PDFs to include in this course. Existing ones are hidden.
              </p>
              <div className="max-h-72 overflow-y-auto space-y-2 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                {(() => {
                  const existingIds = new Set(
                    (selectedCourse.course_pdfs || []).map((cp) => cp.pdf_id),
                  );
                  const available = userPDFs.filter((pdf) => !existingIds.has(pdf.id));

                  if (!available.length) {
                    return (
                      <p className="text-sm text-gray-500 text-center">
                        All of your PDFs are already in this course.
                      </p>
                    );
                  }

                  return available.map((pdf) => (
                    <label
                      key={pdf.id}
                      className="flex items-center space-x-3 p-3 bg-zinc-800 hover:bg-zinc-750 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={addCoursePdfsSelection.includes(pdf.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAddCoursePdfsSelection((prev) => [...prev, pdf.id]);
                          } else {
                            setAddCoursePdfsSelection((prev) =>
                              prev.filter((id) => id !== pdf.id),
                            );
                          }
                        }}
                        className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm truncate">
                          {pdf.file_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {pdf.university} • {pdf.course_name}
                        </p>
                      </div>
                    </label>
                  ));
                })()}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setAddCoursePdfsSelection([])}
                  className="px-4 py-2 bg-zinc-800 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleAddPdfsToCourse}
                  disabled={!addCoursePdfsSelection.length}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add selected PDFs
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Quiz Modal */}
      {newQuizModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-2xl w-full my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {t('quiz_modal_title')}
              </h2>
              <button
                onClick={() => {
                  setNewQuizModalOpen(false);
                  setNewQuizData({
                    pdfId: '',
                    title: '',
                    questionCount: 10,
                    difficulty: 'medium',
                    privacy: 'private',
                    timeLimitMinutes: null
                  });
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Select PDF */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select PDF *
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  {userPDFs.length > 0 ? userPDFs.map((pdf) => (
                    <button
                      key={pdf.id}
                      onClick={() => setNewQuizData({ ...newQuizData, pdfId: pdf.id })}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        newQuizData.pdfId === pdf.id
                          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500'
                          : 'bg-zinc-800 hover:bg-zinc-750 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          newQuizData.pdfId === pdf.id
                            ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                            : 'bg-zinc-700'
                        }`}>
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{pdf.file_name}</p>
                          <p className="text-xs text-gray-400 truncate">{pdf.course_name} • {pdf.university}</p>
                        </div>
                        {newQuizData.pdfId === pdf.id && (
                          <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  )) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No PDFs available. Upload some PDFs first!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Chapter 1 Quiz, Final Exam..."
                  value={newQuizData.title}
                  onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Number of Questions
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setNewQuizData({ ...newQuizData, questionCount: count })}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        newQuizData.questionCount === count
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setNewQuizData({ ...newQuizData, difficulty: level })}
                      className={`px-4 py-3 rounded-xl font-medium capitalize transition-all ${
                        newQuizData.difficulty === level
                          ? level === 'easy'
                            ? 'bg-green-500 text-white'
                            : level === 'medium'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {t('quiz_time_limit_label')}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      onClick={() =>
                        setNewQuizData((prev) => ({
                          ...prev,
                          timeLimitMinutes: prev.timeLimitMinutes === mins ? null : mins
                        }))
                      }
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        newQuizData.timeLimitMinutes === mins
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      {t('quiz_time_limit_minutes_short', { minutes: mins })}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {newQuizData.timeLimitMinutes
                    ? t('quiz_time_limit_selected', { minutes: newQuizData.timeLimitMinutes })
                    : t('quiz_time_limit_none')}
                </p>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'private', label: 'Private (Only me)' },
                    { id: 'public', label: 'Public (Show in Shared Content)' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setNewQuizData({ ...newQuizData, privacy: opt.id })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                        newQuizData.privacy === opt.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setNewQuizModalOpen(false);
                    setNewQuizData({
                      pdfId: '',
                      title: '',
                      questionCount: 10,
                      difficulty: 'medium',
                      privacy: 'private',
                      timeLimitMinutes: null
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateQuiz}
                  disabled={creatingQuiz}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {creatingQuiz ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Quiz...</span>
                    </div>
                  ) : (
                    <span>Create Quiz</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create flashcard deck from PDF modal */}
      {createDeckModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-2xl w-full my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create deck from PDF</h2>
              <button
                onClick={() => !generatingDeck && setCreateDeckModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Select PDF */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select PDF *
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  {userPDFs.filter((p) => p.status === 'completed').length > 0 ? (
                    userPDFs.filter((p) => p.status === 'completed').map((pdf) => (
                      <button
                        key={pdf.id}
                        onClick={() => {
                          setCreateDeckPdfId(pdf.id);
                          setCreateDeckTitle(pdf.file_name.replace(/\.pdf$/i, ''));
                        }}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          createDeckPdfId === pdf.id
                            ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500'
                            : 'bg-zinc-800 hover:bg-zinc-750 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            createDeckPdfId === pdf.id
                              ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                              : 'bg-zinc-700'
                          }`}>
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{pdf.file_name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {pdf.course_name || 'No course'} • {pdf.university || 'No university'}
                            </p>
                          </div>
                          {createDeckPdfId === pdf.id && (
                            <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No completed PDFs available. Upload and process some PDFs first!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Deck Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deck Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Chapter 1 Flashcards"
                  value={createDeckTitle}
                  onChange={(e) => setCreateDeckTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Number of Cards */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Number of Cards
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[8, 12, 16, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setCreateDeckCardCount(count)}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        createDeckCardCount === count
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => !generatingDeck && setCreateDeckModalOpen(false)}
                  disabled={generatingDeck}
                  className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDeckFromPdf}
                  disabled={generatingDeck || !createDeckPdfId}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingDeck ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Deck...</span>
                    </div>
                  ) : (
                    <span>Generate Deck</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete PDF deck modal */}
      {deleteExamModalOpen && examToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {t('exam_delete_title')}
              </h3>
              <p className="text-gray-400">
                <span className="font-semibold text-white">"{examToDelete.title}"</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {t('exam_delete_warning')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteExamModalOpen(false);
                  setExamToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDeleteExam}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {deleteDeckModalOpen && deckToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Delete Deck?</h3>
              <p className="text-gray-400">
                Are you sure you want to delete the deck{' '}
                <span className="font-semibold text-white">"{deckToDelete.title}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                All cards in this deck will be removed. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (deletingDeck) return;
                  setDeleteDeckModalOpen(false);
                  setDeckToDelete(null);
                }}
                disabled={deletingDeck}
                className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDeck}
                disabled={deletingDeck}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingDeck ? 'Deleting...' : 'Delete deck'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Course Modal */}
      {deleteCourseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Delete Course?</h3>
              <p className="text-gray-400">
                Are you sure you want to delete <span className="text-white font-semibold">"{courseToDelete?.title}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will not delete the PDFs, only the course grouping.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteCourseModalOpen(false);
                  setCourseToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCourse}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Quiz Modal */}
      {deleteQuizModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Delete Quiz?</h3>
              <p className="text-gray-400">
                Are you sure you want to delete <span className="text-white font-semibold">"{quizToDelete?.title}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will remove the quiz and its questions, but not the original PDF.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteQuizModalOpen(false);
                  setQuizToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuiz}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Community Post Modal */}
      {deleteCommunityPostModalOpen && communityPostToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-100 dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Post?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteCommunityPostModalOpen(false);
                  setCommunityPostToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                disabled={deletingCommunityPost}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCommunityPost}
                disabled={deletingCommunityPost}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingCommunityPost ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete PDF Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Delete PDF?</h3>
              <p className="text-gray-400">
                Are you sure you want to delete <span className="text-white font-semibold">"{pdfToDelete?.file_name}"</span>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPdfToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Community Post Modal */}
      {communityPostModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-100 dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl p-8 max-w-lg w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">New Post</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload a photo and write a question or topic description below (e.g., &quot;What is the answer to this question?&quot;, &quot;How does this topic work?&quot;)</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCommunityNewPost((p) => ({ ...p, imageFile: e.target.files?.[0] || null }))}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Name</label>
                <input
                  type="text"
                  value={communityNewPost.courseName}
                  onChange={(e) => setCommunityNewPost((p) => ({ ...p, courseName: e.target.value }))}
                  placeholder="e.g., Mathematics, Physics, Chemistry..."
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description / Question</label>
                <textarea
                  value={communityNewPost.caption}
                  onChange={(e) => setCommunityNewPost((p) => ({ ...p, caption: e.target.value }))}
                  placeholder="Bu sorunun cevabı ne? / Bu konu nasıl oluyor?"
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setCommunityPostModalOpen(false);
                  setCommunityNewPost({ imageFile: null, caption: '', courseName: '' });
                }}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:opacity-90"
              >
                Cancel
              </button>
              <button
                onClick={submitCommunityPost}
                disabled={!communityNewPost.imageFile || communityPosting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {communityPosting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Share'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Community Post Detail Modal (comments) */}
      {selectedCommunityPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-3xl overflow-hidden max-w-5xl w-full h-[80vh] max-h-[90vh] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white shadow-md">
                  {selectedCommunityPost.author_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {t('community_post_detail_title')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('community_post_detail_subtitle')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Delete button - only show for user's own posts */}
                {user && selectedCommunityPost.user_id === user.id && (
                  <button
                    onClick={() => handleDeleteCommunityPost(selectedCommunityPost)}
                    className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => { setSelectedCommunityPost(null); setCommunityComments([]); setNewCommentText(''); }}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200/80 dark:divide-zinc-800 min-h-0">
              {/* Left: Post preview */}
              <div className="md:w-[46%] h-full max-h-full overflow-y-auto p-5 space-y-4 bg-white/70 dark:bg-zinc-950/60">
                <div className="rounded-2xl overflow-hidden bg-gray-200 dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-800 cursor-zoom-in">
                  <img
                    src={selectedCommunityPost.image_url}
                    alt={selectedCommunityPost.caption || ''}
                    className="w-full max-h-80 object-contain bg-black/5 dark:bg-black"
                    onClick={() =>
                      setImagePreview({
                        open: true,
                        url: selectedCommunityPost.image_url,
                        alt: selectedCommunityPost.caption || ''
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[11px] font-semibold text-white">
                        {selectedCommunityPost.author_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedCommunityPost.author_name || 'User'}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {new Date(selectedCommunityPost.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    {selectedCommunityPost.course_name && (
                      <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/5 text-[11px] font-medium text-blue-600 dark:text-blue-300 px-2 py-0.5">
                        {selectedCommunityPost.course_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                    {selectedCommunityPost.caption || 'No description'}
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-dashed border-gray-300/80 dark:border-zinc-700/80 bg-gray-50/80 dark:bg-zinc-900/80 px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                  {t('community_post_detail_hint')}
                </div>
              </div>

              {/* Right: Comments thread */}
              <div className="md:flex-1 flex flex-col h-full max-h-full min-h-0">
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t('community_post_detail_comments_title')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {communityComments.length === 0
                        ? t('community_post_detail_comments_empty')
                        : t('community_post_detail_comments_count', { count: communityComments.length })}
                    </p>
                  </div>
                  {user && (
                    <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{t('community_post_detail_answer_author_prefix')}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {user.user_metadata?.first_name || user.email}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  ref={commentsContainerRef}
                  className="flex-1 px-5 pb-4 overflow-y-auto space-y-3"
                >
                  {communityComments.length === 0 ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900/80 border border-dashed border-gray-300/80 dark:border-zinc-700 rounded-2xl px-4 py-3">
                      {t('community_post_detail_comments_empty')}
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {communityComments.map((c) => {
                        const isMe = user && c.user_id === user.id;
                        return (
                          <li
                            key={c.id}
                            className="w-full flex justify-end text-right"
                          >
                            <div className="max-w-full flex flex-col gap-1 items-end">
                              <div
                                className={`inline-flex items-center gap-2 mb-0.5 ${
                                  isMe ? 'flex-row-reverse' : ''
                                }`}
                              >
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {c.author_name || 'User'}
                                </p>
                                <span className="text-[10px] text-gray-500 dark:text-gray-500">
                                  {(c.created_at && new Date(c.created_at).toLocaleString('tr-TR')) || ''}
                                </span>
                              </div>
                              <div
                                className={`rounded-2xl px-3 py-2 text-xs text-gray-800 dark:text-gray-100 shadow-sm text-left ${
                                  isMe
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white max-w-[60%] md:max-w-[55%]'
                                    : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 max-w-[75%] md:max-w-[65%]'
                                }`}
                              >
                                {c.content}
                              </div>
                              {c.image_url && (
                                <div className={`mt-1 ${isMe ? 'ml-auto' : ''}`}>
                                  <img
                                    src={c.image_url}
                                    alt="Çözüm görseli"
                                    className="max-h-40 rounded-xl border border-gray-200 dark:border-zinc-700 object-contain bg-black/5 dark:bg-black/40 cursor-zoom-in"
                                    onClick={() =>
                                      setImagePreview({
                                        open: true,
                                        url: c.image_url,
                                        alt: 'Çözüm görseli'
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Comment input */}
                <div className="px-5 py-4 border-t border-gray-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder={t('community_post_detail_input_placeholder')}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <label className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer text-xs font-medium">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setNewCommentImage(file);
                            }}
                          />
                          +Img
                        </label>
                      </div>
                      {newCommentImage && (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            Seçilen görsel: {newCommentImage.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => setNewCommentImage(null)}
                            className="text-[11px] text-gray-500 dark:text-gray-400 hover:underline"
                          >
                            Kaldır
                          </button>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {t('community_post_detail_input_helper')}
                        </p>
                        <button
                          onClick={submitCommunityComment}
                          disabled={(!newCommentText.trim() && !newCommentImage) || submittingComment}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                          {submittingComment ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image preview lightbox for community images */}
      {imagePreview.open && imagePreview.url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImagePreview({ open: false, url: null, alt: '' })}
        >
          <button
            type="button"
            onClick={() => setImagePreview({ open: false, url: null, alt: '' })}
            className="absolute top-4 right-4 text-gray-300 hover:text-white p-2 rounded-full bg-black/40"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={imagePreview.url}
              alt={imagePreview.alt || ''}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-gray-700 bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Success/Error/Info Toast */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 max-w-md ${
            successMessage.type === 'error'
              ? 'bg-gradient-to-r from-red-500 to-rose-500'
              : successMessage.type === 'info'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}
        >
          {successMessage.type === 'error' ? (
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
          ) : successMessage.type === 'info' ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
          )}
          <p className="font-semibold text-white">{successMessage.text}</p>
        </motion.div>
      )}

      {/* Exam Plan Modal */}
      {examPlanModalOpen && examPlanCourse && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8 max-w-3xl w-full my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Exam study plan
                </h2>
                <p className="text-sm text-gray-400">
                  Automatically spread your PDFs over the days until the exam.
                </p>
              </div>
              <button
                onClick={() => {
                  setExamPlanModalOpen(false);
                  setExamPlanCourse(null);
                  setExamPlanDate('');
                  setExamPlanSelectedPdfs([]);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Exam date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Exam date
                  </label>
                  <input
                    type="text"
                    value={examPlanDate}
                    onChange={(e) => setExamPlanDate(e.target.value)}
                    placeholder={language === 'tr' ? 'GG.AA.YYYY' : 'DD.MM.YYYY'}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/60 transition-colors text-sm"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    {language === 'tr'
                      ? 'Tarih formatı: GG.AA.YYYY (ör. 17.03.2026).'
                      : 'Date format: DD.MM.YYYY (e.g., 17.03.2026).'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course
                  </label>
                  <div className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm">
                    {examPlanCourse.title}
                  </div>
                </div>
              </div>

              {/* PDFs selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  PDFs to include ({examPlanSelectedPdfs.length} selected)
                </label>
                <div className="max-h-56 overflow-y-auto space-y-2 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  {(examPlanCourse.course_pdfs || []).length > 0 ? (
                    examPlanCourse.course_pdfs.map((cp) => (
                      <label
                        key={cp.id}
                        className="flex items-center space-x-3 p-3 bg-zinc-800 hover:bg-zinc-750 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={examPlanSelectedPdfs.includes(cp.pdf_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExamPlanSelectedPdfs((prev) => [...prev, cp.pdf_id]);
                            } else {
                              setExamPlanSelectedPdfs((prev) =>
                                prev.filter((id) => id !== cp.pdf_id),
                              );
                            }
                          }}
                          className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">
                            {cp.pdfs?.file_name || 'PDF'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {cp.pdfs?.course_name} • {cp.pdfs?.university}
                          </p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      This course has no PDFs yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Quizzes selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Quizzes to include ({examPlanSelectedQuizzes.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  {(examPlanCourse.course_quizzes || []).length > 0 ? (
                    examPlanCourse.course_quizzes.map((cq) => {
                      const quiz = cq.quizzes;
                      if (!quiz) return null;
                      return (
                        <label
                          key={cq.id}
                          className="flex items-center space-x-3 p-3 bg-zinc-800 hover:bg-zinc-750 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={examPlanSelectedQuizzes.includes(quiz.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExamPlanSelectedQuizzes((prev) => [...prev, quiz.id]);
                              } else {
                                setExamPlanSelectedQuizzes((prev) =>
                                  prev.filter((id) => id !== quiz.id),
                                );
                              }
                            }}
                            className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-purple-500 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">
                              {quiz.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {quiz.total_questions} questions • {quiz.difficulty}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      No quizzes linked to this course yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setExamPlanModalOpen(false);
                    setExamPlanCourse(null);
                    setExamPlanDate('');
                    setExamPlanSelectedPdfs([]);
                    setExamPlanSelectedQuizzes([]);
                  }}
                  className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const plan = buildCourseStudyPlan(
                      examPlanCourse,
                      examPlanDate,
                      examPlanSelectedPdfs,
                      examPlanCourse.course_quizzes || [],
                      examPlanSelectedQuizzes,
                    );
                    if (!plan || typeof window === 'undefined' || !user) return;

                    try {
                      const key = `studyplan_${user.id}_${examPlanCourse.id}`;
                      window.localStorage.setItem(key, JSON.stringify(plan));
                    } catch {
                      // ignore storage errors
                    }

                    setCourseStudyPlans((prev) => ({
                      ...prev,
                      [examPlanCourse.id]: plan
                    }));

                    setExamPlanModalOpen(false);
                    setExamPlanCourse(null);
                    setExamPlanDate('');
                    setExamPlanSelectedPdfs([]);
                    setExamPlanSelectedQuizzes([]);
                  }}
                  disabled={
                    !examPlanDate ||
                    (examPlanSelectedPdfs.length === 0 &&
                      examPlanSelectedQuizzes.length === 0)
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save plan
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Exam Plan Preview Modal (opened from Exam badge) */}
      {examPlanPreviewCourse && courseStudyPlans[examPlanPreviewCourse.id] && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setExamPlanPreviewCourse(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 md:p-8 max-w-3xl w-full my-8"
          >
            {(() => {
              const plan = courseStudyPlans[examPlanPreviewCourse.id];
              if (!plan) return null;
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white">
                        {examPlanPreviewCourse.title}
                      </h2>
                      <p className="text-sm text-gray-400">
                        Exam:{' '}
                        {new Date(plan.examDate).toLocaleDateString(
                          language === 'tr' ? 'tr-TR' : 'en-US',
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setExamPlanPreviewCourse(null)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 max-h-96 overflow-y-auto text-sm">
                    <div className="space-y-3">
                      {plan.days.map((day) => (
                        <div
                          key={day.date}
                          className="flex items-start justify-between gap-3 border-b border-zinc-700/60 pb-2 last:border-b-0 last:pb-0"
                        >
                          <div className="w-28 text-xs text-gray-400">
                            {new Date(day.date).toLocaleDateString(
                              language === 'tr' ? 'tr-TR' : 'en-US',
                              { weekday: 'short', month: 'short', day: 'numeric' },
                            )}
                          </div>
                          <div className="flex-1 text-gray-200">
                            {day.items.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1">
                                {day.items.map((item) => (
                                  <li
                                    key={`${item.type}-${item.pdfId || item.quizId}`}
                                    className={
                                      item.type === 'quiz'
                                        ? 'text-purple-300'
                                        : undefined
                                    }
                                  >
                                    {item.title}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Rest or review day
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}
    </div>
  );
};

export default Dashboard;
