'use client';

import React from 'react';
import { MessageSquareText, ShieldAlert, Wifi, WifiOff, QrCode } from 'lucide-react';
import { WAState } from '@/lib/whatsapp';

interface NavbarProps {
  waState: WAState;
  onOpenAntiBanModal: () => void;
  onOpenConnectModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  waState,
  onOpenAntiBanModal,
  onOpenConnectModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                WhatsBlast
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                India Edition 🇮🇳
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Auto-Extract numbers • Verify WhatsApp presence • Safe bulk broadcast
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAntiBanModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200/80 transition shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Anti-Ban Rules</span>
          </button>

          {/* Connection Pill */}
          <button
            onClick={onOpenConnectModal}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shadow-sm ${
              waState.status === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : waState.status === 'SCAN_QR' || waState.status === 'CONNECTING'
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 animate-pulse'
                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
            }`}
          >
            {waState.status === 'CONNECTED' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>
                  Connected: +{waState.phoneNumber?.replace(/^91/, '91 ')}
                </span>
              </>
            ) : waState.status === 'SCAN_QR' ? (
              <>
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>Scan QR Code</span>
              </>
            ) : waState.status === 'CONNECTING' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rose-600" />
                <span>WhatsApp Disconnected</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
