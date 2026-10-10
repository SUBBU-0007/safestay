import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, XCircle, CheckCircle2, Clock, Plus, ChevronDown, ChevronUp, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { RumorNotice } from '../../../shared/types.js';

interface RumorBoardProps {
  rumors: RumorNotice[];
  onRefreshData?: () => void;
}

export const RumorBoard: React.FC<RumorBoardProps> = ({ rumors, onRefreshData }) => {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'debunked' | 'verified'>('all');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [claimTitle, setClaimTitle] = useState('');
  const [claimContent, setClaimContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const filteredRumors = rumors.filter((r) => {
    if (filter === 'debunked') return r.status === 'debunked';
    if (filter === 'verified') return r.status === 'verified';
    return true;
  });

  const debunkedCount = rumors.filter((r) => r.status === 'debunked').length;
  const verifiedCount = rumors.filter((r) => r.status === 'verified').length;

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTitle.trim() || !claimContent.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/rumors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Reported Claim: ${claimTitle.trim()}`,
          content: `[UNDER OFFICIAL VERIFICATION]: ${claimContent.trim()} (Investigation initiated by District Fact-Check Cell)`,
          status: 'debunked',
          source: 'Citizen Telemetry • Pending SDMA Review'
        })
      });

      if (res.ok) {
        setFeedbackMsg({ text: 'Claim submitted successfully to SDMA Fact-Check cell for investigation.' });
        setClaimTitle('');
        setClaimContent('');
        setShowSubmitForm(false);
        if (onRefreshData) onRefreshData();
      } else {
        setFeedbackMsg({ text: 'Failed to submit claim. Please try again.', isError: true });
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ text: 'Network error submitting claim.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRumorStatus = async (rumor: RumorNotice) => {
    setIsUpdatingStatus(true);
    setFeedbackMsg(null);
    const nextStatus = rumor.status === 'debunked' ? 'verified' : 'debunked';
    try {
      const res = await fetch(`/api/rumors/${rumor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        setFeedbackMsg({ text: `Notice updated to: ${nextStatus.toUpperCase()}` });
        if (onRefreshData) onRefreshData();
      } else {
        setFeedbackMsg({ text: 'Failed to update rumor status.', isError: true });
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ text: 'Error connecting to verification server.', isError: true });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="glass-panel border border-teal-border rounded-3xl p-5 sm:p-6 shadow-2xl text-cream space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-muted border border-accent/40 rounded-xl text-accent">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-light text-white tracking-wide leading-tight">{t('rumorControl')}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40 font-bold">
                {rumors.length} Monitored
              </span>
            </div>
            <p className="text-xs text-cream-subtle font-mono">
              Official fact-check verification combating unverified panic broadcasts
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="px-3 py-1.5 glass-card hover:bg-teal-muted text-accent border border-teal-border rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showSubmitForm ? 'Cancel' : 'Report Claim for Review'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 font-mono text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg border transition-colors ${
            filter === 'all'
              ? 'bg-accent/20 text-accent border-accent/50 font-bold'
              : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
          }`}
        >
          All ({rumors.length})
        </button>
        <button
          onClick={() => setFilter('debunked')}
          className={`px-2.5 py-1 rounded-lg border transition-colors ${
            filter === 'debunked'
              ? 'bg-danger/20 text-danger border-danger/50 font-bold'
              : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
          }`}
        >
          Debunked ({debunkedCount})
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`px-2.5 py-1 rounded-lg border transition-colors ${
            filter === 'verified'
              ? 'bg-safe/20 text-safe border-safe/50 font-bold'
              : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
          }`}
        >
          Verified Facts ({verifiedCount})
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className={`p-3 rounded-xl text-xs font-mono border flex items-center justify-between ${
          feedbackMsg.isError
            ? 'bg-danger/10 border-danger/50 text-danger'
            : 'bg-safe/10 border-safe/50 text-safe'
        }`}>
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Submit Claim Form Drawer */}
      {showSubmitForm && (
        <form onSubmit={handleSubmitClaim} className="p-4 rounded-2xl bg-charcoal-deep/90 border border-teal-border space-y-3 font-mono text-xs animate-fade-in">
          <div className="text-xs font-bold text-accent uppercase">
            Submit Unverified Claim for SDMA Fact-Check Verification
          </div>
          <p className="text-[11px] text-cream-subtle font-sans">
            Notice: Unverified submissions are quarantined under review and never published as confirmed facts.
          </p>
          <div>
            <label className="block text-cream-subtle mb-1">Claim Headline</label>
            <input
              type="text"
              placeholder="e.g. Unconfirmed social media report of bridge collapse near old market"
              value={claimTitle}
              onChange={(e) => setClaimTitle(e.target.value)}
              className="w-full bg-charcoal border border-teal-border rounded-xl px-3 py-2 text-white placeholder-cream-subtle/50 focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="block text-cream-subtle mb-1">Claim Details / Message</label>
            <textarea
              rows={2}
              placeholder="Describe the rumor circulated..."
              value={claimContent}
              onChange={(e) => setClaimContent(e.target.value)}
              className="w-full bg-charcoal border border-teal-border rounded-xl px-3 py-2 text-white placeholder-cream-subtle/50 font-sans focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSubmitForm(false)}
              className="px-3 py-2 glass-card text-cream-subtle rounded-xl hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent hover:bg-accent-light text-charcoal font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Rumors List */}
      <div className="space-y-3">
        {filteredRumors.length === 0 ? (
          <div className="p-8 text-center text-cream-subtle text-xs font-mono">
            No rumor bulletins matching the selected filter.
          </div>
        ) : (
          filteredRumors.map((rumor) => {
            const isDebunked = rumor.status === 'debunked';
            const isSelected = selectedId === rumor.id;

            return (
              <div
                key={rumor.id}
                onClick={() => setSelectedId(isSelected ? null : rumor.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isDebunked
                    ? 'glass-panel border-danger/60 bg-danger/10 hover:border-danger'
                    : 'glass-card border-safe/40 bg-safe/10 hover:border-safe'
                } ${isSelected ? 'ring-1 ring-accent/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isDebunked ? (
                      <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-safe flex-shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isDebunked
                          ? 'bg-danger/20 text-danger border-danger/40'
                          : 'bg-safe/20 text-safe border-safe/40'
                      }`}
                    >
                      {isDebunked ? t('debunked') : t('verified')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cream-subtle flex items-center gap-1">
                      <Clock className="w-3 h-3 text-accent" />
                      {new Date(rumor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isSelected ? (
                      <ChevronUp className="w-4 h-4 text-accent" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-cream-subtle" />
                    )}
                  </div>
                </div>

                <h3 className="font-light text-base text-white mt-2 leading-snug">{rumor.title}</h3>
                <p className="text-xs text-cream-muted mt-1 leading-relaxed">{rumor.content}</p>

                {/* Expanded Dossier View with Verification Controls */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-teal-border/40 space-y-3 font-mono text-xs animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 rounded-xl bg-charcoal-deep/70 border border-teal-border/40 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-accent">
                        Official Verification Dossier
                      </div>
                      <div className="text-xs text-white">
                        Investigating Agency: <strong className="text-cream">{rumor.source}</strong>
                      </div>
                      <div className="text-[11px] text-cream-subtle font-sans leading-relaxed">
                        Verdict: {isDebunked ? 'Confirmed False / Disinformation' : 'Confirmed Official Truth by Emergency Authority'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-cream-subtle">
                        ID: {rumor.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleRumorStatus(rumor)}
                        disabled={isUpdatingStatus}
                        className="px-3 py-1.5 bg-teal-muted hover:bg-teal-border text-cream hover:text-white border border-teal-border rounded-xl text-[10px] font-bold uppercase transition-colors"
                      >
                        {isDebunked ? 'Mark Verified Fact' : 'Mark Debunked Rumor'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-teal-border/30 text-[11px] font-mono text-cream-subtle flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>Source Verification:</span>
                    <span className="text-accent">{rumor.source}</span>
                  </div>
                  <span className="text-[10px] text-cream-subtle">Click to {isSelected ? 'collapse' : 'review'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
