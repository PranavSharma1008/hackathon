import React, { useMemo } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  X,
  ShieldCheck,
  Award,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { dataUrlToBlob, openReportInNewTab, downloadReport } from '../utils/reportUtils';

export default function ReportViewerModal({ item, onClose }) {
  if (!item) return null;

  const fileName = item.report_file_name || `${item.crop_name || 'Commodity'}_Assay_Report.pdf`;
  const reportDoc = item.report_document;

  const blobUrl = useMemo(() => {
    if (!reportDoc) return null;
    const blob = dataUrlToBlob(reportDoc);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }, [reportDoc]);

  const isPdf = Boolean(
    reportDoc && (
      reportDoc.includes('application/pdf') ||
      reportDoc.startsWith('JVBERi0x') ||
      fileName.toLowerCase().endsWith('.pdf')
    )
  );

  const isImage = Boolean(
    reportDoc && (
      reportDoc.startsWith('data:image/') ||
      fileName.match(/\.(png|jpg|jpeg|webp)$/i)
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Soil &amp; Crop Quality Assay Report
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-bold border border-emerald-400/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> APMC Certified
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {item.crop_name} &bull; {item.farmer_name ? `Farm: ${item.farmer_name}` : 'Verified Farm Lot'} &bull; Soil: {item.soil_type || 'Loamy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openReportInNewTab(reportDoc, fileName)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </button>
            <button
              type="button"
              onClick={() => downloadReport(reportDoc, fileName)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-xl font-bold cursor-pointer transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Meta Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-slate-700">File:</strong> {fileName}
            </span>
            <span>
              <strong className="text-slate-700">Lot Grade:</strong> {item.grade || 'Grade A'}
            </span>
            <span>
              <strong className="text-slate-700">Cultivated Soil:</strong> {item.soil_type || 'Loamy'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Agronomic Lineage
          </div>
        </div>

        {/* Document Viewer Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto bg-slate-100 flex items-center justify-center min-h-[380px]">
          {isPdf && blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-[520px] rounded-xl border border-slate-300 shadow-inner bg-white"
              title="Quality Assay PDF Preview"
            />
          ) : isImage ? (
            <div className="w-full flex items-center justify-center p-4 bg-white rounded-xl border border-slate-300 shadow-inner">
              <img
                src={reportDoc}
                alt="Soil & Quality Assay Report"
                className="max-h-[500px] object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : reportDoc ? (
            <div className="w-full h-[500px] p-6 bg-white rounded-xl border border-slate-300 font-mono text-xs overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {reportDoc.startsWith('data:') ? (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-sans text-sm text-slate-700 font-bold mb-1">
                    Document ready for inspection
                  </p>
                  <p className="font-sans text-xs text-slate-500 mb-4">
                    {fileName} ({Math.round(reportDoc.length / 1024)} KB)
                  </p>
                  <button
                    type="button"
                    onClick={() => openReportInNewTab(reportDoc, fileName)}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Document in Browser Viewer
                  </button>
                </div>
              ) : (
                reportDoc
              )}
            </div>
          ) : (
            <div className="text-center p-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No report file found for this lot.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Assayed under Indian Agricultural Marketing &amp; Contract Farming Standards</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
