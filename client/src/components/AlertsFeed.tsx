import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertOctagon, CheckCircle2, Shield, Clock, ChevronDown, ChevronUp, MapPin, Route, Radio } from 'lucide-react';
import { DangerZone } from '../../../shared/types.js';

interface AlertsFeedProps {
  zones: DangerZone[];
  onSelectRoute?: () => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ zones, onSelectRoute }) => {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'red' | 'advisory'>('all');

  const filteredZones = zones.filter((zone) => {
    if (filter === 'red') return zone.severity === 'red';
    if (filter === 'advisory') return zone.severity !== 'red';
    return true;
  });

  const redCount = zones.filter((z) => z.severity === 'red').length;
  const advisoryCount = zones.filter((z) => z.severity !== 'red').length;

  return (
    <div className="glass-panel border border-teal-border rounded-3xl p-5 sm:p-6 shadow-2xl text-cream space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-muted border border-accent/40 rounded-xl text-accent">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-light text-white tracking-wide leading-tight">Official Disaster Advisories</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40 font-bold">
                {zones.length} Active Bulletins
              </span>
            </div>
            <p className="text-xs text-cream-subtle font-mono">
              Real-time verified bulletins issued by State Disaster Authorities and Meteorological Centres
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 font-mono text-xs self-start sm:self-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              filter === 'all'
                ? 'bg-accent/20 text-accent border-accent/50 font-bold'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            All ({zones.length})
          </button>
          <button
            onClick={() => setFilter('red')}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              filter === 'red'
                ? 'bg-danger/20 text-danger border-danger/50 font-bold'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            Critical ({redCount})
          </button>
          <button
            onClick={() => setFilter('advisory')}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              filter === 'advisory'
                ? 'bg-warning/20 text-warning border-warning/50 font-bold'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            Advisory ({advisoryCount})
          </button>
        </div>
      </div>

      {/* Bulletins List */}
      <div className="space-y-3">
        {filteredZones.length === 0 ? (
          <div className="p-8 text-center text-cream-subtle text-xs font-mono">
            No active disaster warnings matching the selected filter. Sector clear.
          </div>
        ) : (
          filteredZones.map((zone) => {
            const isRed = zone.severity === 'red';
            const isAmber = zone.severity === 'amber';
            const isSelected = selectedId === zone.id;

            return (
              <div
                key={zone.id}
                onClick={() => setSelectedId(isSelected ? null : zone.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isRed
                    ? 'glass-panel border-danger/60 bg-danger/10 shadow-lg shadow-danger/10 hover:border-danger'
                    : isAmber
                    ? 'glass-panel border-warning/60 bg-warning/10 shadow-lg shadow-warning/10 hover:border-warning'
                    : 'glass-card border-safe/40 bg-safe/10 hover:border-safe'
                } ${isSelected ? 'ring-1 ring-accent/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isRed ? (
                      <AlertOctagon className="w-4 h-4 text-danger flex-shrink-0 animate-pulse" />
                    ) : isAmber ? (
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-safe flex-shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isRed
                          ? 'bg-danger/20 text-danger border-danger/40'
                          : isAmber
                          ? 'bg-warning/20 text-warning border-warning/40'
                          : 'bg-safe/20 text-safe border-safe/40'
                      }`}
                    >
                      {zone.hazardType.toUpperCase()} {zone.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cream-subtle flex items-center gap-1">
                      <Clock className="w-3 h-3 text-accent" />
                      {new Date(zone.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isSelected ? (
                      <ChevronUp className="w-4 h-4 text-accent" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-cream-subtle" />
                    )}
                  </div>
                </div>

                <h3 className="font-light text-base text-white mt-2 leading-snug">{zone.name}</h3>
                <p className="text-xs text-cream-muted mt-1 leading-relaxed">{zone.message}</p>

                {/* Expanded Detailed Bulletin View */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-teal-border/40 space-y-3 font-mono text-xs animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-cream-subtle bg-charcoal-deep/60 p-3 rounded-xl border border-teal-border/40">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        <span>Center: {zone.center ? `${zone.center[0].toFixed(4)}°N, ${zone.center[1].toFixed(4)}°E` : 'Polygon Perimeter'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        <span>Radius: {zone.radiusKm ? `${zone.radiusKm} km radius` : 'Defined polygon'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-safe flex-shrink-0" />
                        <span>Authority: {zone.source}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                        <span>Valid Until: {new Date(zone.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {onSelectRoute && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={onSelectRoute}
                          className="px-4 py-2 bg-accent hover:bg-accent-light text-charcoal font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                          <Route className="w-3.5 h-3.5" />
                          <span>Plan Safe Evacuation Route</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-teal-border/30 flex items-center justify-between text-[11px] font-mono text-cream-subtle">
                  <div className="flex items-center gap-1 text-cream-subtle">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    <span>Source: {zone.source}</span>
                  </div>
                  <span>Expires: {new Date(zone.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
