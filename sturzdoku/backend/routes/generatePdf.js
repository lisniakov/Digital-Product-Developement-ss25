// backend/routes/generatePdf.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

router.post('/pdf', async (req, res) => {
  const { residentId, reportText } = req.body;

  if (!residentId || !reportText) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const filename = `fall_report_${residentId}_${Date.now()}.pdf`;
    
    // Fix: Create reports directory in backend/public/reports
    const reportsDir = path.join(__dirname, '../public/reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filepath = path.join(reportsDir, filename);
    const doc = new PDFDocument();

    // Create write stream
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // Add content to PDF
    doc.fontSize(20).text('Fall Incident Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Resident ID: ${residentId}`, { align: 'left' });
    doc.moveDown();
    doc.fontSize(12).text(reportText, { align: 'left' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    
    doc.end();

    // Wait for PDF to be fully written
    writeStream.on('finish', () => {
      const publicUrl = `/reports/${filename}`;
      console.log(`PDF created successfully: ${filepath}`);
      res.json({ url: publicUrl, filename });
    });

    writeStream.on('error', (err) => {
      console.error('Error writing PDF:', err);
      res.status(500).json({ error: 'Failed to write PDF file' });
    });

  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;