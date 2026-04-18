import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  Loader,
  Network,
  Maximize2,
  RotateCcw
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import MindMap from '../components/MindMap';

// Set up PDF.js worker - matching version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const PDFViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [pdf, setPdf] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [pdfNotes, setPdfNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState('chat'); // 'chat' | 'glossary' | 'highlights' | 'mindmap'
  const [glossaryTerms, setGlossaryTerms] = useState([]);
  const [glossaryLoaded, setGlossaryLoaded] = useState(false);
  const [glossaryLoading, setGlossaryLoading] = useState(false);
  const [glossaryError, setGlossaryError] = useState(null);
  const [mindmap, setMindmap] = useState(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState(null);
  const [mindmapFullscreen, setMindmapFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [showBookmarksList, setShowBookmarksList] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [selectionMenu, setSelectionMenu] = useState(null); // { text, page, x, y }
  const [highlightNoteModal, setHighlightNoteModal] = useState({
    open: false,
    text: '',
    note: '',
    page: 1
  });

  useEffect(() => {
    loadPDF();
  }, [id, user]);

  const loadPDF = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);

      // Get PDF metadata from database
      const { data: pdfData, error: dbError } = await supabase
        .from('pdfs')
        .select('*')
        .eq('id', id)
        .single();

      if (dbError) throw dbError;

      // Check if user has access
      if (pdfData.privacy === 'private' && pdfData.user_id !== user.id) {
        throw new Error('You do not have access to this PDF');
      }

      setPdf(pdfData);

      // Get file URL from storage
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(pdfData.file_path);

      console.log('📄 PDF URL:', publicUrl);
      console.log('📄 PDF Data:', pdfData);

      setPdfUrl(publicUrl);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Build the initial welcome message for the AI chat based on the current PDF.
  const buildWelcomeMessage = () => {
    if (!pdf) return null;
    const title = pdf.file_name || 'this PDF';
    const course = pdf.course_name || '';
    const intro = course
      ? t('pdf_ai_welcome_with_course', { title, course })
      : t('pdf_ai_welcome_without_course', { title });
    return { id: 'welcome', sender: 'ai', text: intro };
  };

  // Reset the chat to a single welcome message and clear persisted history.
  const handleClearChat = () => {
    if (!pdf || !user) return;
    if (chatLoading) return;
    const confirmed = window.confirm(t('pdf_ai_clear_confirm'));
    if (!confirmed) return;

    const storageKey = `pdf_chat_${user.id}_${pdf.id}`;
    try {
      window.localStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Failed to clear PDF chat history from localStorage:', e);
    }

    const welcome = buildWelcomeMessage();
    setChatMessages(welcome ? [welcome] : []);
    setChatInput('');
  };

  // Load persisted chat for this user + PDF, or initialize welcome message
  useEffect(() => {
    if (!pdf || !user) return;

    const storageKey = `pdf_chat_${user.id}_${pdf.id}`;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load PDF chat history from localStorage:', e);
    }

    if (chatMessages.length === 0) {
      const welcome = buildWelcomeMessage();
      if (welcome) setChatMessages([welcome]);
    }
  }, [pdf, user, t]);

  // Persist chat history so it survives refresh / leave-page / come-back
  useEffect(() => {
    if (!pdf || !user || chatMessages.length === 0) return;
    const storageKey = `pdf_chat_${user.id}_${pdf.id}`;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(chatMessages));
    } catch (e) {
      console.error('Failed to save PDF chat history to localStorage:', e);
    }
  }, [chatMessages, pdf, user]);

  // Load persisted notes for this PDF on this device
  useEffect(() => {
    if (!pdf) return;
    const storageKey = `pdf_notes_${pdf.id}`;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (typeof raw === 'string') {
        setPdfNotes(raw);
      }
      setNotesLoaded(true);
    } catch (e) {
      console.error('Failed to load PDF notes from localStorage:', e);
      setNotesLoaded(true);
    }
  }, [pdf]);

  // Persist notes whenever they change
  useEffect(() => {
    if (!pdf || !notesLoaded) return;
    const storageKey = `pdf_notes_${pdf.id}`;
    try {
      window.localStorage.setItem(storageKey, pdfNotes || '');
    } catch (e) {
      console.error('Failed to save PDF notes to localStorage:', e);
    }
  }, [pdfNotes, pdf, notesLoaded]);

  // Load bookmarks for this PDF (persists across leaving/returning)
  useEffect(() => {
    if (!pdf) return;
    const keyBase = pdf.file_path || pdf.file_name || pdf.id;
    const storageKey = `pdf_bookmarks_${keyBase}`;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load PDF bookmarks from localStorage:', e);
    }
  }, [pdf]);

  // Persist bookmarks whenever they change
  useEffect(() => {
    if (!pdf) return;
    const keyBase = pdf.file_path || pdf.file_name || pdf.id;
    const storageKey = `pdf_bookmarks_${keyBase}`;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Failed to save PDF bookmarks from localStorage:', e);
    }
  }, [bookmarks, pdf]);

  // Load persisted glossary for this PDF
  useEffect(() => {
    if (!pdf) return;
    const storageKey = `pdf_glossary_${pdf.id}`;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGlossaryTerms(parsed);
        }
        setGlossaryLoaded(true);
      } else {
        setGlossaryLoaded(true);
      }
    } catch (e) {
      console.error('Failed to load PDF glossary from localStorage:', e);
      setGlossaryLoaded(true);
    }
  }, [pdf]);

  // Persist glossary when terms are loaded (after fetch)
  useEffect(() => {
    if (!pdf || glossaryTerms.length === 0) return;
    const storageKey = `pdf_glossary_${pdf.id}`;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(glossaryTerms));
    } catch (e) {
      console.error('Failed to save PDF glossary to localStorage:', e);
    }
  }, [glossaryTerms, pdf]);

  // Load highlights for this PDF from Supabase (per-user), with a
  // one-time migration from any existing localStorage copy.
  useEffect(() => {
    if (!pdf || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('pdf_highlights')
          .select('id, page, text, note, created_at')
          .eq('pdf_id', pdf.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error('Failed to load highlights from Supabase:', error);
          return;
        }

        const remote = (data || []).map((h) => ({
          id: h.id,
          page: h.page,
          text: h.text || '',
          note: h.note || '',
          createdAt: h.created_at,
        }));

        // One-time migration: if the DB is empty but we have highlights in
        // localStorage from older sessions, push them up then clear the key.
        const keyBase = pdf.file_path || pdf.file_name || pdf.id;
        const storageKey = `pdf_highlights_${keyBase}`;
        if (remote.length === 0) {
          try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const rows = parsed
                  .filter((h) => h && Number.isFinite(h.page))
                  .map((h) => ({
                    pdf_id: pdf.id,
                    user_id: user.id,
                    page: h.page,
                    text: h.text || null,
                    note: h.note || null,
                    created_at: h.createdAt || new Date().toISOString(),
                  }));
                if (rows.length > 0) {
                  const { data: inserted, error: insErr } = await supabase
                    .from('pdf_highlights')
                    .insert(rows)
                    .select('id, page, text, note, created_at');
                  if (!insErr && inserted) {
                    const migrated = inserted.map((h) => ({
                      id: h.id,
                      page: h.page,
                      text: h.text || '',
                      note: h.note || '',
                      createdAt: h.created_at,
                    }));
                    setHighlights(migrated);
                    window.localStorage.removeItem(storageKey);
                    return;
                  }
                }
              }
            }
          } catch (migErr) {
            console.warn('Highlight migration skipped:', migErr);
          }
        }

        setHighlights(remote);
      } catch (e) {
        console.error('Failed to load PDF highlights:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdf, user]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdf.file_name;
    link.click();
  };

  const handleGenerateGlossary = async () => {
    if (!pdf || glossaryLoading) return;
    setGlossaryLoading(true);
    setGlossaryError(null);
    try {
      const response = await fetch(`${API_URL}/api/analyze/pdf/glossary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId: pdf.id })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error('Glossary error:', data);
        throw new Error(data.error || 'Failed to generate glossary');
      }
      setGlossaryTerms(Array.isArray(data.terms) ? data.terms : []);
    } catch (err) {
      console.error('Glossary error:', err);
      setGlossaryError(err.message || 'Failed to generate glossary');
    } finally {
      setGlossaryLoading(false);
    }
  };

  const handleGenerateMindMap = async ({ force = false } = {}) => {
    if (!pdf || mindmapLoading) return;
    setMindmapLoading(true);
    setMindmapError(null);
    try {
      const response = await fetch(`${API_URL}/api/analyze/pdf/mindmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfId: pdf.id,
          language: language === 'tr' ? 'Turkish' : 'English',
          force,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to generate mindmap');
      }
      setMindmap(data.mindmap);
    } catch (err) {
      console.error('MindMap error:', err);
      setMindmapError(err.message || 'Failed to generate mindmap');
    } finally {
      setMindmapLoading(false);
    }
  };

  // Load a cached mindmap (if any) as soon as the PDF is ready.
  // Uses the cache-only GET endpoint so we never trigger an AI call here.
  useEffect(() => {
    let cancelled = false;
    if (!pdf?.id) return;
    (async () => {
      try {
        const resp = await fetch(
          `${API_URL}/api/analyze/pdf/mindmap?pdfId=${encodeURIComponent(pdf.id)}`
        );
        const data = await resp.json();
        if (cancelled) return;
        if (resp.ok && data?.success && data.cached && data.mindmap) {
          setMindmap(data.mindmap);
        }
      } catch (err) {
        console.warn('MindMap cache preload failed:', err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf?.id]);

  // Background RAG ingestion: chunk + embed this PDF so Q&A uses vector
  // retrieval instead of a truncated prefix. Runs once per PDF open; the
  // backend no-ops if the PDF is already indexed.
  useEffect(() => {
    let cancelled = false;
    if (!pdf?.id) return;
    (async () => {
      try {
        const statusResp = await fetch(
          `${API_URL}/api/analyze/pdf/ingest/status?pdfId=${encodeURIComponent(pdf.id)}`
        );
        const status = await statusResp.json();
        if (cancelled) return;
        if (status?.indexed) return;
        console.log('🔍 [RAG] PDF not indexed, ingesting in background...');
        const resp = await fetch(
          `${API_URL}/api/analyze/pdf/ingest`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfId: pdf.id }),
          }
        );
        const data = await resp.json();
        if (!cancelled && data?.success) {
          console.log(`✅ [RAG] Indexed ${data.chunks} chunks`);
        }
      } catch (err) {
        console.warn('RAG background ingest failed:', err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf?.id]);

  const handleMindMapNodeClick = (nodeData) => {
    if (!nodeData?.page || !numPages) return;
    const target = Math.max(1, Math.min(numPages, Number(nodeData.page)));
    setPageNumber(target);
    if (mindmapFullscreen) setMindmapFullscreen(false);
  };

  const clearSelectionMenu = () => {
    setSelectionMenu(null);
  };

  const handlePdfMouseUp = () => {
    if (!pdf || !numPages) {
      clearSelectionMenu();
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      clearSelectionMenu();
      return;
    }
    const text = selection.toString().trim();
    if (!text) {
      clearSelectionMenu();
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      clearSelectionMenu();
      return;
    }
    setSelectionMenu({
      text,
      page: pageNumber,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  const persistHighlight = async ({ page, text, note }) => {
    if (!pdf || !user) return null;
    try {
      const { data, error } = await supabase
        .from('pdf_highlights')
        .insert({
          pdf_id: pdf.id,
          user_id: user.id,
          page,
          text: text || null,
          note: note || null,
        })
        .select('id, page, text, note, created_at')
        .single();
      if (error) {
        console.error('Failed to save highlight to Supabase:', error);
        return null;
      }
      return {
        id: data.id,
        page: data.page,
        text: data.text || '',
        note: data.note || '',
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error('Failed to save highlight:', e);
      return null;
    }
  };

  const handleCreateHighlight = async () => {
    if (!selectionMenu) return;
    const { text, page } = selectionMenu;
    const snippet = text.length > 220 ? `${text.slice(0, 220)}…` : text;
    clearSelectionMenu();
    try {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    } catch {
      // ignore
    }
    const saved = await persistHighlight({ page, text: snippet, note: '' });
    if (saved) {
      setHighlights((prev) => [...prev, saved]);
    }
  };

  const handleCreateBookmarkFromSelection = () => {
    if (!selectionMenu) return;
    const { text, page } = selectionMenu;
    const rawLabel = text.trim();
    const label =
      rawLabel.length > 0
        ? (rawLabel.length > 80 ? `${rawLabel.slice(0, 80)}…` : rawLabel)
        : `Page ${page}`;
    setBookmarks(prev => {
      const exists = prev.some(b => b.page === page && b.label === label);
      if (exists) return prev;
      const next = [
        ...prev,
        { id: `${page}-${Date.now()}`, page, label }
      ];
      return next.sort((a, b) => a.page - b.page);
    });
    clearSelectionMenu();
  };

  const openHighlightNoteFromSelection = () => {
    if (!selectionMenu) return;
    setHighlightNoteModal({
      open: true,
      text: selectionMenu.text,
      note: '',
      page: selectionMenu.page
    });
    clearSelectionMenu();
  };

  const handleConfirmHighlightNote = async () => {
    if (!highlightNoteModal.open) return;
    const text = (highlightNoteModal.text || '').trim();
    const note = (highlightNoteModal.note || '').trim();
    if (!text && !note) {
      setHighlightNoteModal((prev) => ({ ...prev, open: false }));
      return;
    }
    const snippet = text.length > 220 ? `${text.slice(0, 220)}…` : text || note;
    const page = highlightNoteModal.page;
    setHighlightNoteModal({
      open: false,
      text: '',
      note: '',
      page: 1,
    });
    try {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    } catch {
      // ignore
    }
    const saved = await persistHighlight({ page, text: snippet, note });
    if (saved) {
      setHighlights((prev) => [...prev, saved]);
    }
  };

  const handleRemoveHighlight = async (id) => {
    const previous = highlights;
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    if (!pdf || !user) return;
    try {
      const { error } = await supabase
        .from('pdf_highlights')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        console.error('Failed to delete highlight:', error);
        setHighlights(previous);
      }
    } catch (e) {
      console.error('Failed to delete highlight:', e);
      setHighlights(previous);
    }
  };

  const openBookmarkModal = () => {
    if (!pdf || !numPages) return;
    setBookmarkLabel(`Page ${pageNumber}`);
    setShowBookmarkModal(true);
  };

  const handleConfirmBookmark = () => {
    const label = String(bookmarkLabel).trim() || `Page ${pageNumber}`;
    const page = pageNumber;
    setBookmarks(prev => {
      const exists = prev.some(b => b.page === page && b.label === label);
      if (exists) return prev;
      const next = [
        ...prev,
        { id: `${page}-${Date.now()}`, page, label }
      ];
      return next.sort((a, b) => a.page - b.page);
    });
    setShowBookmarkModal(false);
  };

  const handleAddBookmark = () => openBookmarkModal();

  const handleRemoveBookmark = (id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleSendQuestion = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || !pdf || chatLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/analyze/pdf/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId: pdf.id, question: trimmed })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('PDF chat error:', data);
        throw new Error(data.error || 'Failed to get answer from AI');
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'Üzgünüm, şu anda bu soruya yanıt veremedim.',
        sources: Array.isArray(data.rag?.pages) ? data.rag.pages : [],
        ragUsed: !!data.rag?.used,
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('PDF chat error:', err);
      const errorMessage = {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: t('pdf_ai_error_generic')
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-gray-600 dark:text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white text-xl">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white text-xl mb-2">Error Loading PDF</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors border-2 border-gray-300 dark:border-transparent"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                {pdf?.file_name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {pdf?.course_name} • {pdf?.university}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="flex gap-6 max-w-[1800px] w-full">
          {/* Left Side - PDF Viewer */}
          <div className="flex-1 bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-zinc-700 rounded-2xl p-6 overflow-auto max-h-[calc(100vh-200px)]">
            <div className="flex justify-center" onMouseUp={handlePdfMouseUp}>
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('❌ PDF Load Error:', error);
                  setError('Failed to load PDF: ' + error.message);
                }}
                loading={
                  <div className="text-center py-12">
                    <Loader className="w-12 h-12 text-gray-600 dark:text-white animate-spin mx-auto mb-4" />
                    <p className="text-gray-900 dark:text-white">Loading PDF...</p>
                  </div>
                }
                error={
                  <div className="text-center py-12">
                    <p className="text-red-500 dark:text-red-400">Failed to load PDF</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          </div>

          {/* Right Side - AI Chat + Glossary + Notes + Highlights */}
          <div className="w-[480px] flex flex-col h-[calc(100vh-200px)]">
            {/* Chat / Glossary Card */}
            <div className="flex flex-col bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-zinc-700 rounded-2xl overflow-hidden flex-1 min-h-0">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {activeRightTab === 'chat'
                      ? t('pdf_ai_title')
                      : activeRightTab === 'glossary'
                      ? 'Glossary'
                      : activeRightTab === 'mindmap'
                      ? t('mindmap_title')
                      : 'Highlights'}
                  </h2>
                  {activeRightTab === 'chat' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('pdf_ai_subtitle')}
                    </p>
                  )}
                  {activeRightTab === 'glossary' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Important terms and definitions extracted from this PDF.
                    </p>
                  )}
                  {activeRightTab === 'mindmap' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('mindmap_subtitle')}
                    </p>
                  )}
                  {activeRightTab === 'highlights' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Text you highlighted from this PDF. Click to jump to that page.
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveRightTab('chat')}
                      className={`px-3 py-1 rounded-full font-medium ${
                        activeRightTab === 'chat'
                          ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab('glossary')}
                      className={`px-3 py-1 rounded-full font-medium ${
                        activeRightTab === 'glossary'
                          ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Glossary
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab('mindmap')}
                      className={`px-3 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                        activeRightTab === 'mindmap'
                          ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <Network className="w-3.5 h-3.5" />
                      {t('mindmap_tab')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab('highlights')}
                      className={`px-3 py-1 rounded-full font-medium ${
                        activeRightTab === 'highlights'
                          ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Highlights
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeRightTab === 'chat' && chatMessages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearChat}
                        disabled={chatLoading}
                        title={t('pdf_ai_clear_title')}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t('pdf_ai_clear')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotes((v) => !v)}
                      className="inline-flex items-center rounded-full border border-gray-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {showNotes ? 'Hide notes' : 'Notes'}
                    </button>
                  </div>
                </div>
              </div>

              {activeRightTab === 'chat' && (
                <>
                  {/* Chat Messages */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse text-right' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.sender === 'user'
                              ? 'bg-gray-300 dark:bg-zinc-700 text-gray-900 dark:text-white'
                              : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                          }`}
                        >
                          <span className="text-sm font-bold">
                            {msg.sender === 'user' ? 'You' : 'AI'}
                          </span>
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                            msg.sender === 'user'
                              ? 'bg-blue-500 text-white dark:bg-blue-600'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-300'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-zinc-700 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Kaynak:
                              </span>
                              {msg.sources.map((page) => (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => {
                                    if (numPages) {
                                      setPageNumber(
                                        Math.max(1, Math.min(numPages, Number(page)))
                                      );
                                    }
                                  }}
                                  className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 font-medium"
                                >
                                  s.{page}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-6 border-t border-gray-200 dark:border-zinc-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('pdf_ai_input_placeholder')}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendQuestion();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        onClick={handleSendQuestion}
                        disabled={chatLoading || !chatInput.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {chatLoading ? t('pdf_ai_sending') : t('pdf_ai_send')}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeRightTab === 'glossary' && (
                <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
                  {glossaryLoading && (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-600 dark:text-gray-300">
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      <span>Generating glossary from this PDF...</span>
                    </div>
                  )}
                  {!glossaryLoading && glossaryTerms.length === 0 && !glossaryError && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-gray-600 dark:text-gray-300 gap-4">
                      <p>Generate a glossary of the most important concepts in this PDF.</p>
                      <button
                        type="button"
                        onClick={handleGenerateGlossary}
                        className="px-5 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-black text-sm font-semibold hover:opacity-90"
                      >
                        Generate glossary
                      </button>
                    </div>
                  )}
                  {glossaryError && !glossaryLoading && (
                    <div className="text-sm text-red-500 dark:text-red-400">
                      {glossaryError}
                    </div>
                  )}
                  {!glossaryLoading && glossaryTerms.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleGenerateGlossary}
                        className="self-start mb-2 px-4 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      >
                        Regenerate glossary
                      </button>
                      <div className="space-y-3">
                        {glossaryTerms.map((term, index) => (
                          <div
                            key={`${term.term}-${index}`}
                            className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 px-4 py-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {term.term}
                              </h3>
                              {term.importance && (
                                <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 ${
                                  term.importance === 'high'
                                    ? 'bg-red-500/10 text-red-500'
                                    : term.importance === 'low'
                                    ? 'bg-gray-500/10 text-gray-400'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {term.importance}
                                </span>
                              )}
                            </div>
                            {term.category && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                                {term.category}
                              </p>
                            )}
                            <p className="text-gray-800 dark:text-gray-200 text-sm">
                              {term.definition}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeRightTab === 'mindmap' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {mindmapLoading && (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-600 dark:text-gray-300">
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      <span>{t('mindmap_loading')}</span>
                    </div>
                  )}
                  {!mindmapLoading && !mindmap && !mindmapError && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-gray-600 dark:text-gray-300 gap-4 p-6">
                      <Network className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      <p>{t('mindmap_empty')}</p>
                      <button
                        type="button"
                        onClick={() => handleGenerateMindMap()}
                        className="px-5 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-black text-sm font-semibold hover:opacity-90"
                      >
                        {t('mindmap_generate')}
                      </button>
                    </div>
                  )}
                  {mindmapError && !mindmapLoading && (
                    <div className="p-6 text-sm text-red-500 dark:text-red-400">
                      {mindmapError}
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleGenerateMindMap()}
                          className="px-4 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                          {t('mindmap_retry')}
                        </button>
                      </div>
                    </div>
                  )}
                  {mindmap && !mindmapLoading && (
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between gap-2 px-5 py-2 border-b border-gray-200 dark:border-zinc-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {mindmap.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMindmapFullscreen(true)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-300 dark:border-zinc-700 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            <Maximize2 className="w-3 h-3" />
                            {t('mindmap_fullscreen')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateMindMap({ force: true })}
                            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-zinc-700 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            {t('mindmap_regenerate')}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0">
                        <MindMap
                          mindmap={mindmap}
                          onNodeClick={handleMindMapNodeClick}
                          compact
                        />
                      </div>
                      <div className="px-5 py-2 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-zinc-800">
                        {t('mindmap_hint')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === 'highlights' && (
                <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-3">
                  {highlights.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Henüz highlight yok. PDF üzerinde metin seçip açılan menüden
                      <span className="font-semibold"> Highlight</span> veya
                      <span className="font-semibold"> Not ekle</span> seçebilirsin.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {highlights
                        .slice()
                        .sort((a, b) => a.page - b.page)
                        .map((h) => (
                          <li
                            key={h.id}
                            className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 px-4 py-3 text-sm flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setPageNumber(h.page)}
                                className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[11px]">
                                  Page {h.page}
                                </span>
                                <span>Go to highlight</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveHighlight(h.id)}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                aria-label="Remove highlight"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {h.text && (
                              <p className="text-gray-800 dark:text-gray-200 text-xs italic line-clamp-3">
                                “{h.text}”
                              </p>
                            )}
                            {h.note && (
                              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                Not: {h.note}
                              </p>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Notes Card (collapsible) */}
            {showNotes && (
              <div className="mt-4 bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-zinc-700 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Notes for this PDF
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Only you can see these notes. They are saved for this PDF on this device.
                    </p>
                  </div>
                </div>
                <textarea
                  value={pdfNotes}
                  onChange={(e) => setPdfNotes(e.target.value)}
                  placeholder="Write down key points, page references, or questions for this PDF..."
                  className="mt-2 flex-1 min-h-[140px] resize-none rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen MindMap Modal */}
      {mindmapFullscreen && mindmap && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full h-full max-w-[1400px] max-h-[900px] rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {mindmap.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('mindmap_hint')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMindmapFullscreen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300"
                aria-label="Close mindmap"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <MindMap
                mindmap={mindmap}
                onNodeClick={handleMindMapNodeClick}
              />
            </div>
          </div>
        </div>
      )}

      {/* Selection action menu for text highlights */}
      {selectionMenu && (
        <div
          className="fixed z-40"
          style={{
            top: Math.max(selectionMenu.y, 80),
            left: selectionMenu.x
          }}
        >
          <div className="inline-flex items-center gap-1 rounded-full bg-gray-900 text-white text-[11px] px-2 py-1 shadow-lg border border-gray-700">
            <button
              type="button"
              onClick={handleCreateHighlight}
              className="px-2 py-0.5 rounded-full hover:bg-gray-700"
            >
              Highlight
            </button>
            <span className="h-4 w-px bg-gray-700" />
            <button
              type="button"
              onClick={handleCreateBookmarkFromSelection}
              className="px-2 py-0.5 rounded-full hover:bg-gray-700 whitespace-nowrap"
            >
              Bookmark yap
            </button>
            <span className="h-4 w-px bg-gray-700" />
            <button
              type="button"
              onClick={openHighlightNoteFromSelection}
              className="px-2 py-0.5 rounded-full hover:bg-gray-700 whitespace-nowrap"
            >
              Not ekle
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
        <div className="flex items-center justify-center gap-4 py-3 px-4">
          {/* Zoom */}
          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="p-2 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-gray-900 dark:text-white text-sm w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
              disabled={scale >= 3.0}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* Bookmark: add button + toggle list */}
          <div className="flex flex-col items-center min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddBookmark}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700"
              >
                + Bookmark
              </button>
              {bookmarks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBookmarksList(prev => !prev)}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  {showBookmarksList ? '▼' : '▲'} Bookmarks ({bookmarks.length})
                </button>
              )}
            </div>
            {showBookmarksList && bookmarks.length > 0 && (
              <div className="mt-2 w-full max-w-md max-h-32 overflow-y-auto rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/80 shadow-lg">
                <ul className="py-1">
                  {bookmarks.map((b) => (
                    <li key={b.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700/50 border-b border-gray-100 dark:border-zinc-700 last:border-0">
                      <button
                        type="button"
                        onClick={() => { setPageNumber(b.page); setShowBookmarksList(false); }}
                        className="flex-1 text-left text-sm text-gray-800 dark:text-gray-100 truncate"
                      >
                        <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">{b.page}</span>
                        {b.label}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBookmark(b.id)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Remove bookmark"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Page Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-gray-900 dark:text-white text-sm">
              Page {pageNumber} of {numPages || '?'}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Highlight note modal */}
      {highlightNoteModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setHighlightNoteModal(prev => ({ ...prev, open: false }))}
          role="dialog"
          aria-modal="true"
          aria-labelledby="highlight-modal-title"
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 p-6 w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 id="highlight-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Highlight için not ekle
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
              Seçilen metin:
            </p>
            <p className="text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-zinc-900/60 rounded-lg px-3 py-2 mb-3 max-h-24 overflow-y-auto">
              {highlightNoteModal.text}
            </p>
            <textarea
              value={highlightNoteModal.note}
              onChange={e => setHighlightNoteModal(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Bu highlight için kısa bir not yaz..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[80px] resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setHighlightNoteModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmHighlightNote}
                className="px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmark name modal */}
      {showBookmarkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowBookmarkModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bookmark-modal-title"
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 p-6 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 id="bookmark-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Bookmark name
            </h3>
            <input
              type="text"
              value={bookmarkLabel}
              onChange={e => setBookmarkLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmBookmark();
                if (e.key === 'Escape') setShowBookmarkModal(false);
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Page 1"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowBookmarkModal(false)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmBookmark}
                className="px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewerPage;
