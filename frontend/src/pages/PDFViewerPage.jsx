import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  X,
  Loader
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker - matching version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const PDFViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pdf, setPdf] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-xl mb-2">Error Loading PDF</p>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white line-clamp-1">
                {pdf?.file_name}
              </h1>
              <p className="text-sm text-gray-400">
                {pdf?.course_name} • {pdf?.university}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="flex gap-6 max-w-[1800px] w-full">
          {/* Left Side - PDF Viewer */}
          <div className="flex-1 bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-6 overflow-auto max-h-[calc(100vh-200px)]">
          <div className="flex justify-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('❌ PDF Load Error:', error);
                setError('Failed to load PDF: ' + error.message);
              }}
              loading={
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                  <p className="text-white">Loading PDF...</p>
                </div>
              }
              error={
                <div className="text-center py-12">
                  <p className="text-red-400">Failed to load PDF</p>
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

          {/* Right Side - AI Chat */}
          <div className="w-[480px] flex flex-col bg-zinc-900 border-2 border-zinc-700 rounded-2xl overflow-hidden max-h-[calc(100vh-200px)]">
            {/* Chat Header */}
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white mb-2">AI Assistant</h2>
              <p className="text-sm text-gray-400">Ask questions about this PDF</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {/* Example AI Message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div className="flex-1 bg-zinc-800 rounded-2xl p-4">
                  <p className="text-gray-300 text-sm">
                    Hello! I'm your AI assistant. I can help you understand this PDF about Ergonomics. 
                    Ask me anything about the content!
                  </p>
                </div>
              </div>

              {/* User can add more messages here */}
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about this PDF..."
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 py-4">
        <div className="flex items-center justify-center space-x-6">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white text-sm w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              disabled={scale >= 3.0}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white text-sm">
              Page {pageNumber} of {numPages || '?'}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewerPage;
