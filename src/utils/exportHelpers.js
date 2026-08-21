import jsPDF from 'jspdf';

export const exportToJSON = (result, fileName) => {
  const jsonString = JSON.stringify(result, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanName = (fileName || 'requirement_document').replace(/\.[^/.]+$/, '');
  link.href = href;
  link.download = `${cleanName}_analysis.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

export const exportToPDF = (result, fileName) => {
  if (!result) return;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const cleanName = (fileName || 'requirement_document').replace(/\.[^/.]+$/, '');
  
  // Title & Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('AI Requirement Analysis Report', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Document: ${fileName || 'Requirement Document'} | Generated: ${new Date().toLocaleDateString()}`, 14, 27);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 31, 196, 31);

  let y = 40;

  const checkPageBreak = (neededHeight = 10) => {
    if (y + neededHeight > 280) {
      doc.addPage();
      y = 20;
    }
  };

  const addHeading = (titleText) => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text(titleText, 14, y);
    y += 7;
  };

  const addParagraph = (text) => {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, 180);
    lines.forEach((line) => {
      checkPageBreak(6);
      doc.text(line, 14, y);
      y += 5.5;
    });
    y += 2;
  };

  // Executive Summary
  if (result.summary) {
    addHeading('1. Executive Summary');
    addParagraph(result.summary);
  }

  // Acceptance Criteria
  if (result.acceptanceCriteria && result.acceptanceCriteria.length > 0) {
    addHeading('2. Acceptance Criteria');
    result.acceptanceCriteria.forEach((item, idx) => {
      addParagraph(`[✓] ${idx + 1}. ${item}`);
    });
  }

  // Development Tasks
  if (result.tasks && result.tasks.length > 0) {
    addHeading('3. Development Tasks');
    result.tasks.forEach((t) => {
      addParagraph(`• ${t.title} [Complexity: ${t.complexity}]`);
    });
  }

  // Database Schema
  if (result.dbTables && result.dbTables.length > 0) {
    addHeading('4. Database Schema');
    result.dbTables.forEach((t) => {
      addParagraph(`Table: ${t.name}`);
      addParagraph(`  Columns: ${t.columns ? t.columns.join(', ') : 'N/A'}`);
    });
  }

  // APIs
  if (result.apis && result.apis.length > 0) {
    addHeading('5. REST API Endpoints');
    result.apis.forEach((api) => {
      addParagraph(`[${api.method}] ${api.endpoint} - ${api.description}`);
    });
  }

  // Edge Cases
  if (result.edgeCases && result.edgeCases.length > 0) {
    addHeading('6. Identified Edge Cases & Risks');
    result.edgeCases.forEach((ec) => {
      addParagraph(`⚠️ ${ec}`);
    });
  }

  doc.save(`${cleanName}_analysis_report.pdf`);
};
