'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { WhatsAppConnectionCard } from '@/components/WhatsAppConnectionCard';
import { FileUploadCard } from '@/components/FileUploadCard';
import { NumberVerificationTable } from '@/components/NumberVerificationTable';
import { MessageComposerCard } from '@/components/MessageComposerCard';
import { CampaignSettingsCard } from '@/components/CampaignSettingsCard';
import { CampaignModal } from '@/components/CampaignModal';
import { WhatsAppPreviewModal } from '@/components/WhatsAppPreviewModal';
import { AntiBanGuideModal } from '@/components/AntiBanGuideModal';

import { WAState } from '@/lib/whatsapp';
import { ExtractedContact, ExtractionResult } from '@/lib/extractor';
import { CampaignState, CampaignSettings, CampaignMedia } from '@/lib/campaign';

export default function HomePage() {
  // WhatsApp Session State
  const [waState, setWaState] = useState<WAState>({
    status: 'DISCONNECTED',
    qrCodeUrl: null,
    phoneNumber: null,
    userName: null,
    error: null,
  });

  // Contacts and Extraction State
  const [contacts, setContacts] = useState<ExtractedContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFileLoading, setIsFileLoading] = useState(false);

  // Message & Media State
  const [messageText, setMessageText] = useState(
    'Hi {name}! 🎉 Exclusive festival deals are here.\nCheck out our latest collection and enjoy special savings.\n\nReply YES to learn more or STOP to unsubscribe.'
  );
  const [media, setMedia] = useState<CampaignMedia | null>(null);

  // Campaign Dispatch & Safety Settings
  const [settings, setSettings] = useState<CampaignSettings>({
    minDelaySeconds: 5,
    maxDelaySeconds: 10,
    batchSize: 20,
    batchPauseSeconds: 25,
  });

  const [campaign, setCampaign] = useState<CampaignState | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAntiBanModal, setShowAntiBanModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const connectionRef = useRef<HTMLDivElement>(null);

  // Poll WhatsApp Status
  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setWaState(data);
      }
    } catch (e) {
      console.error('Failed to poll WhatsApp status:', e);
    }
  };

  // Poll Campaign Status
  const fetchCampaignStatus = async () => {
    try {
      const res = await fetch('/api/campaign/status');
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch (e) {
      console.error('Failed to poll campaign status:', e);
    }
  };

  // Initial WhatsApp status check and interval polling for QR scan
  useEffect(() => {
    fetchWhatsAppStatus();

    const interval = setInterval(() => {
      fetchWhatsAppStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Poll Campaign status more frequently when active
  useEffect(() => {
    if (campaign?.status === 'running' || campaign?.status === 'paused') {
      const interval = setInterval(() => {
        fetchCampaignStatus();
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [campaign?.status]);

  // Handle file extraction callback
  const handleExtractionComplete = (result: ExtractionResult) => {
    setContacts(result.contacts);
    // Select all valid numbers by default
    const allIds = new Set(result.contacts.map((c) => c.id));
    setSelectedIds(allIds);
  };

  // Start Mass Blast Campaign
  const handleLaunchCampaign = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one recipient number.');
      return;
    }

    if (!messageText.trim() && !media) {
      alert('Please enter a message or attach media.');
      return;
    }

    const selectedRecipients = contacts
      .filter((c) => selectedIds.has(c.id))
      .map((c) => ({
        phone: c.clean,
        name: c.name || '',
      }));

    try {
      setIsLaunching(true);
      const res = await fetch('/api/campaign/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedRecipients,
          messageTemplate: messageText,
          media,
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start campaign');
      }

      setCampaign(data.campaign);
      setShowCampaignModal(true);
    } catch (e: any) {
      alert(e.message || 'Error launching campaign');
    } finally {
      setIsLaunching(false);
    }
  };

  // Campaign controls
  const handleCampaignControl = async (action: 'pause' | 'resume' | 'stop') => {
    try {
      const res = await fetch('/api/campaign/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.campaign) {
        setCampaign(data.campaign);
      }
    } catch (e) {
      console.error(`Error sending ${action}:`, e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        waState={waState}
        onOpenAntiBanModal={() => setShowAntiBanModal(true)}
        onOpenConnectModal={() => {
          connectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 w-full">
        {/* Intro Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-emerald-100 mb-3 backdrop-blur-xs">
              Direct Multi-Device WhatsApp Sender
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bulk WhatsApp Marketing for India 🇮🇳
            </h1>
            <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
              Auto-detect Indian phone numbers from Excel spreadsheets or PDF documents, verify their active WhatsApp presence, and safely send custom text and media campaigns.
            </p>
          </div>
        </div>

        {/* Step 1: Connect WhatsApp */}
        <div ref={connectionRef}>
          <WhatsAppConnectionCard
            waState={waState}
            onRefresh={fetchWhatsAppStatus}
            onDisconnect={() => {
              fetchWhatsAppStatus();
            }}
          />
        </div>

        {/* Step 2: Auto-Detect Phone Numbers from File */}
        <FileUploadCard
          onExtractionComplete={handleExtractionComplete}
          isLoading={isFileLoading}
          setIsLoading={setIsFileLoading}
        />

        {/* Step 3: Verified Numbers Table */}
        <NumberVerificationTable
          contacts={contacts}
          setContacts={setContacts}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          waState={waState}
        />

        {/* Step 4: Message & Media Composer */}
        <MessageComposerCard
          messageText={messageText}
          setMessageText={setMessageText}
          media={media}
          setMedia={setMedia}
          onOpenPreview={() => setShowPreviewModal(true)}
        />

        {/* Step 5: Anti-Ban Settings & Campaign Launch */}
        <CampaignSettingsCard
          settings={settings}
          setSettings={setSettings}
          selectedCount={selectedIds.size}
          waState={waState}
          hasMessageOrMedia={!!(messageText.trim() || media)}
          onLaunch={handleLaunchCampaign}
          isLaunching={isLaunching}
        />
      </main>

      {/* Modals */}
      {showCampaignModal && (
        <CampaignModal
          campaign={campaign}
          onPause={() => handleCampaignControl('pause')}
          onResume={() => handleCampaignControl('resume')}
          onStop={() => handleCampaignControl('stop')}
          onClose={() => setShowCampaignModal(false)}
        />
      )}

      {showPreviewModal && (
        <WhatsAppPreviewModal
          messageText={messageText}
          media={media}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showAntiBanModal && (
        <AntiBanGuideModal onClose={() => setShowAntiBanModal(false)} />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <p>WhatsBlast India Edition • Designed for safe WhatsApp marketing and outreach.</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Always adhere to WhatsApp Terms of Service and Anti-Spam Guidelines.
        </p>
      </footer>
    </div>
  );
}
