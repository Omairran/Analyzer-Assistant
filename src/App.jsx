import { useState } from 'react';
import { UploadCloud, FileText, Settings, Loader2 } from 'lucide-react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';

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
        throw new Error(errJson.detail || 'Backend API error during document parsing.');
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
      console.warn("FastAPI service offline or error, using mock fallback:", err.message);
      // Fallback for standalone demo mode
      setResult({
        ...mockAnalysisData,
        isLiveAI: false,
        extractedText: `[Uploaded File: ${file.name}]\n\nRequirement Document Content:\nThis document outlines user registration, product browsing, shopping cart implementation, payment gateway integration, and admin portal requirements.`,
        wordCount: 350,
        charCount: 2200,
        fileName: file.name,
      });
    }
 finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <Settings size={28} />
          <span>AI Requirement Analyzer</span>
        </div>
        
        {file && !analyzing && !result && (
          <button className="btn btn-primary" onClick={handleAnalyze}>
            <Settings size={18} />
            Analyze Requirements
          </button>
        )}
        
        {result && (
          <button className="btn btn-secondary" onClick={handleReset}>
            Analyze New Document
          </button>
        )}
      </header>

      <main className="main-content">
        {!file && !analyzing && !result && (
          <UploadSection onUpload={handleFileUpload} error={error} />
        )}

        {file && !analyzing && !result && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: 'auto', width: '100%', maxWidth: '600px' }}>
            <FileText size={64} style={{ color: 'var(--primary-color)', margin: '0 auto 1.5rem auto' }} />
            <h2>Ready to Analyze</h2>
            <p>"{file.name}" is loaded and ready for AI processing.</p>
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
      </main>
    </div>
  );
}

export default App;
