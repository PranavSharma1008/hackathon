import React from 'react';
import { Sprout, ShieldCheck, Cpu, GitCommit } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              <span>Contract Farming Matchmaker</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Decentralized agritech matching platform optimizing farm-to-factory supply chains with agronomic AI scoring, automated smart agreements, and live milestone delivery verification.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">AI Agronomy & Engine Highlights</h4>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-factor compatibility: Soil, Proximity, Past Yield & Season</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Legally binding automated forward contracts with quality SLAs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supply chain milestone verification with weighbridge auto-fulfillment</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">Enterprise Agtech Platform</h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Equipped with APMC-compliant bilateral contracting, multi-crop procurement (Wheat, Potato, Soybeans), and automated weighbridge escrow fulfillment.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span>🌾 Punjab &amp; North India Agri-Corridor Edition</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>&copy; 2026 Contract Farming Matchmaker. Clean Open Architecture.</div>
          <div className="flex items-center gap-4 font-mono">
            <span>Node 24 + Express + Native SQLite</span>
            <span>&bull;</span>
            <span>React + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
