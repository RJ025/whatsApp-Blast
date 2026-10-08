'use client';

import React, { useRef } from 'react';
import {
  MessageSquare,
  Image,
  Video,
  FileText,
  Music,
  Paperclip,
  X,
  Eye,
  Smile,
  Tag,
  Info,
} from 'lucide-react';
import { CampaignMedia } from '@/lib/campaign';

interface MessageComposerCardProps {
  messageText: string;
  setMessageText: (text: string) => void;
  media: CampaignMedia | null;
  setMedia: (media: CampaignMedia | null) => void;
  onOpenPreview: () => void;
}

export const MessageComposerCard: React.FC<MessageComposerCardProps> = ({
  messageText,
  setMessageText,
  media,
  setMedia,
  onOpenPreview,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['👋', '🔥', '🎉', '🚀', '📢', '🛒', '🏷️', '🎁', '⭐', '💰', '✅', '🙏'];

  const insertVariable = (variable: string) => {
    setMessageText(`${messageText} ${variable}`);
  };

  const insertEmoji = (emoji: string) => {
    setMessageText(`${messageText}${emoji}`);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // File size check (e.g. 16MB for WhatsApp limit)
    if (file.size > 16 * 1024 * 1024) {
      alert('File size exceeds WhatsApp limit (16 MB). Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      let type: 'image' | 'video' | 'audio' | 'document' = 'document';

      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      setMedia({
        base64,
        mimetype: file.type || 'application/octet-stream',
        fileName: file.name,
        type,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Step 4: Compose Message &amp; Media</h2>
            <p className="text-xs text-slate-500">
              Type your broadcast text and optionally attach photos, videos, or documents
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPreview}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
          title="See how your message will look on WhatsApp"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview Chat</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Variables Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium flex items-center mr-1 text-[11px]">
            <Tag className="w-3 h-3 mr-1 text-slate-400" />
            Personalize:
          </span>
          <button
            onClick={() => insertVariable('{name}')}
            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-mono text-[11px] font-semibold transition"
          >
            + &#123;name&#125;
          </button>
          <button
            onClick={() => insertVariable('{phone}')}
            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-mono text-[11px] font-semibold transition"
          >
            + &#123;phone&#125;
          </button>
          <button
            onClick={() => insertVariable('{number}')}
            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-mono text-[11px] font-semibold transition"
          >
            + &#123;number&#125;
          </button>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={5}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your WhatsApp message here... (e.g. Hello {name}! Check out our special festive discount just for you...)"
            className="w-full text-xs p-3.5 rounded-xl border border-slate-300 focus:outline-emerald-500 focus:border-emerald-500 bg-slate-50/40 font-sans"
          />
          <div className="flex justify-between items-center mt-1 px-1 text-[11px] text-slate-400">
            <span>Supports standard WhatsApp formatting: *bold*, _italic_, ~strikethrough~</span>
            <span>{messageText.length} characters</span>
          </div>
        </div>

        {/* Emoji Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-slate-500 text-[11px] flex items-center mr-1">
            <Smile className="w-3 h-3 mr-1 text-slate-400" />
            Quick Emojis:
          </span>
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              className="p-1 hover:bg-slate-100 rounded text-sm transition"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Media Attachment Box */}
        <div className="pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/3gpp,audio/*,.pdf,.doc,.docx"
            onChange={handleMediaUpload}
            className="hidden"
          />

          {!media ? (
            <div className="border border-dashed border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 text-teal-600">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Attach Media (Photo, Video, PDF, or Audio)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    The message text above will be sent as the media caption.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Attach File</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-white border border-teal-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {media.type === 'image' ? (
                    <img
                      src={`data:${media.mimetype};base64,${media.base64}`}
                      alt="Attached preview"
                      className="w-full h-full object-cover"
                    />
                  ) : media.type === 'video' ? (
                    <Video className="w-6 h-6 text-teal-600" />
                  ) : media.type === 'audio' ? (
                    <Music className="w-6 h-6 text-teal-600" />
                  ) : (
                    <FileText className="w-6 h-6 text-teal-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                      {media.fileName || 'Attached media'}
                    </span>
                    <span className="uppercase text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                      {media.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Will be sent along with caption to all recipients.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeMedia}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
