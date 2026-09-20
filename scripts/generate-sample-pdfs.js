import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outputDirs = [
  path.resolve('./'), // Root farming folder
  path.resolve('./frontend/public') // Frontend public folder for browser downloads
];

const sampleReports = [
  {
    fileName: 'sample_wheat_quality_report.pdf',
    cropName: 'Sharbati Wheat (Grade A)',
    lotNumber: 'LOT-WHT-2026-09812',
    farmerName: 'Ramesh Kumar / Punjab Grain Growers',
    harvestDate: '15 March 2026',
    testingDate: '18 March 2026',
    labName: 'National Agro Quality & Assay Testing Laboratory (NABL Accredited)',
    labLicense: 'NABL/TC-AGRI/2026/8892',
    inspector: 'Dr. Harvinder Singh, Chief Agricultural Biochemist',
    parameters: [
      { name: 'Moisture Content', value: '10.8%', benchmark: 'Max 12.0%', status: 'PASS - Optimal' },
      { name: 'Crude Protein (Dry Basis)', value: '13.4%', benchmark: 'Min 12.0%', status: 'PASS - Premium' },
      { name: 'Foreign Matter / Inorganic', value: '0.35%', benchmark: 'Max 1.0%', status: 'PASS - Negligible' },
      { name: 'Damaged / Weeviled Grains', value: '0.20%', benchmark: 'Max 1.5%', status: 'PASS - Clear' },
      { name: 'Hectolitre Weight (Test Wt)', value: '79.8 kg/hl', benchmark: 'Min 76.0 kg/hl', status: 'PASS - High Density' },
      { name: 'Pesticide Residue Screen', value: 'Below Detectable Limit', benchmark: 'FSSAI MRL Compliant', status: 'PASS - Clean' },
      { name: 'Aflatoxin B1 / Total', value: '< 2.0 ppb', benchmark: 'Max 15.0 ppb', status: 'PASS - Safe' }
    ],
    overallRating: 'CERTIFIED GRADE A (SUPERIOR QUALITY)',
    procurementRecommendation: 'Approved for direct consumer & corporate industrial contract procurement without discount or deduction.'
  },
  {
    fileName: 'sample_basmati_rice_inspection_report.pdf',
    cropName: 'Basmati Rice (Pusa 1121)',
    lotNumber: 'LOT-RICE-2026-44102',
    farmerName: 'Balwinder Sandhu / Amritsar Agro Growers',
    harvestDate: '20 February 2026',
    testingDate: '24 February 2026',
    labName: 'APEDA Recognized Grain Export & Milling Inspection Center',
    labLicense: 'APEDA/QAC/2026/4102',
    inspector: 'S. K. Verma, Senior Grain Quality Inspector',
    parameters: [
      { name: 'Moisture Content', value: '11.2%', benchmark: 'Max 13.0%', status: 'PASS - Optimal' },
      { name: 'Average Grain Length', value: '8.35 mm', benchmark: 'Min 8.20 mm', status: 'PASS - Extra Long' },
      { name: 'Elongation Ratio (Cooked)', value: '2.4x', benchmark: 'Min 2.0x', status: 'PASS - Exceptional' },
      { name: 'Broken Grains Percentage', value: '0.8%', benchmark: 'Max 2.0%', status: 'PASS - Minimal' },
      { name: 'Chalky Grains', value: '1.2%', benchmark: 'Max 3.0%', status: 'PASS - Clear' },
      { name: 'Aroma Index (2-AP content)', value: 'Strong Standard', benchmark: 'Characteristic 1121', status: 'PASS - Authentic' }
    ],
    overallRating: 'EXPORT GRADE 1 - PREMIUM AGMARK CERTIFIED',
    procurementRecommendation: 'Meets and exceeds commercial rice mill & export requirements. Direct escrow release authorized.'
  },
  {
    fileName: 'sample_maize_assay_certificate.pdf',
    cropName: 'Yellow Corn / Maize (Grade A)',
    lotNumber: 'LOT-MAIZE-2026-77301',
    farmerName: 'Gurpreet Dhillon / Ludhiana Silos',
    harvestDate: '10 March 2026',
    testingDate: '12 March 2026',
    labName: 'Central Feed & Starch Agro Testing Laboratory',
    labLicense: 'CFTRI/AGRI-LAB/2026/194',
    inspector: 'M. P. Rao, Technical Officer',
    parameters: [
      { name: 'Moisture Content', value: '11.5%', benchmark: 'Max 14.0%', status: 'PASS - Dry Safe' },
      { name: 'Starch Content (Dry Basis)', value: '72.4%', benchmark: 'Min 68.0%', status: 'PASS - High Yield' },
      { name: 'Crude Protein', value: '9.2%', benchmark: 'Min 8.5%', status: 'PASS - Standard' },
      { name: 'Aflatoxin (B1+B2+G1+G2)', value: '< 4 ppb', benchmark: 'Max 20 ppb', status: 'PASS - Non-toxic' },
      { name: 'Foreign Organic Matter', value: '0.6%', benchmark: 'Max 1.5%', status: 'PASS - Clean' }
    ],
    overallRating: 'INDUSTRIAL GRADE A - FULLY CERTIFIED',
    procurementRecommendation: 'Optimal starch and feed grade. Ready for direct bulk logistics and factory intake.'
  }
];

