import { useState, useEffect } from 'react';
import { UploadCloud, FileText, Settings, History, User, LogOut, ShieldCheck, Lock, RotateCcw, AlertCircle } from 'lucide-react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryDashboard from './components/HistoryDashboard';
import AuthModal from './components/AuthModal';
import { exportToPDF, exportToJSON } from './utils/exportHelpers';
import { API_BASE_URL } from './config';

function App() {
  const [activeView, setActiveView] = useState('upload'); // 'upload' | 'history'
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('analyzer_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('analyzer_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('analyzer_user');
    }
  }, [currentUser]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    
    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'X-User-Role': currentUser.role,
        },
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ detail: 'Upload error' }));
        const errorMsg = errJson.detail || 'Backend API error during document parsing.';
        const apiErr = new Error(errorMsg);
        apiErr.status = response.status;
        throw apiErr;
      }

      const parseData = await response.json();
      if (!parseData.analysis) {
        throw new Error("Gemini API did not return analysis data. Please try again.");
      }

      setResult({
        ...parseData.analysis,
        isLiveAI: true,
        extractedText: parseData.extracted_text,
        wordCount: parseData.word_count,
        charCount: parseData.char_count,
        fileName: parseData.filename,
      });
    } catch (err) {
      console.error("Gemini AI Analysis Error:", err);
      setResult(null); // Ensure NO demo/mock data is shown when API fails
      setError(err.message || "⚠️ Gemini API is not responding. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectHistoryRecord = (record) => {
    if (!record || !record.analysis) return;
    setResult({
      ...record.analysis,
      isLiveAI: true,
      extractedText: record.extracted_text,
      wordCount: record.word_count,
      charCount: record.char_count,
      fileName: record.filename,
    });
    setFile({ name: record.filename });
    setActiveView('upload');
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => { setActiveView('upload'); handleReset(); }}>
          <Settings size={28} />
          <span>AI Requirement Analyzer</span>
        </div>

        {/* View Toggle Tabs & Auth */}
        <div className="header-actions">
          <div className="header-nav-btns">
            <button 
              className={`btn ${activeView === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('upload')}
            >
              <UploadCloud size={16} /> New Analysis
            </button>
            
            <button 
              className={`btn ${activeView === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('history')}
            >
              <History size={16} /> Saved Records
            </button>

            {result && activeView === 'upload' && (
              <button className="btn btn-secondary" onClick={handleReset}>
                New File
              </button>
            )}
          </div>

          {/* User Auth Info / Login Button */}
          <div className="auth-info-container">
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: '#fff'
                }}>
                  <ShieldCheck size={14} style={{ color: 'var(--primary-color)' }} />
                  <span style={{ fontWeight: 600 }}>{currentUser.username}</span>
                  <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>({currentUser.role})</span>
                </div>
                <button 
                  onClick={handleLogout}
                  title="Sign Out"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsAuthModalOpen(true)}
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <User size={15} /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {activeView === 'history' ? (
          <HistoryDashboard 
            onSelectRecord={handleSelectHistoryRecord}
            onDownloadPDF={exportToPDF}
            onDownloadJSON={exportToJSON}
          />
        ) : (
          <>
            {!file && !analyzing && !result && (
              <UploadSection onUpload={handleFileUpload} error={error} />
            )}

            {file && !analyzing && !result && (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: 'auto', width: '100%', maxWidth: '600px' }}>
                <FileText size={64} style={{ color: 'var(--primary-color)', margin: '0 auto 1.5rem auto' }} />
                <h2>Ready to Analyze</h2>
                <p>"{file.name}" is loaded and ready for AI processing.</p>

                {!currentUser && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed var(--primary-color)', borderRadius: '8px', color: 'var(--primary-color)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Lock size={16} /> Sign in required before initiating AI requirement extraction.
                  </div>
                )}

                {error && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '10px',
                    color: '#f87171',
                    textAlign: 'center',
                    fontWeight: '500',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                      <AlertCircle size={22} style={{ flexShrink: 0 }} />
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAnalyze} 
                    style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {error ? (
                      <><RotateCcw size={18} /> Retry Analysis</>
                    ) : (
                      currentUser ? 'Start Analysis Process' : 'Sign In & Start Analysis'
                    )}
                  </button>

                  {error && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleReset}
                      style={{ padding: '0.75rem 1.25rem' }}
                    >
                      Change File
                    </button>
                  )}
                </div>
              </div>
            )}

            {analyzing && (
              <div className="loader-container">
                <div className="spinner"></div>
                <h3>Analyzing Document with AI...</h3>
                <p>Extracting requirements, generating tasks, and designing database schema.</p>
              </div>
            )}

            {result && !analyzing && (
              <ResultsDashboard result={result} fileName={file?.name} />
            )}
          </>
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin} 
      />
    </div>
  );
}

export default App;
