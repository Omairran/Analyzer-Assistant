import React, { useRef, useState } from 'react';
import { UploadCloud, FileType2 } from 'lucide-react';

const UploadSection = ({ onUpload, error }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

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
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file) => {
    // Check file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx?|txt)$/i)) {
      alert("Please upload a PDF, Word document, or Text file.");
      return;
    }
    onUpload(file);
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Upload Requirement Document</h1>
        <p style={{ fontSize: '1.1rem' }}>
          Our AI will analyze your product requirements, extract key acceptance criteria, generate tasks, and suggest a database schema.
        </p>
      </div>

      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="file-input" 
          onChange={handleChange}
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        />
        
        <UploadCloud className="upload-icon" />
        
        <h3>Drag & Drop your document here</h3>
        <p style={{ margin: '0.5rem 0 1.5rem 0' }}>or click to browse files</p>
        
        <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); onButtonClick(); }}>
          Select File
        </button>

        <div className="supported-formats" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '2rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileType2 size={16} /> PDF
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileType2 size={16} /> Word (DOCX)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileType2 size={16} /> Text (TXT)
          </span>
        </div>
      </div>
      
      {error && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: '8px', color: 'var(--danger-color)', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default UploadSection;
