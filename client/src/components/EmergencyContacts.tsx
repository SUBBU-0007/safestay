import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhoneCall, PhoneForwarded, Globe2, ShieldAlert } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../services/contacts.js';

export const EmergencyContacts: React.FC = () => {
  const { t } = useTranslation();
  const [categoryFilter, setCategoryFilter] = React.useState<'all' | 'national' | 'disaster' | 'state' | 'embassy'>('all');

  const filteredContacts = EMERGENCY_CONTACTS.filter((c) => {
    if (categoryFilter === 'all') return true;
    return c.category === categoryFilter;
  });

  return (
    <div className="glass-panel border border-teal-border rounded-3xl p-5 sm:p-6 shadow-2xl text-cream space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-muted border border-accent/40 rounded-xl text-accent">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-light text-white tracking-wide leading-tight">{t('emergencyContacts')}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-safe/20 text-safe border border-safe/40 font-bold">
                24/7 Monitored ({EMERGENCY_CONTACTS.length})
              </span>
            </div>
            <p className="text-xs text-cream-subtle font-mono">
              One-touch emergency dialing • Cached offline on your device for immediate access
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-accent/20 text-accent border-accent/50 font-bold'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            All ({EMERGENCY_CONTACTS.length})
          </button>
          <button
            onClick={() => setCategoryFilter('national')}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              categoryFilter === 'national'
                ? 'bg-danger/20 text-danger border-danger/50 font-bold'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            National 112/108
          </button>
          <button
            onClick={() => setCategoryFilter('disaster')}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              categoryFilter === 'disaster'
                ? 'bg-warning/20 text-warning border-warning/50 font-bold'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            Disaster SEOC
          </button>
          <button
            onClick={() => setCategoryFilter('embassy')}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              categoryFilter === 'embassy'
                ? 'bg-safe/20 text-safe border-safe/50 font-bold'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            Embassies
          </button>
        </div>
      </div>

      {/* Grid of Helpline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredContacts.map((c) => (
          <div
            key={c.id}
            className="glass-card border border-teal-border hover:border-accent/40 rounded-2xl p-4 flex flex-col justify-between transition-colors shadow-md space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-teal-muted text-accent border border-teal-border">
                  {c.category === 'embassy' ? `EMBASSY (${c.country})` : c.category.toUpperCase()}
                </span>
                <span className="text-[10px] text-safe font-mono flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  24/7 HELPLINE
                </span>
              </div>
              <h3 className="font-light text-sm text-white mt-1 leading-snug">{c.name}</h3>
              <p className="text-xs text-cream-subtle mt-1 leading-relaxed font-sans">{c.description}</p>
            </div>

            <div className="pt-3 border-t border-teal-border/30 flex items-center justify-between">
              <span className="font-mono font-bold text-base text-accent">{c.number}</span>
              <a
                href={`tel:${c.number.replace(/\s+/g, '')}`}
                className="px-3.5 py-1.5 bg-danger hover:bg-danger-600 active:scale-95 text-white font-mono font-bold text-xs rounded-xl transition-transform flex items-center gap-1.5 shadow-md shadow-danger/20"
              >
                <PhoneForwarded className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