function buildPdf(report, targetFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Quality Assay Certificate - ${report.cropName}`,
        Author: report.labName,
        Subject: `Agricultural Inspection Report for ${report.cropName}`,
        Keywords: 'AgriSync, Quality Report, NABL, Crop Inspection, Certificate'
      }
    });

    const stream = fs.createWriteStream(targetFilePath);
    doc.pipe(stream);

    // Outer Border
    doc.rect(20, 20, 555, 802).lineWidth(1.5).strokeColor('#10b981').stroke();
    doc.rect(23, 23, 549, 796).lineWidth(0.5).strokeColor('#047857').stroke();

    // Top Header Banner
    doc.rect(25, 25, 545, 65).fillColor('#064e3b').fill();

    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
       .text('AGRISYNC QUALITY ASSURANCE & LAB ASSAY CERTIFICATE', 35, 38, { align: 'center' });
    doc.fontSize(9).font('Helvetica')
       .text('Standardized Under Model Agricultural Contract Farming & Services Act', 35, 58, { align: 'center' });
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#6ee7b7')
       .text(`Accreditation: ${report.labLicense}  •  ISO 17025 Certified Testing Protocol`, 35, 70, { align: 'center' });

    doc.moveDown(2);

    // Certificate Meta Box
    const metaY = 105;
    doc.roundedRect(35, metaY, 525, 75, 6).fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(1).fillAndStroke();

    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text('COMMODITY / CROP:', 45, metaY + 10);
    doc.font('Helvetica').text(report.cropName, 175, metaY + 10);

    doc.font('Helvetica-Bold').text('SAMPLE / LOT NO:', 45, metaY + 25);
    doc.font('Helvetica').text(report.lotNumber, 175, metaY + 25);

    doc.font('Helvetica-Bold').text('PRODUCER / GROWER:', 45, metaY + 40);
    doc.font('Helvetica').text(report.farmerName, 175, metaY + 40);

    doc.font('Helvetica-Bold').text('TESTING FACILITY:', 45, metaY + 55);
    doc.font('Helvetica').text(report.labName, 175, metaY + 55);

    // Right Column in Meta Box
    doc.font('Helvetica-Bold').text('HARVEST DATE:', 340, metaY + 10);
    doc.font('Helvetica').text(report.harvestDate, 440, metaY + 10);

    doc.font('Helvetica-Bold').text('ASSAY DATE:', 340, metaY + 25);
    doc.font('Helvetica').text(report.testingDate, 440, metaY + 25);

    doc.font('Helvetica-Bold').text('CERTIFICATE ID:', 340, metaY + 40);
    doc.font('Helvetica').fillColor('#047857').text(`CERT-${Date.now().toString().slice(-6)}`, 440, metaY + 40);

    doc.fillColor('#0f172a').font('Helvetica-Bold').text('INSPECTION STATUS:', 340, metaY + 55);
    doc.fillColor('#15803d').text('VERIFIED & PASSED', 460, metaY + 55);

    // Table Header
    const tableY = 195;
    doc.roundedRect(35, tableY, 525, 24, 4).fillColor('#0f766e').fill();

    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('TEST PARAMETER / ASSAY', 45, tableY + 7);
    doc.text('OBSERVED VALUE', 230, tableY + 7);
    doc.text('BENCHMARK STANDARD', 345, tableY + 7);
    doc.text('RESULT STATUS', 465, tableY + 7);

    // Table Rows
    let rowY = tableY + 28;
    report.parameters.forEach((param, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f1f5f9';
      doc.rect(35, rowY - 3, 525, 22).fillColor(bgColor).fill();

      doc.fillColor('#1e293b').fontSize(8.5).font('Helvetica-Bold')
         .text(param.name, 45, rowY + 3);

      doc.font('Helvetica').fillColor('#0f172a')
         .text(param.value, 230, rowY + 3);

      doc.fillColor('#475569')
         .text(param.benchmark, 345, rowY + 3);

      doc.fillColor('#15803d').font('Helvetica-Bold')
         .text(param.status, 465, rowY + 3);

      rowY += 24;
    });

    // Rating Box
    const ratingY = rowY + 15;
    doc.roundedRect(35, ratingY, 525, 60, 6).fillColor('#ecfdf5').strokeColor('#a7f3d0').lineWidth(1.5).fillAndStroke();

    doc.fillColor('#065f46').fontSize(11).font('Helvetica-Bold')
       .text(`OVERALL GRADING: ${report.overallRating}`, 45, ratingY + 12);

    doc.fillColor('#047857').fontSize(8.5).font('Helvetica')
       .text(`Recommendation: ${report.procurementRecommendation}`, 45, ratingY + 30, { width: 505 });

    // Legal Declarations
    const legalY = ratingY + 75;
    doc.roundedRect(35, legalY, 525, 55, 6).fillColor('#f8fafc').strokeColor('#e2e8f0').lineWidth(1).fillAndStroke();

    doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold')
       .text('LEGAL COMPLIANCE & TAMPER-EVIDENT CLAUSE:', 45, legalY + 10);
    doc.font('Helvetica').fillColor('#64748b')
       .text(
         'This laboratory assay certificate is issued in compliance with the Direct Agriculture Marketing norms and national food safety standards (FSSAI). Any alteration, erasure, or unauthorized duplication renders this document null and void. Data cryptographically sealed on AgriSync registry.',
         45, legalY + 22, { width: 505 }
       );

    // Signatures & Seals
    const signY = legalY + 70;

    // Left: Lab Inspector
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold')
       .text('AUTHORIZED ASSAY OFFICER', 60, signY);
    doc.fontSize(8).font('Helvetica').fillColor('#475569')
       .text(report.inspector, 60, signY + 14);
    doc.text('Certified Grain Analyst • Govt. Recognized Lab', 60, signY + 26);
    doc.text('Digitally Signed & Validated: OK', 60, signY + 38);

    // Right: AgriSync Platform Stamp
    doc.roundedRect(360, signY - 5, 190, 55, 4).fillColor('#f0fdf4').strokeColor('#86efac').lineWidth(1).fillAndStroke();
    doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold')
       .text('AGRISYNC PLATFORM VERIFIED', 370, signY + 3);
    doc.fontSize(7.5).font('Helvetica').fillColor('#15803d')
       .text('Direct Farmer-to-Consumer Guarantee', 370, signY + 17);
    doc.text('Hash: SHA256-7892FBA091C34821', 370, signY + 28);
    doc.text(`Timestamp: ${new Date().toISOString()}`, 370, signY + 38);

    // Footer
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
       .text('Generated for AgriSync Contract Farming Platform • Portable Document Format (.pdf)', 35, 785, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(targetFilePath));
    stream.on('error', (err) => reject(err));
  });
}

async function main() {
  console.log('Generating official sample agricultural PDF assay reports...');

  for (const dir of outputDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    for (const report of sampleReports) {
      const filePath = path.join(dir, report.fileName);
      await buildPdf(report, filePath);
      console.log(`✓ Created: ${filePath}`);
    }
  }

  console.log('All sample PDF files generated successfully!');
}

main().catch((err) => {
  console.error('Failed to generate sample PDFs:', err);
  process.exit(1);
});
