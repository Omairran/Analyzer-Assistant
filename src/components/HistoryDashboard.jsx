import React, { useEffect, useState } from 'react';
import { 
  History, 
  FileText, 
  Calendar, 
  Eye, 
  Download, 
  Search, 
  RefreshCw, 
  Layers, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  AlertTriangle
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const HistoryDashboard = ({ onSelectRecord, onDownloadPDF, onDownloadJSON }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing filename state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Deleting record state
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch history from backend');
      }
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Could not connect to MongoDB backend to load past records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteRecord = async (recordId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${recordId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== recordId && item.filename !== recordId));
        setDeletingId(null);
      } else {
        alert('Failed to delete record from MongoDB Atlas.');
      }
    } catch (err) {
      console.error('Delete record error:', err);
      alert('Error connecting to backend server.');
    }
  };

  const handleStartRename = (item) => {
    setEditingId(item.id || item.filename);
    setEditingName(item.filename || '');
  };

  const handleSaveRename = async (recordId) => {
    if (!editingName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: editingName.trim() })
      });
      if (response.ok) {
        setHistory(prev => prev.map(item => {
          if (item.id === recordId || item.filename === recordId) {
            return { ...item, filename: editingName.trim() };
          }
          return item;
        }));
        setEditingId(null);
      } else {
        alert('Failed to rename record in MongoDB.');
      }
    } catch (err) {
      console.error('Rename record error:', err);
      alert('Error connecting to backend server.');
    }
  };

  const filteredHistory = history.filter(item => 
    item.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.analysis?.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', margin: 0 }}>
              <History size={26} style={{ color: 'var(--primary-color)' }} />
              Stored Requirement Records
            </h2>
            <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              All software requirement analyses stored permanently in your database. View, rename, or delete past records.
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={fetchHistory}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh History
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: '1.5rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search saved software records by filename or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loader-container" style={{ padding: '3rem 0' }}>
          <div className="spinner"></div>
          <h3>Fetching Saved Records from MongoDB...</h3>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchHistory} style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 1rem auto' }} />
          <h3>No Records Found</h3>
          <p>Analyze a software document to automatically save it into your MongoDB database.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
          {filteredHistory.map((item, idx) => {
            const recordId = item.id || item.filename;
            const isEditing = editingId === recordId;
            const isDeleting = deletingId === recordId;
            
            // Format exact local date and time
            const dateObj = item.created_at ? new Date(item.created_at) : new Date();
            const formattedDate = dateObj.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const hasAnalysis = Boolean(item.analysis);
            const summary = item.analysis?.summary || "No executive summary parsed.";

            return (
              <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: isDeleting ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  {/* File Title Header / Rename Form */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                      <FileText size={20} style={{ color: '#60a5fa', flexShrink: 0 }} />
                      
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid var(--primary-color)',
                            borderRadius: '4px',
                            color: '#fff',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.95rem'
                          }}
                        />
                      ) : (
                        <div style={{ fontWeight: '600', fontSize: '1.05rem', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.filename}>
                          {item.filename || 'Untitled Document'}
                        </div>
                      )}
                    </div>

                    {/* Action icons: Edit & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {isEditing ? (
                        <>
                          <button 
                            onClick={() => handleSaveRename(recordId)}
                            style={{ background: 'rgba(34, 197, 94, 0.2)', border: 'none', color: '#4ade80', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Save Name"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#f87171', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleStartRename(item)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer', transition: 'color 0.2s' }}
                            title="Rename File"
                            onMouseEnter={(e) => e.target.style.color = '#60a5fa'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeletingId(recordId)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer', transition: 'color 0.2s' }}
                            title="Delete Record"
                            onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* System Date & Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <Calendar size={14} />
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>{item.word_count || 0} words</span>
                  </div>

                  {/* Delete Confirmation Box */}
                  {isDeleting ? (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.875rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={16} /> Delete record from MongoDB?
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleDeleteRecord(recordId)}
                          style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '0.35rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Confirm Delete
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ccc', padding: '0.35rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#cbd5e1',
                      lineHeight: '1.5',
                      marginBottom: '1.25rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {summary}
                    </p>
                  )}
                </div>

                {!isDeleting && (
                  <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      onClick={() => onSelectRecord(item)}
                    >
                      <Eye size={15} /> View Analysis
                    </button>
                    
                    {hasAnalysis && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                        title="Download PDF"
                        onClick={() => onDownloadPDF(item.analysis, item.filename)}
                      >
                        <Download size={15} /> PDF
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryDashboard;
