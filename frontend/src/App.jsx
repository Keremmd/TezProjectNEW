import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import LandingPageNew from './pages/LandingPageNew';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PDFViewerPage from './pages/PDFViewerPage';
import QuizPage from './pages/QuizPage';
import FlashcardPage from './pages/FlashcardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <I18nProvider>
          <Routes>
            <Route path="/" element={<LandingPageNew />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pdf/:id" 
              element={
                <ProtectedRoute>
                  <PDFViewerPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quiz/:id" 
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/flashcards/quiz/:id" 
              element={
                <ProtectedRoute>
                  <FlashcardPage mode="quiz" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/flashcards/deck/:id" 
              element={
                <ProtectedRoute>
                  <FlashcardPage mode="deck" />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </I18nProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
