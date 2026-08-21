import { useState } from 'react';
import { UploadCloud, FileText, Settings, History, Layers } from 'lucide-react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryDashboard from './components/HistoryDashboard';
import { exportToPDF, exportToJSON } from './utils/exportHelpers';

// Mock JSON analysis response
const mockAnalysisData = {
  summary: "This requirement document describes a web-based e-commerce platform where users can browse products, add them to a cart, and checkout using a credit card. It includes user authentication and an admin panel for inventory management.",
  acceptanceCriteria: [
    "User can browse products by category.",
    "User can add products to a shopping cart and view cart total.",
    "User can proceed to checkout and enter shipping details securely.",
    "User can pay using a credit card via Stripe integration.",
    "Admin can add, edit, or remove products from the inventory."
  ],
  tasks: [
    { title: "Implement product listing and filtering", complexity: "Medium" },
    { title: "Build shopping cart state management", complexity: "High" },
    { title: "Integrate Stripe payment gateway", complexity: "High" },
    { title: "Create user authentication flow (JWT)", complexity: "Medium" },
    { title: "Build Admin dashboard for inventory", complexity: "Medium" }
  ],
  dbTables: [
    { name: "Users", columns: ["id", "email", "password_hash", "role"] },
    { name: "Products", columns: ["id", "name", "description", "price", "stock_count", "category_id"] },
    { name: "Orders", columns: ["id", "user_id", "total_amount", "status", "created_at"] },
    { name: "OrderItems", columns: ["id", "order_id", "product_id", "quantity", "price_at_purchase"] }
  ],
  apis: [
    { method: "GET", endpoint: "/api/products", description: "List all products with optional filters" },
    { method: "POST", endpoint: "/api/checkout", description: "Process a new order and payment" },
    { method: "POST", endpoint: "/api/auth/login", description: "Authenticate user and return JWT" },
    { method: "PUT", endpoint: "/api/admin/products/:id", description: "Update product details (Admin only)" }
  ]
};

function App() {
  const [activeView, setActiveView] = useState('upload'); // 'upload' | 'history'
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
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
      const hasLiveAnalysis = Boolean(parseData.analysis);
      const aiResult = parseData.analysis || mockAnalysisData;

      setResult({
        ...aiResult,
        isLiveAI: hasLiveAnalysis,
        extractedText: parseData.extracted_text,
        wordCount: parseData.word_count,
        charCount: parseData.char_count,
        fileName: parseData.filename,
      });
    } catch (err) {
      const isServerBusy = 
        err.status === 503 || 
        err.message?.includes("Server is busy") || 
        err.message?.includes("503") || 
        err.message?.includes("UNAVAILABLE");

      if (isServerBusy) {
        setError("⚠️ Server is busy. Please try again in a few moments.");
        setResult(null);
      } else {
        console.warn("FastAPI service offline or error, using mock fallback:", err.message);
        setResult({
          ...mockAnalysisData,
          isLiveAI: false,
          extractedText: `[Uploaded File: ${file.name}]\n\nRequirement Document Content:\nThis document outlines user registration, product browsing, shopping cart implementation, payment gateway integration, and admin portal requirements.`,
          wordCount: 350,
          charCount: 2200,
          fileName: file.name,
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectHistoryRecord = (record) => {
    setResult({
      ...(record.analysis || mockAnalysisData),
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

        {/* View Toggle Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className={`btn ${activeView === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveView('upload')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UploadCloud size={16} /> New Analysis
          </button>
          
          <button 
            className={`btn ${activeView === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveView('history')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <History size={16} /> Saved Records (MongoDB)
          </button>

          {result && activeView === 'upload' && (
            <button className="btn btn-secondary" onClick={handleReset} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Analyze New File
            </button>
          )}
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
                {error && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: '8px', color: 'var(--danger-color)', textAlign: 'center', fontWeight: '500' }}>
                    {error}
                  </div>
                )}
                <div style={{ marginTop: '2rem' }}>
                   <button className="btn btn-primary" onClick={handleAnalyze} style={{ width: '100%' }}>
                    Start Analysis Process
                  </button>
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
    </div>
  );
}

export default App;
