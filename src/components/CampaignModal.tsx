'use client';

import React from 'react';
import {
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  X,
} from 'lucide-react';
import { CampaignState } from '@/lib/campaign';

interface CampaignModalProps {
  campaign: CampaignState | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClose: () => void;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  campaign,
  onPause,
  onResume,
  onStop,
  onClose,
}) => {
  if (!campaign) return null;

  const isRunning = campaign.status === 'running';
  const isPaused = campaign.status === 'paused';
  const isFinished = campaign.status === 'completed' || campaign.status === 'stopped';

  // Export CSV Report
  const handleExportReport = () => {
    if (!campaign.logs || campaign.logs.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,Phone Number,Name,Status,Error Reason\r\n';

    campaign.logs.forEach((log) => {
      const row = [
        `"${log.time}"`,
        `"${log.phone}"`,
        `"${log.name || ''}"`,
        `"${log.status}"`,
        `"${log.error || ''}"`,
      ].join(',');
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campaign_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <span
              className={`w-3 h-3 rounded-full ${
                isRunning
                  ? 'bg-emerald-500 animate-ping'
                  : isPaused
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRunning
                  ? 'WhatsApp Campaign in Progress'
                  : isPaused
                  ? 'Campaign Paused'
                  : isFinished
                  ? 'Campaign Finished'
                  : 'Campaign Status'}
              </h2>
              <p className="text-xs text-slate-500">
                Started at {campaign.startTime || 'just now'}
                {campaign.endTime ? ` • Ended at ${campaign.endTime}` : ''}
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

        {/* Progress Overview */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Overall Progress</span>
              <span className="font-mono text-emerald-600">{campaign.progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-full transition-all duration-300"
                style={{ width: `${campaign.progressPercent}%` }}
              />
            </div>
            {campaign.currentRecipient && (
              <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Currently sending to: <strong>+{campaign.currentRecipient}</strong> (
                  {campaign.currentIndex} of {campaign.total})
                </span>
              </p>
            )}
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Queue</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{campaign.total}</p>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase flex items-center justify-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Delivered</span>
              </span>
              <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{campaign.sent}</p>
            </div>
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-center">
              <span className="text-[11px] font-semibold text-rose-700 uppercase flex items-center justify-center space-x-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Failed</span>
              </span>
              <p className="text-xl font-extrabold text-rose-700 mt-0.5">{campaign.failed}</p>
            </div>
          </div>

          {/* Live Activity Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Live Delivery Log ({campaign.logs.length})</span>
              {campaign.logs.length > 0 && (
                <button
                  onClick={handleExportReport}
                  className="flex items-center space-x-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  <Download className="w-3 h-3" />
                  <span>Download CSV</span>
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
              {campaign.logs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Waiting for initial message dispatch...
                </div>
              ) : (
                campaign.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 px-3 text-xs flex items-center justify-between hover:bg-white transition"
                  >
                    <div className="flex items-center space-x-2">
                      {log.status === 'SENT' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-mono font-medium text-slate-800">
                          +{log.phone}
                        </span>
                        {log.name && (
                          <span className="text-slate-500 ml-1.5">({log.name})</span>
                        )}
                        {log.error && (
                          <span className="text-[11px] text-rose-600 block mt-0.5">
                            Error: {log.error}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isRunning && (
              <button
                onClick={onPause}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg transition"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            {isPaused && (
              <button
                onClick={onResume}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            )}

            {(isRunning || isPaused) && (
              <button
                onClick={onStop}
                className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Abort Campaign</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isFinished && (
              <button
                onClick={handleExportReport}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report CSV</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
