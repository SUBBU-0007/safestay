import React from 'react';
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2, Calendar, Radio, ChevronRight } from 'lucide-react';
import { DangerZone, SafePlace } from '../../../shared/types.js';

interface DisasterTimelineProps {
  activeZone: DangerZone | null;
  nearestShelter: SafePlace | null;
}

export const DisasterTimeline: React.FC<DisasterTimelineProps> = ({ activeZone, nearestShelter }) => {
  const now = Date.now();

  // If there is an active zone, compute realistic milestones from its createdAt
  const baseTime = activeZone ? activeZone.createdAt : now - 3600000;
  
  const milestones = [
    {
      id: 'm1',
      time: new Date(baseTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'Alert Issued',
      detail: activeZone ? `${activeZone.hazardType.toUpperCase()} warning detected` : 'Weather advisory monitored',
      status: 'historical',
      badgeColor: 'text-safe bg-safe/10 border-safe/30',
      statusLabel: 'LOGGED',
      icon: Clock
    },
    {
      id: 'm2',
      time: new Date(baseTime + 420000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'Danger Zone Active',
      detail: activeZone ? `${activeZone.radiusKm || 0.9} km perimeter cordoned` : 'Normal baseline surveillance',
      status: activeZone ? 'active' : 'historical',
      badgeColor: activeZone ? 'text-danger bg-danger/10 border-danger/30' : 'text-cream-subtle bg-teal-muted/20 border-teal-border/30',
      statusLabel: activeZone ? 'ENFORCED' : 'NORMAL',
      icon: Radio
    },
    {
      id: 'm3',
      time: new Date(baseTime + 1200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'Evacuation Advisory',
      detail: activeZone ? 'Direct uphill evacuation issued' : 'No evacuation necessary',
      status: activeZone ? 'active' : 'historical',
      badgeColor: activeZone ? 'text-warning bg-warning/10 border-warning/30' : 'text-cream-subtle bg-teal-muted/20 border-teal-border/30',
      statusLabel: activeZone ? 'ACTION REQ.' : 'STANDBY',
      icon: AlertTriangle
    },
    {
      id: 'm4',
      time: new Date(baseTime + 2400000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'Shelter Capacitated',
      detail: nearestShelter ? `${nearestShelter.name.substring(0, 22)}... open` : 'Verified relief network ready',
      status: 'active',
      badgeColor: 'text-accent bg-accent/10 border-accent/30',
      statusLabel: 'AUDITED',
      icon: ShieldCheck
    },
    {
      id: 'm5',
      time: new Date((activeZone?.expiresAt || (now + 24 * 3600 * 1000))).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'Hazard Clearance',
      detail: activeZone ? 'SDRF scheduled survey window' : 'Continuous 24h weather check',
      status: 'forecast',
      badgeColor: 'text-cream-subtle bg-charcoal border-teal-border/40',
      statusLabel: 'FORECAST',
      icon: Calendar
    }
  ];

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-border space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-teal-border/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
            Incident Progression Timeline
          </span>
          <span className="text-[10px] font-mono text-cream-subtle hidden sm:inline">
            (Forecast & Verification Sequence)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-cream-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-safe"></span>
            <span>Historical</span>
          </span>
          <span className="flex items-center gap-1 text-cream-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
            <span>Active</span>
          </span>
          <span className="flex items-center gap-1 text-cream-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-cream-subtle"></span>
            <span>Forecast</span>
          </span>
        </div>
      </div>

      {/* Horizontal milestone cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {milestones.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className={`glass-card p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                m.status === 'active'
                  ? 'border-accent/40 bg-teal-muted/40 shadow-sm'
                  : 'border-teal-border/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cream-subtle" />
                  <span>{m.time}</span>
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${m.badgeColor}`}>
                  {m.statusLabel}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-cream leading-tight flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="truncate">{m.title}</span>
                </div>
                <div className="text-[10px] text-cream-subtle mt-1 line-clamp-2 leading-relaxed">
                  {m.detail}
                </div>
              </div>

              <div className="text-[9px] font-mono text-cream-subtle/70 pt-1 border-t border-teal-border/20 flex items-center justify-between">
                <span>Phase {idx + 1} of 5</span>
                {m.status === 'historical' && <CheckCircle2 className="w-2.5 h-2.5 text-safe" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
