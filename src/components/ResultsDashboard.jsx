import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Database, 
  Network, 
  ListTodo, 
  FileText,
  AlertCircle,
  Download
} from 'lucide-react';

const ResultsDashboard = ({ result, fileName }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="file-card glass-panel">
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
                  ⚠️ Mock Data Fallback (API Key 403 Error)
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Download size={16} /> Export JSON
        </button>
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
            <strong>Note:</strong> Showing fallback mock analysis because the Gemini API Key in <code>backend/.env</code> returned <code>403 PERMISSION_DENIED</code>. 
            To see real AI analysis, get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Google AI Studio</a> (starts with <code>AIzaSy...</code>) and paste it into <code>backend/.env</code>.
          </span>
        </div>
      )}


      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          Parsed Document Text
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
                {result.acceptanceCriteria.map((criteria, idx) => (
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
              {result.tasks.map((task, idx) => (
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
                  {result.dbTables.map((table, idx) => (
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
                  {result.apis.map((api, idx) => (
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
      </div>
    </div>
  );
};

export default ResultsDashboard;
