'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Sparkles, Download } from 'lucide-react';
import { ExtractedContact, ExtractionResult } from '@/lib/extractor';

interface FileUploadCardProps {
  onExtractionComplete: (result: ExtractionResult) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  onExtractionComplete,
  isLoading,
  setIsLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; unique: number; duplicates: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (file: File) => {
    setErrorMsg(null);
    setStats(null);
    setUploadedFileName(file.name);

    const validExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Please upload an Excel (.xlsx, .xls, .csv) or PDF (.pdf) file.');
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract numbers from file.');
      }

      setStats({
        total: data.totalFound,
        unique: data.uniqueCount,
        duplicates: data.duplicateCount,
      });

      onExtractionComplete(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  // Helper to load sample test data with 1-click
  const handleLoadSampleContacts = () => {
    const sampleContacts: ExtractedContact[] = [
      {
        id: `cnt_demo_1`,
        raw: '+91 98765 43210',
        clean: '919876543210',
        formatted: '+91 98765 43210',
        name: 'Rahul Sharma',
        source: 'Sample Data',
        existsOnWhatsApp: null,
      },
      {
        id: `cnt_demo_2`,
        raw: '9812345678',
        clean: '919812345678',
        formatted: '+91 98123 45678',
        name: 'Pooja Verma',
        source: 'Sample Data',
        existsOnWhatsApp: null,
      },
      {
        id: `cnt_demo_3`,
        raw: '09988776655',
        clean: '919988776655',
        formatted: '+91 99887 76655',
        name: 'Amit Patel',
        source: 'Sample Data',
        existsOnWhatsApp: null,
      },
    ];

    setUploadedFileName('sample_contacts.xlsx');
    setStats({ total: 3, unique: 3, duplicates: 0 });
    onExtractionComplete({
      contacts: sampleContacts,
      totalFound: 3,
      uniqueCount: 3,
      duplicateCount: 0,
      fileName: 'sample_contacts.xlsx',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Step 2: Auto-Detect Phone Numbers</h2>
            <p className="text-xs text-slate-500">
              Upload Excel (.xlsx, .csv) or PDF document. All Indian phone numbers (+91) will be auto-detected.
            </p>
          </div>
        </div>

        <button
          onClick={handleLoadSampleContacts}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
          title="Populate test numbers to test quickly"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample Data</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.pdf"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex items-center space-x-2 text-slate-400">
          <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200">
            <FileText className="w-6 h-6 text-rose-500" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Click to upload or drag & drop file
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Excel (.xlsx, .xls), CSV (.csv), or PDF document
          </p>
        </div>

        <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white rounded-md border border-slate-200 text-[11px] text-slate-600 font-mono">
          <span>Auto-filters 10-digit Indian numbers starting with 6, 7, 8, 9</span>
        </div>
      </div>

      {/* Status & Results Banner */}
      {isLoading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3 text-xs text-blue-700 animate-pulse">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Scanning document and auto-detecting Indian phone numbers...</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {stats && !isLoading && (
        <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                Extraction Complete: <span className="font-mono text-emerald-800">{uploadedFileName}</span>
              </p>
              <p className="text-[11px] text-slate-600">
                Identified and normalized valid Indian phone numbers.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-medium">
            <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-800 shadow-2xs">
              Total Found: <strong>{stats.total}</strong>
            </span>
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg shadow-2xs font-bold">
              Unique Contacts: <strong>{stats.unique}</strong>
            </span>
            {stats.duplicates > 0 && (
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg shadow-2xs">
                Merged Duplicates: <strong>{stats.duplicates}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
