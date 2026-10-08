'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, Users, FileCheck, X } from 'lucide-react';

interface AntiBanGuideModalProps {
  onClose: () => void;
}

export const AntiBanGuideModal: React.FC<AntiBanGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                WhatsApp Anti-Ban Best Practices
              </h2>
              <p className="text-xs text-amber-800">
                Essential rules to prevent WhatsApp account temporary or permanent bans
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 text-xs">Why does WhatsApp ban numbers?</p>
              <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                WhatsApp automated algorithms flag accounts when recipients click &ldquo;Report &amp; Block&rdquo;, or when thousands of identical messages are dispatched within a few seconds without natural human delays.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>1. Use Random Delays</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Always set a 5–15 second random delay between messages. Never send hundreds of messages in 1 second.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>2. Warm-Up New Numbers</span>
              </div>
              <p className="text-[11px] text-slate-500">
                For brand new SIM cards: Day 1 (20 msgs), Day 2 (50 msgs), Day 3 (100 msgs). Gradually build trust.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>3. Personalize Every Text</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Use &#123;name&#125; tag! When every message has a unique recipient name, spam filters don&apos;t detect identical blasts.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>4. Add Opt-Out Footer</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Add <em>&ldquo;Reply STOP to unsubscribe&rdquo;</em> at the end. This prevents users from clicking &ldquo;Report as Spam&rdquo;.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition"
          >
            I Understand, Keep Account Safe
          </button>
        </div>
      </div>
    </div>
  );
};
