const PDFDocument = require('pdfkit');
const { formatPSTDate } = require('./dateUtils');

/**
 * Generates a professional, premium PDF report from a report snapshot.
 */
exports.generateReportPDF = (report, res) => {
  const doc = new PDFDocument({ 
    margin: 50, 
    size: 'A4',
    info: {
      Title: report.title,
      Author: 'Victoria Tulsidas Law',
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=report-${report.id}.pdf`
  );

  doc.pipe(res);

  // --- Constants & Styling ---
  const primaryColor = '#0B1F3A'; // Deep Navy
  const accentColor = '#38BDF8';  // Sky Blue
  const textGray = '#64748B';     // Slate Gray

  // --- Header ---
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(22).text('VICTORIA TULSIDAS LAW', 50, 45);
  doc.fillColor(textGray).font('Helvetica').fontSize(9).text('AUTOMATED ANALYTICS REPORT', 50, 70);
  
  doc.rect(50, 85, 512, 2).fill(primaryColor);

  // --- Report Overview Section ---
  const metaY = 140;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(18).text(report.title.toUpperCase(), 50, metaY);
  
  doc.rect(50, metaY + 25, 512, 1).fill(accentColor);
  
  doc.moveDown(2);
  const infoY = doc.y;
  
  // Left Column
  doc.fillColor(textGray).font('Helvetica-Bold').fontSize(8).text('REPORT CATEGORY', 50, infoY);
  doc.fillColor('#000000').font('Helvetica').fontSize(11).text(report.category || 'General', 50, infoY + 12);
  
  // Middle Column
  doc.fillColor(textGray).font('Helvetica-Bold').fontSize(8).text('GENERATED ON', 230, infoY);
  doc.fillColor('#000000').font('Helvetica').fontSize(11).text(formatPSTDate(report.created_at), 230, infoY + 12);
  
  // Right Column
  doc.fillColor(textGray).font('Helvetica-Bold').fontSize(8).text('PERIOD COVERED', 410, infoY);
  doc.fillColor('#000000').font('Helvetica').fontSize(11).text(`${formatPSTDate(report.start_date)} - ${formatPSTDate(report.end_date)}`, 410, infoY + 12);

  doc.moveDown(4);

  // --- Metrics Section ---
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text('PERFORMANCE SNAPSHOT');
  doc.moveDown(1);

  const data = report.data || {};
  const metrics = [
    { label: 'Leads Generated', value: data.leads ?? 0, icon: 'L' },
    { label: 'Matters Opened', value: data.matters ?? 0, icon: 'M' },
    { label: 'Revenue (INR)', value: `₹${Number(data.revenue || 0).toLocaleString()}`, icon: 'R' },
    { label: 'Billable Hours', value: `${data.hours || 0}h`, icon: 'H' }
  ];

  // Draw Metrics Boxes
  let currentY = doc.y;
  metrics.forEach((m, i) => {
    const boxWidth = 246;
    const boxHeight = 60;
    const padding = 15;
    const x = i % 2 === 0 ? 50 : 316;
    const y = currentY + (Math.floor(i / 2) * 75);

    doc.roundedRect(x, y, boxWidth, boxHeight, 8)
       .lineWidth(1)
       .strokeColor(borderGray)
       .stroke();

    doc.fillColor(textGray).font('Helvetica-Bold').fontSize(8).text(m.label.toUpperCase(), x + padding, y + padding);
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(16).text(m.value, x + padding, y + padding + 15);
  });

  // --- Footer ---
  const footerTop = 750;
  doc.rect(50, footerTop, 512, 1).fill(borderGray);
  doc.fillColor(textGray).fontSize(8).font('Helvetica-Oblique').text('CONFIDENTIAL FIRM DATA • FOR INTERNAL USE ONLY', 50, footerTop + 15, { align: 'center' });
  doc.fillColor(textGray).fontSize(7).font('Helvetica').text(`Report ID: ${report.id} • Victoria Tulsidas Law Portal`, 50, footerTop + 30, { align: 'center' });

  doc.end();
};
