import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Database, 
  Network, 
  ListTodo, 
  FileText,
  AlertCircle,
  Download,
  FileCode,
  ChevronDown,
  Workflow
} from 'lucide-react';
import { exportToPDF, exportToJSON } from '../utils/exportHelpers';

const MermaidViewer = ({ chartText }) => {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    if (!chartText) return;
    
    let isMounted = true;
    const loadAndRenderMermaid = async () => {
      try {
        setRenderError(null);
        // Dynamic import of mermaid to prevent bundle/install resolution blocks
        const mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
        const mermaid = mermaidModule.default || mermaidModule;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif'
        });

        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const cleanedChart = chartText.trim();
        const { svg } = await mermaid.render(uniqueId, cleanedChart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn("CDN Mermaid rendering fallback to code view:", err);
        if (isMounted) {
          setRenderError("Visual diagram preview unavailable. Displaying raw Mermaid syntax below.");
        }
      }
    };

    loadAndRenderMermaid();
    return () => { isMounted = false; };
  }, [chartText]);

  return (
    <div>
      {svgContent && !renderError ? (
        <div 
          ref={containerRef} 
          style={{ overflowX: 'auto', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', display: 'flex', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: svgContent }} 
        />
      ) : renderError ? (
        <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {renderError}
        </div>
      ) : (
        <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Rendering sequence diagram...</div>
      )}
      
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Mermaid Syntax Output:</h4>
        <pre style={{ 
          background: 'rgba(0, 0, 0, 0.3)', 
          padding: '1rem', 
          borderRadius: '8px', 
          fontSize: '0.85rem', 
          color: '#a7f3d0',
          fontFamily: 'monospace',
          overflowX: 'auto'
        }}>
          {chartText}
        </pre>
      </div>
    </div>
  );
};

const ResultsDashboard = ({ result, fileName }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePDF = () => {
    exportToPDF(result, fileName);
    setDropdownOpen(false);
  };

  const handleJSON = () => {
    exportToJSON(result, fileName);
    setDropdownOpen(false);
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="file-card glass-panel" style={{ position: 'relative' }}>
        <div className="file-info">
          <FileText className="file-icon" size={24} />
          <div>
            <div className="file-name">{fileName || "requirement_document.pdf"}</div>
            <div className="file-size" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              {result.isLiveAI ? (
                <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                  ✨ Powered by Live Gemini AI
                </span>
              ) : (
                <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                  ⚠️ Mock Data Fallback
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Download Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} /> Download Result <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 100,
              minWidth: '180px',
              overflow: 'hidden',
              padding: '0.25rem 0'
            }}>
              <button
                onClick={handlePDF}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <FileText size={16} style={{ color: '#60a5fa' }} /> Download PDF Document
              </button>

              <button
                onClick={handleJSON}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <FileCode size={16} style={{ color: '#4ade80' }} /> Download JSON File
              </button>
            </div>
          )}
        </div>
      </div>

      {!result.isLiveAI && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
          padding: '0.875rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>
            <strong>Note:</strong> Showing fallback mock analysis because Gemini API key check failed or returned an error.
          </span>
        </div>
      )}

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          Parsed Text
        </button>
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Criteria
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Dev Tasks
        </button>
        <button 
          className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          Database Schema
        </button>
        <button 
          className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API Endpoints
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sequence' ? 'active' : ''}`}
          onClick={() => setActiveTab('sequence')}
        >
          Sequence Diagram (Mermaid)
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'text' && (
          <div className="glass-panel section-card">
            <div className="section-header">
              <FileText className="section-icon" size={20} />
              <h3>Parsed Document Text (FastAPI Extraction)</h3>
            </div>
            {result.wordCount && (
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Words: <strong style={{ color: 'var(--primary-color)' }}>{result.wordCount}</strong> | Characters: <strong style={{ color: 'var(--secondary-color)' }}>{result.charCount}</strong>
              </div>
            )}
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              background: 'rgba(0,0,0,0.2)', 
              padding: '1rem', 
              borderRadius: '8px', 
              fontSize: '0.95rem',
              color: 'var(--text-main)',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {result.extractedText || "No text parsed yet."}
            </pre>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="results-grid">
            <div className="glass-panel section-card" style={{ gridColumn: '1 / -1' }}>
              <div className="section-header">
                <AlertCircle className="section-icon" size={20} />
                <h3>Executive Summary</h3>
              </div>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                {result.summary}
              </p>
            </div>
            
            <div className="glass-panel section-card" style={{ gridColumn: '1 / -1' }}>
              <div className="section-header">
                <CheckCircle2 className="section-icon" size={20} />
                <h3>Acceptance Criteria</h3>
              </div>
              <ul className="criteria-list">
                {result.acceptanceCriteria?.map((criteria, idx) => (
                  <li key={idx}>
                    <CheckCircle2 className="check-icon" size={18} />
                    <span>{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.edgeCases && result.edgeCases.length > 0 && (
              <div className="glass-panel section-card" style={{ gridColumn: '1 / -1' }}>
                <div className="section-header">
                  <AlertCircle className="section-icon" size={20} style={{ color: '#f59e0b' }} />
                  <h3>Detected Edge Cases & Missing Requirements</h3>
                </div>
                <ul className="criteria-list">
                  {result.edgeCases.map((edgeCase, idx) => (
                    <li key={idx}>
                      <AlertCircle className="check-icon" size={18} style={{ color: '#f59e0b' }} />
                      <span>{edgeCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="glass-panel section-card">
            <div className="section-header">
              <ListTodo className="section-icon" size={20} />
              <h3>Generated Development Tasks</h3>
            </div>
            <div>
              {result.tasks?.map((task, idx) => (
                <div key={idx} className="task-item">
                  <span style={{ fontWeight: '500' }}>{task.title}</span>
                  <span className={`badge badge-${task.complexity.toLowerCase()}`}>
                    {task.complexity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="glass-panel section-card">
            <div className="section-header">
              <Database className="section-icon" size={20} />
              <h3>Suggested Database Schema</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Table Name</th>
                    <th>Columns / Attributes</th>
                  </tr>
                </thead>
                <tbody>
                  {result.dbTables?.map((table, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{table.name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {table.columns.map((col, cIdx) => (
                            <span key={cIdx} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                              {col}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="glass-panel section-card">
            <div className="section-header">
              <Network className="section-icon" size={20} />
              <h3>Required API Endpoints</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {result.apis?.map((api, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="badge badge-method">{api.method}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--secondary-color)' }}>
                        {api.endpoint}
                      </td>
                      <td>{api.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sequence' && (
          <div className="glass-panel section-card">
            <div className="section-header">
              <Workflow className="section-icon" size={20} />
              <h3>Generated Sequence Diagram (Mermaid)</h3>
            </div>
            {result.sequenceDiagram ? (
              <MermaidViewer chartText={result.sequenceDiagram} />
            ) : (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                No sequence diagram generated for this document.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDashboard;
