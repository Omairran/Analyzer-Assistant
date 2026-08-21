import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const cleanName = (fileName || 'requirement_document').replace(/\.[^/.]+$/, '');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = 18;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate dark background
  doc.rect(0, 0, pageWidth, 32, 'F');

  // App & Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('AI REQUIREMENT ANALYSIS REPORT', margin, 15);

  // Metadata Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  const formattedDate = new Date().toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  doc.text(`Document: ${fileName || 'Requirement Document'}   |   Generated: ${formattedDate}`, margin, 24);

  y = 42;

  const checkSpace = (neededHeight) => {
    if (y + neededHeight > 275) {
      doc.addPage();
      y = 20;
    }
  };

  const addSectionTitle = (titleText) => {
    checkSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229); // Primary Indigo
    doc.text(titleText, margin, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 8;
  };

  // 1. Executive Summary
  if (result.summary) {
    addSectionTitle('1. Executive Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    
    const summaryLines = doc.splitTextToSize(result.summary, contentWidth);
    summaryLines.forEach((line) => {
      checkSpace(6);
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  }

  // 2. Acceptance Criteria
  if (result.acceptanceCriteria && result.acceptanceCriteria.length > 0) {
    addSectionTitle('2. Acceptance Criteria');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    result.acceptanceCriteria.forEach((item, idx) => {
      const text = `[✓]  ${idx + 1}.  ${item}`;
      const lines = doc.splitTextToSize(text, contentWidth - 4);
      lines.forEach((line) => {
        checkSpace(5.5);
        doc.text(line, margin + 2, y);
        y += 5;
      });
      y += 1.5;
    });
    y += 4;
  }

  // 3. Development Tasks Table
  if (result.tasks && result.tasks.length > 0) {
    addSectionTitle('3. Generated Development Tasks');
    
    const tableBody = result.tasks.map((t, index) => [
      `${index + 1}. ${t.title}`,
      t.complexity || 'Medium'
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Task Description', 'Complexity']],
      body: tableBody,
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9.5 },
      bodyStyles: { textColor: [51, 65, 85], fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35, fontStyle: 'bold', halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const val = String(data.cell.raw).toLowerCase();
          if (val === 'high') data.cell.styles.textColor = [225, 29, 72]; // red
          else if (val === 'medium') data.cell.styles.textColor = [217, 119, 6]; // amber
          else if (val === 'low') data.cell.styles.textColor = [16, 185, 129]; // green
        }
      },
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // 4. Database Schema Table
  if (result.dbTables && result.dbTables.length > 0) {
    addSectionTitle('4. Suggested Database Schema');
    
    const tableBody = result.dbTables.map((t) => [
      t.name,
      Array.isArray(t.columns) ? t.columns.join(', ') : (t.columns || 'N/A')
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Table Name', 'Columns & Attributes']],
      body: tableBody,
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9.5 },
      bodyStyles: { textColor: [51, 65, 85], fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      },
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // 5. REST API Endpoints Table
  if (result.apis && result.apis.length > 0) {
    addSectionTitle('5. REST API Endpoints');

    const tableBody = result.apis.map((api) => [
      api.method || 'GET',
      api.endpoint || '/',
      api.description || ''
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Method', 'Endpoint Path', 'Description']],
      body: tableBody,
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9.5 },
      bodyStyles: { textColor: [51, 65, 85], fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 55, fontStyle: 'bold' },
        2: { cellWidth: 'auto' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const method = String(data.cell.raw).toUpperCase();
          if (method === 'POST') data.cell.styles.textColor = [16, 185, 129];
          else if (method === 'GET') data.cell.styles.textColor = [37, 99, 235];
          else if (method === 'PUT' || method === 'PATCH') data.cell.styles.textColor = [217, 119, 6];
          else if (method === 'DELETE') data.cell.styles.textColor = [225, 29, 72];
        }
      },
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // 6. Edge Cases & Risks
  if (result.edgeCases && result.edgeCases.length > 0) {
    addSectionTitle('6. Identified Edge Cases & Risks');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9); // Warning amber dark

    result.edgeCases.forEach((ec) => {
      const text = `⚠️  ${ec}`;
      const lines = doc.splitTextToSize(text, contentWidth - 4);
      lines.forEach((line) => {
        checkSpace(5.5);
        doc.text(line, margin + 2, y);
        y += 5;
      });
      y += 1.5;
    });
  }

  // Add Page Numbers Footer to all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`AI Requirement Analyzer  |  Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`${cleanName}_analysis_report.pdf`);
};
