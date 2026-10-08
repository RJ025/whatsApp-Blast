'use client';

import React, { useState } from 'react';
import { QrCode, RefreshCw, Smartphone, CheckCircle2, AlertCircle, LogOut, ShieldCheck } from 'lucide-react';
import { WAState } from '@/lib/whatsapp';

interface WhatsAppConnectionCardProps {
  waState: WAState;
  onRefresh: () => void;
  onDisconnect: () => void;
}

export const WhatsAppConnectionCard: React.FC<WhatsAppConnectionCardProps> = ({
  waState,
  onRefresh,
  onDisconnect,
}) => {
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    try {
      setLoading(true);
      await fetch('/api/whatsapp/init', { method: 'POST' });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp session?')) return;
    try {
      setLoading(true);
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      onDisconnect();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden relative">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Step 1: WhatsApp Account Link</h2>
            <p className="text-xs text-slate-500">Scan QR code using your WhatsApp mobile app</p>
          </div>
        </div>

        {waState.status === 'CONNECTED' ? (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready to Send</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Not Linked</span>
          </span>
        )}
      </div>

      {waState.status === 'CONNECTED' ? (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-5 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">{waState.userName || 'WhatsApp User'}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-200/80 text-emerald-900">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                +{waState.phoneNumber?.replace(/^(\d{2})(\d{5})(\d{5})$/, '$1 $2 $3') || waState.phoneNumber}
              </p>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-700 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Multi-Device WebSocket connected</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-medium rounded-lg transition shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Session</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              How to Link your WhatsApp:
            </h3>
            <ol className="space-y-2.5 text-xs text-slate-600 list-decimal list-inside pl-1">
              <li>Open <strong>WhatsApp</strong> on your mobile phone</li>
              <li>Tap <strong>Settings</strong> (iOS) or <strong>Three Dots ⋮</strong> (Android)</li>
              <li>Select <strong>Linked Devices</strong></li>
              <li>Tap <strong>Link a Device</strong></li>
              <li>Point your phone camera to this QR code to scan</li>
            </ol>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={handleInit}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{waState.status === 'SCAN_QR' ? 'Regenerate QR' : 'Generate QR Code'}</span>
              </button>
              <button
                onClick={onRefresh}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* QR Code display area */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200/70 min-h-[260px]">
            {waState.status === 'SCAN_QR' && waState.qrCodeUrl ? (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200">
                  <img
                    src={waState.qrCodeUrl}
                    alt="WhatsApp QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
                  QR Code active. Scan now!
                </p>
              </div>
            ) : waState.status === 'CONNECTING' || loading ? (
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-600">Initializing WhatsApp Socket...</p>
                <p className="text-[11px] text-slate-400">Please wait while the QR is generated</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-6 space-y-2">
                <QrCode className="w-14 h-14 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-600">No QR Code active</p>
                <p className="text-[11px] text-slate-400 max-w-[200px]">
                  Click &ldquo;Generate QR Code&rdquo; above to link your phone.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
