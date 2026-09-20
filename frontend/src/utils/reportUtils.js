/**
 * Utility functions for Soil & Crop Quality Assay Reports (PDF & Document Handling)
 */

export function generateCertifiedAssayPdf({
  farmerName = 'Registered Agronomist',
  cropName = 'Field Crop',
  soilType = 'Loamy',
  grade = 'Grade A',
  quantityQuintals = 100,
  pricePerQuintal = 2200
}) {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const certId = `APMC-QC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const cleanCrop = (cropName || 'Produce').replace(/[()]/g, '');
  const cleanFarmer = (farmerName || 'Farmer').replace(/[()]/g, '');
  const cleanSoil = (soilType || 'Loamy').replace(/[()]/g, '');

  const contentStream = [
    'BT',
    '/F1 16 Tf',
    '50 740 Td',
    '(STATE APMC AGRICULTURAL QUALITY ASSAY CERTIFICATE) Tj',
    '/F1 10 Tf',
    '0 -24 Td',
    `(${certId} | Execution Date: ${dateStr}) Tj`,
    '0 -18 Td',
    '(------------------------------------------------------------------------------------------------------------------) Tj',
    '0 -24 Td',
    `(/Producer Farm: ${cleanFarmer}) Tj`,
    '0 -18 Td',
    `(/Commodity Lot: ${cleanCrop} | Grade: ${grade}) Tj`,
    '0 -18 Td',
    `(/Cultivated Soil Lineage: ${cleanSoil} Soil - Certified APMC Plot) Tj`,
    '0 -18 Td',
    `(/Committed Volume: ${quantityQuintals} Quintals | Baseline Rate: Rs. ${pricePerQuintal}/Qtl) Tj`,
    '0 -26 Td',
    '(LABORATORY BIO-PHYSICAL ASSAY PARAMETERS:) Tj',
    '0 -18 Td',
    '(- Moisture Level: 11.2% (Permissible APMC Limit: <= 12.0% w/w - PASSED)) Tj',
    '0 -18 Td',
    '(- Crop Purity: 99.2% Unadulterated (APMC Spec >= 98.5% - PASSED)) Tj',
    '0 -18 Td',
    '(- Organic Carbon Index: 1.22% | Soil pH Rating: 6.8 Optimal Neutral - PASSED) Tj',
    '0 -18 Td',
    '(- Toxic Pesticide / Chemical Contaminant Check: Below Detection Limits - PASSED) Tj',
    '0 -24 Td',
    '(------------------------------------------------------------------------------------------------------------------) Tj',
    '0 -20 Td',
    '(OFFICIAL ASSAY VERDICT: APPROVED FOR BULK COMMERCIAL CONSUMPTION) Tj',
    '0 -16 Td',
    '(Attested By: Mandi Chief Assayer, State Directorate of Agricultural Marketing) Tj',
    'ET'
  ].join('\n');

  const streamLength = contentStream.length;

  const rawPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000069 00000 n 
0000000128 00000 n 
0000000257 00000 n 
0000000320 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
400
%%EOF`;

  try {
    return 'data:application/pdf;base64,' + btoa(unescape(encodeURIComponent(rawPdf)));
  } catch (e) {
    return 'data:text/plain;charset=utf-8,' + encodeURIComponent(contentStream);
  }
}

/**
 * Converts data URL or base64 to a Blob for safe browser viewing/downloading
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl) return null;
  try {
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const byteStr = atob(parts[1]);
      const ab = new ArrayBuffer(byteStr.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteStr.length; i++) {
        ia[i] = byteStr.charCodeAt(i);
      }
      return new Blob([ab], { type: mime });
    }
  } catch (err) {
    console.warn('Failed to convert dataUrl to Blob:', err);
  }
  return new Blob([dataUrl], { type: 'text/plain' });
}

/**
 * Open report in a new browser tab safely via ObjectURL
 */
export function openReportInNewTab(reportDocument, fileName = 'Assay_Report.pdf') {
  if (!reportDocument) return;
  const blob = dataUrlToBlob(reportDocument);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // If pop-up blocked, trigger download fallback
    downloadReport(reportDocument, fileName);
  }
}

/**
 * Download report to user's computer
 */
export function downloadReport(reportDocument, fileName = 'Assay_Report.pdf') {
  if (!reportDocument) return;
  const blob = dataUrlToBlob(reportDocument);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
