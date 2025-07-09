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
  const { residentId, reportText, resident, placeOfFall, condition, vitals, aidsPresent, injuries, firstAid } = req.body;

  if (!residentId || !reportText) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    // Debug logging
    console.log('PDF Generation Debug:');
    console.log('residentId:', residentId);
    console.log('resident object:', resident);
    console.log('resident?.name:', resident?.name);
    console.log('resident?.id:', resident?.id);

    const filename = `fall_report_${residentId}_${Date.now()}.pdf`;
    
    // Create reports directory in backend/public/reports
    const reportsDir = path.join(__dirname, '../public/reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filepath = path.join(reportsDir, filename);
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 30,
      bufferPages: true
    });

    // Create write stream
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // Helper functions
    const drawBox = (x, y, width, height, fillColor = null) => {
      doc.save();
      if (fillColor) {
        doc.rect(x, y, width, height).fillAndStroke(fillColor, 'black');
      } else {
        doc.rect(x, y, width, height).stroke();
      }
      doc.restore();
    };

    const drawCircledNumber = (x, y, number, radius = 10) => {
      doc.save();
      doc.circle(x, y, radius).stroke();
      doc.fontSize(10).fillColor('black').text(number.toString(), x - 3, y - 5);
      doc.restore();
    };

    const addFormField = (label, value = '', x, y, width = 200, height = 18) => {
      doc.save();
      doc.fontSize(8).fillColor('black').text(label, x, y);
      drawBox(x, y + 12, width, height);
      if (value) {
        doc.fontSize(8).fillColor('black').text(value, x + 3, y + 15, { width: width - 6 });
      }
      doc.restore();
      return y + 12 + height + 5; // Return next Y position
    };

    const addTextBox = (title, content, x, y, width, height, circleNumber = null) => {
      doc.save();
      let titleY = y;
      
      if (circleNumber) {
        drawCircledNumber(x + 10, y + 10, circleNumber);
        doc.fontSize(10).fillColor('black').text(title, x + 30, y + 5);
      } else {
        doc.fontSize(10).fillColor('black').text(title, x, y);
      }
      
      let boxY = y + 20;
      drawBox(x, boxY, width, height);
      doc.fontSize(8).fillColor('black').text(content, x + 5, boxY + 5, { 
        width: width - 10,
        height: height - 10
      });
      doc.restore();
      return boxY + height + 10; // Return next Y position
    };

    // Page dimensions
    const pageWidth = doc.page.width;
    const margin = 30;
    const contentWidth = pageWidth - 2 * margin;
    
    // Header with gray background
    drawBox(margin, margin, contentWidth, 35, '#f0f0f0');
    
    // Title
    doc.save();
    doc.fontSize(16)
       .fillColor('black')
       .text('Fall Incident Report Form', margin + 20, margin + 15, { 
         width: contentWidth - 40, 
         align: 'center' 
       });
    doc.restore();

    let currentY = margin + 45;

    // Basic Information Section (2 columns)
    const leftColumnWidth = (contentWidth - 20) / 2;
    const rightColumnWidth = (contentWidth - 20) / 2;
    const rightColumnX = margin + leftColumnWidth + 20;

    // Left column - track Y position
    let leftY = currentY;
    leftY = addFormField('Incident Date & Time:', new Date().toLocaleString(), margin, leftY, leftColumnWidth, 18);
    leftY = addFormField('Business Name & Address:', 'Care Facility Name', margin, leftY, leftColumnWidth, 18);
    leftY = addFormField('Location of Fall:', placeOfFall?.label || 'Not specified', margin, leftY, leftColumnWidth, 18);

    // Right column - track Y position
    let rightY = currentY;
    rightY = addFormField('Report Date:', new Date().toLocaleDateString(), rightColumnX, rightY, rightColumnWidth, 18);
    rightY = addFormField('Staff Notified:', 'Nursing Staff', rightColumnX, rightY, rightColumnWidth, 18);
    let displayName = '';
    if (resident?.name && resident.name.trim()) {
        displayName = `${resident.name} (ID: ${residentId})`;
    } else {
        displayName = `ID: ${residentId}`;
    }

    rightY = addFormField('Resident Name/ID:', displayName, rightColumnX, rightY, rightColumnWidth, 18);

    // Use the maximum Y position from both columns
    currentY = Math.max(leftY, rightY) + 10;

    // Section 1: Description of Incident
    currentY = addTextBox('Description of Incident:', reportText, margin, currentY, contentWidth, 60, 1);

    // Section 2: Description of Injuries
    const injuryText = injuries && injuries.length > 0 
      ? `Injuries: ${injuries.map(injury => injury.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ')}`
      : 'No visible injuries found.';
    
    currentY = addTextBox('Description of Injuries:', injuryText, margin, currentY, contentWidth, 45, 2);

    // Section 3: Treatment
    const treatmentText = firstAid && firstAid.length > 0
      ? `Treatment: ${firstAid.map(aid => aid.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ')}`
      : 'Basic first aid by nursing staff.';
    
    currentY = addTextBox('Treatment Given:', treatmentText, margin, currentY, contentWidth, 45, 3);

    // Section 4: Vital Signs
    const vitalsText = vitals 
      ? `BP: ${vitals.bloodPressure?.systolic || 'N/A'}/${vitals.bloodPressure?.diastolic || 'N/A'} mmHg, ` +
        `BS: ${vitals.glucoseLevel || 'N/A'} mg/dL, ` +
        `Temp: ${vitals.temperature?.toFixed(1) || 'N/A'} °C, ` +
        `O2: ${vitals.oxygenLevel || 'N/A'}%`
      : 'Vital signs not recorded';
    
    currentY = addTextBox('Vital Signs:', vitalsText, margin, currentY, contentWidth, 45, 4);

    // Additional Information in 2 columns
    const infoColumnWidth = (contentWidth - 20) / 2;
    
    // Mobility Aids (left column)
    const aidsText = aidsPresent && aidsPresent.length > 0
      ? aidsPresent.map(aid => aid.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ')
      : 'None noted';
    
    let leftInfoY = addTextBox('Mobility Aids Present:', aidsText, margin, currentY, infoColumnWidth, 35);

    // Witnesses (right column)
    let rightInfoY = addTextBox('Witnesses:', 'Nursing staff on duty', rightColumnX, currentY, infoColumnWidth, 35);
    
    currentY = Math.max(leftInfoY, rightInfoY) + 10;

    // Signature section at bottom
    const bottomY = doc.page.height - 80;
    const signatureWidth = (contentWidth - 40) / 2;
    const signatureY = bottomY;
    
    doc.save();
    doc.fontSize(9).fillColor('black').text('Staff Signature:', margin, signatureY);
    drawBox(margin, signatureY + 15, signatureWidth, 25);
    
    doc.fontSize(9).text('Date:', margin + signatureWidth + 40, signatureY);
    drawBox(margin + signatureWidth + 40, signatureY + 15, signatureWidth, 25);
    doc.fontSize(8).text(new Date().toLocaleDateString(), margin + signatureWidth + 45, signatureY + 25);
    doc.restore();

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