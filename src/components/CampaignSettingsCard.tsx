'use client';

import React from 'react';
import { Send, Shield, Clock, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CampaignSettings } from '@/lib/campaign';
import { WAState } from '@/lib/whatsapp';

interface CampaignSettingsCardProps {
  settings: CampaignSettings;
  setSettings: React.Dispatch<React.SetStateAction<CampaignSettings>>;
  selectedCount: number;
  waState: WAState;
  hasMessageOrMedia: boolean;
  onLaunch: () => void;
  isLaunching: boolean;
}

export const CampaignSettingsCard: React.FC<CampaignSettingsCardProps> = ({
  settings,
  setSettings,
  selectedCount,
  waState,
  hasMessageOrMedia,
  onLaunch,
  isLaunching,
}) => {
  const isConnected = waState.status === 'CONNECTED';
  const canLaunch = isConnected && selectedCount > 0 && hasMessageOrMedia && !isLaunching;

  // Approximate time calculation: avg delay * count
  const avgDelay = (settings.minDelaySeconds + settings.maxDelaySeconds) / 2;
  const batchPauseTotal =
    Math.floor(selectedCount / settings.batchSize) * settings.batchPauseSeconds;
  const totalSeconds = Math.round(selectedCount * avgDelay + batchPauseTotal);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mb-6">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 text-base">Step 5: Anti-Ban Protection &amp; Dispatch</h2>
          <p className="text-xs text-slate-500">
            Configure randomized delays and batch pauses to keep your WhatsApp account safe
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Anti-spam delay slider */}
        <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Delay Between Messages</span>
            </span>
            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {settings.minDelaySeconds}s – {settings.maxDelaySeconds}s
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            A randomized delay simulates human typing rhythm to bypass automated spam triggers.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Min Delay (sec)
              </label>
              <input
                type="number"
                min={3}
                max={30}
                value={settings.minDelaySeconds}
                onChange={(e) =>
                  setSettings({ ...settings, minDelaySeconds: Math.max(2, parseInt(e.target.value) || 2) })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Max Delay (sec)
              </label>
              <input
                type="number"
                min={4}
                max={60}
                value={settings.maxDelaySeconds}
                onChange={(e) =>
                  setSettings({ ...settings, maxDelaySeconds: Math.max(3, parseInt(e.target.value) || 3) })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Batch settings */}
        <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Batch Cooling Intervals</span>
            </span>
            <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Every {settings.batchSize} msgs
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Periodically pauses dispatch to keep socket activity within safe operational thresholds.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Batch Size (msgs)
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={settings.batchSize}
                onChange={(e) =>
                  setSettings({ ...settings, batchSize: Math.max(5, parseInt(e.target.value) || 5) })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Cooling Pause (sec)
              </label>
              <input
                type="number"
                min={10}
                max={120}
                value={settings.batchPauseSeconds}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    batchPauseSeconds: Math.max(5, parseInt(e.target.value) || 5),
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Banner & Launch CTA */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="text-sm font-bold text-white">Campaign Ready</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-full border border-emerald-500/30">
              {selectedCount} Recipients Selected
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Estimated run duration: ~{minutes > 0 ? `${minutes}m ` : ''}{seconds}s
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {!isConnected ? (
            <div className="text-xs text-rose-300 flex items-center space-x-1.5 bg-rose-950/60 border border-rose-800/80 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Link WhatsApp in Step 1 first</span>
            </div>
          ) : selectedCount === 0 ? (
            <div className="text-xs text-amber-300 flex items-center space-x-1.5 bg-amber-950/60 border border-amber-800/80 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Select numbers in Step 3</span>
            </div>
          ) : !hasMessageOrMedia ? (
            <div className="text-xs text-amber-300 flex items-center space-x-1.5 bg-amber-950/60 border border-amber-800/80 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Enter message or attach media in Step 4</span>
            </div>
          ) : null}

          <button
            onClick={onLaunch}
            disabled={!canLaunch}
            className={`w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition ${
              canLaunch
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-emerald-500/30 cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Send className={`w-4 h-4 ${isLaunching ? 'animate-bounce' : ''}`} />
            <span>{isLaunching ? 'Starting Campaign...' : '🚀 Start WhatsApp Blast'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
