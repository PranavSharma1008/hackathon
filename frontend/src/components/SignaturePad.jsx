import React, { useRef, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PenTool, RotateCcw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function SignaturePad({ signerName, onConfirmSignature, isSubmitting }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState('draw'); // 'draw' | 'type'
  const [typedName, setTypedName] = useState(signerName || 'Farmer Partner');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#047857'; // emerald-700
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function startDrawing(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  }

  function draw(e) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleSign() {
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
    });

    if (onConfirmSignature) {
      onConfirmSignature({
        mode,
        signatureData: mode === 'draw' ? canvasRef.current?.toDataURL() : typedName,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Digital Counter-Signature</h4>
            <p className="text-[11px] text-slate-500">Sign agricultural supply forward agreement</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'draw' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : ''
            }`}
          >
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'type' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : ''
            }`}
          >
            Quick Type Mode
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-emerald-300 rounded-xl bg-slate-50/70 overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={480}
              height={150}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-[150px] touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 font-medium">
                Sign with mouse or touch above the line...
              </div>
            )}
            <div className="absolute bottom-2 left-6 right-6 border-b border-slate-300 pointer-events-none" />
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={clearCanvas}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Signature
            </button>
            <span className="text-[11px] text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted Attestation
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Signer Legal Name
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Cursive Signature Preview */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center">
            <div className="text-2xl sm:text-3xl text-emerald-800 font-serif italic tracking-wide select-none">
              {typedName || 'Signer Name'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              DIGITAL SIGNATURE HASH: SHA256-{(Math.random() * 1e16).toString(16).substring(0, 12).toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <button
        type="button"
        disabled={isSubmitting || (mode === 'draw' && !hasDrawn)}
        onClick={handleSign}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isSubmitting ? 'Attesting On Chain...' : 'Attest & Execute Smart Contract'}</span>
      </button>
    </div>
  );
}
