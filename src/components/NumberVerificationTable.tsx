'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  UserPlus,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { ExtractedContact } from '@/lib/extractor';
import { WAState } from '@/lib/whatsapp';

interface NumberVerificationTableProps {
  contacts: ExtractedContact[];
  setContacts: React.Dispatch<React.SetStateAction<ExtractedContact[]>>;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  waState: WAState;
}

export const NumberVerificationTable: React.FC<NumberVerificationTableProps> = ({
  contacts,
  setContacts,
  selectedIds,
  setSelectedIds,
  waState,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'wa_only' | 'not_wa' | 'pending'>('all');
  const [isChecking, setIsChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState<{ current: number; total: number } | null>(null);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Filtered contacts based on search and status
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.formatted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clean.includes(searchTerm) ||
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'wa_only') return c.existsOnWhatsApp === true;
    if (statusFilter === 'not_wa') return c.existsOnWhatsApp === false;
    if (statusFilter === 'pending') return c.existsOnWhatsApp === null;
    return true;
  });

  const allSelected =
    filteredContacts.length > 0 && filteredContacts.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allSelected) {
      filteredContacts.forEach((c) => next.delete(c.id));
    } else {
      filteredContacts.forEach((c) => next.add(c.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteOne = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    const next = new Set(selectedIds);
    next.delete(id);
    setSelectedIds(next);
  };

  const handleSelectOnlyWhatsApp = () => {
    const next = new Set<string>();
    contacts.forEach((c) => {
      if (c.existsOnWhatsApp === true) {
        next.add(c.id);
      }
    });
    setSelectedIds(next);
  };

  // Perform WhatsApp Verification Check
  const handleVerifyOnWhatsApp = async () => {
    if (waState.status !== 'CONNECTED') {
      alert('Please connect your WhatsApp in Step 1 first to check numbers.');
      return;
    }

    if (contacts.length === 0) return;

    try {
      setIsChecking(true);
      const phonesToCheck = contacts.map((c) => c.clean);
      setCheckProgress({ current: 0, total: phonesToCheck.length });

      // Call API in batches of 20
      const batchSize = 25;
      const resultMap: Record<string, boolean> = {};

      for (let i = 0; i < phonesToCheck.length; i += batchSize) {
        const batch = phonesToCheck.slice(i, i + batchSize);
        const res = await fetch('/api/whatsapp/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phones: batch }),
        });

        const data = await res.json();
        if (data.results) {
          Object.assign(resultMap, data.results);
        }

        setCheckProgress({
          current: Math.min(i + batch.length, phonesToCheck.length),
          total: phonesToCheck.length,
        });
      }

      // Update contacts status
      setContacts((prev) =>
        prev.map((c) => ({
          ...c,
          existsOnWhatsApp: resultMap[c.clean] !== undefined ? resultMap[c.clean] : c.existsOnWhatsApp,
        }))
      );

      // Auto-select verified numbers
      const verifiedIds = new Set<string>();
      contacts.forEach((c) => {
        if (resultMap[c.clean] === true) {
          verifiedIds.add(c.id);
        }
      });
      if (verifiedIds.size > 0) {
        setSelectedIds(verifiedIds);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error checking numbers on WhatsApp');
    } finally {
      setIsChecking(false);
      setCheckProgress(null);
    }
  };

  const handleAddManualContact = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newNumber.replace(/\D/g, '');
    let finalClean = cleanNum;
    if (cleanNum.length === 10 && /^[6-9]\d{9}$/.test(cleanNum)) {
      finalClean = `91${cleanNum}`;
    } else if (cleanNum.length === 12 && cleanNum.startsWith('91')) {
      finalClean = cleanNum;
    } else {
      alert('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    const tenDigit = finalClean.slice(-10);
    const newContact: ExtractedContact = {
      id: `manual_${Date.now()}`,
      raw: newNumber,
      clean: finalClean,
      formatted: `+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}`,
      name: newName.trim() || undefined,
      source: 'Manual Entry',
      existsOnWhatsApp: null,
    };

    setContacts((prev) => [newContact, ...prev]);
    setSelectedIds((prev) => new Set(prev).add(newContact.id));
    setNewNumber('');
    setNewName('');
    setShowAddModal(false);
  };

  const waCount = contacts.filter((c) => c.existsOnWhatsApp === true).length;
  const notWaCount = contacts.filter((c) => c.existsOnWhatsApp === false).length;
  const pendingCount = contacts.filter((c) => c.existsOnWhatsApp === null).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">
              Step 3: Number Verification &amp; Filter
            </h2>
            <p className="text-xs text-slate-500">
              Check which numbers are registered on WhatsApp before blasting
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Number</span>
          </button>

          <button
            onClick={handleVerifyOnWhatsApp}
            disabled={isChecking || contacts.length === 0}
            className={`flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition ${
              waState.status === 'CONNECTED'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title={waState.status !== 'CONNECTED' ? 'Connect WhatsApp first' : 'Verify WhatsApp registration'}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Verifying...' : 'Check WhatsApp Presence'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar during checking */}
      {isChecking && checkProgress && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex justify-between text-xs font-semibold text-emerald-900">
            <span>Checking numbers with WhatsApp servers...</span>
            <span>
              {checkProgress.current} / {checkProgress.total} (
              {Math.round((checkProgress.current / checkProgress.total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${(checkProgress.current / checkProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats and filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition ${
              statusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({contacts.length})
          </button>
          <button
            onClick={() => setStatusFilter('wa_only')}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
              statusFilter === 'wa_only'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-emerald-700 hover:bg-emerald-100/50'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>On WhatsApp ({waCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('not_wa')}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
              statusFilter === 'not_wa'
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'text-rose-700 hover:bg-rose-100/50'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Not on WA ({notWaCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'text-amber-700 hover:bg-amber-100/50'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pending ({pendingCount})</span>
          </button>
        </div>

        {/* Quick selection helper */}
        {waCount > 0 && (
          <button
            onClick={handleSelectOnlyWhatsApp}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select Only Verified ({waCount})</span>
          </button>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search numbers or names..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 w-48 sm:w-60"
          />
        </div>
      </div>

      {/* Table */}
      {contacts.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
          Upload an Excel or PDF file above to extract phone numbers.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="max-h-[340px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-800">
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Recipient Name</th>
                  <th className="py-2.5 px-3">Indian Phone Number</th>
                  <th className="py-2.5 px-3">WhatsApp Presence</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Source Location</th>
                  <th className="py-2.5 px-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => {
                  const isChecked = selectedIds.has(contact.id);
                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isChecked ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(contact.id)}
                          className="text-slate-400 hover:text-emerald-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {contact.name || <span className="text-slate-400 italic">No Name</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                        {contact.formatted}
                      </td>
                      <td className="py-2.5 px-3">
                        {contact.existsOnWhatsApp === true ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>On WhatsApp</span>
                          </span>
                        ) : contact.existsOnWhatsApp === false ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Not on WhatsApp</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Pending Check</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] hidden md:table-cell truncate max-w-[150px]">
                        {contact.source}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteOne(contact.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Remove contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>
              Showing {filteredContacts.length} of {contacts.length} numbers
            </span>
            <span className="font-semibold text-emerald-700">
              Selected for dispatch: {selectedIds.size} numbers
            </span>
          </div>
        </div>
      )}

      {/* Manual Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Indian Phone Number</h3>
            <form onSubmit={handleAddManualContact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number (10 digits starting with 6-9)
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-r-lg focus:outline-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                >
                  Add Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
