'use client';

import React from 'react';
import { X, Phone, Video, MoreVertical, CheckCheck, FileText, Music } from 'lucide-react';
import { CampaignMedia } from '@/lib/campaign';

interface WhatsAppPreviewModalProps {
  messageText: string;
  media: CampaignMedia | null;
  onClose: () => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  messageText,
  media,
  onClose,
}) => {
  // Sample rendered text replacing tags
  const sampleRenderedText = (messageText || 'Hello! This is a preview of your WhatsApp message.')
    .replace(/\{name\}/gi, 'Rahul')
    .replace(/\{phone\}/gi, '+91 98765 43210')
    .replace(/\{number\}/gi, '9876543210');

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-300 relative flex flex-col">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 bg-black/40 text-white hover:bg-black/60 rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* WhatsApp App Bar */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-500/50 flex items-center justify-center font-bold text-xs uppercase text-white shadow-xs">
              RS
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Rahul Sharma</p>
              <p className="text-[10px] text-emerald-200">Online</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-emerald-100 pr-8">
            <Video className="w-4 h-4" />
            <Phone className="w-4 h-4" />
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        {/* Chat Background */}
        <div
          className="p-4 flex-1 min-h-[380px] max-h-[480px] overflow-y-auto flex flex-col justify-end"
          style={{
            backgroundColor: '#ECE5DD',
            backgroundImage:
              'radial-gradient(#d3c6b8 1px, transparent 1px), radial-gradient(#d3c6b8 1px, #ECE5DD 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',
          }}
        >
          {/* Outgoing Message Bubble */}
          <div className="self-end max-w-[85%] bg-[#DCF8C6] text-slate-800 rounded-lg rounded-tr-none shadow-xs p-2 text-xs relative space-y-1.5 border border-emerald-200/50">
            {/* Attached Media preview inside bubble */}
            {media && (
              <div className="rounded-md overflow-hidden bg-white/60 mb-1 border border-emerald-200/40">
                {media.type === 'image' ? (
                  <img
                    src={`data:${media.mimetype};base64,${media.base64}`}
                    alt="Preview"
                    className="w-full max-h-48 object-cover rounded-md"
                  />
                ) : media.type === 'video' ? (
                  <div className="p-6 bg-slate-900 text-white flex flex-col items-center justify-center rounded-md">
                    <Video className="w-8 h-8 text-emerald-400 mb-1" />
                    <span className="text-[10px] text-slate-300 font-mono truncate max-w-full">
                      {media.fileName || 'Video Attachment'}
                    </span>
                  </div>
                ) : media.type === 'audio' ? (
                  <div className="p-3 bg-white flex items-center space-x-2 rounded-md">
                    <Music className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-mono truncate text-slate-700">
                      {media.fileName || 'Audio Message'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-white flex items-center space-x-2 rounded-md">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-[11px] font-bold text-slate-800 truncate">
                        {media.fileName || 'Document.pdf'}
                      </p>
                      <p className="text-[10px] text-slate-400">PDF Document</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message text */}
            <p className="whitespace-pre-wrap leading-relaxed text-[12px] break-words">
              {sampleRenderedText}
            </p>

            {/* Timestamp and Read Ticks */}
            <div className="flex items-center justify-end space-x-1 text-[10px] text-slate-500 pt-0.5">
              <span>{now}</span>
              <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500">
            Preview of message as received by client
          </p>
        </div>
      </div>
    </div>
  );
};
