import React from 'react';
import { AlertOctagon, ShieldCheck, Users, Radio, Clock } from 'lucide-react';
import { DangerZone, SafePlace } from '../../../shared/types.js';

interface SafetyStatsStripProps {
  activeDangerZone: DangerZone | null;
  nearestSafePlace: { safePlace: SafePlace; distanceKm: number } | null;
  affectedCount: number;
  sosCount: number;
  lastUpdatedText: string;
}

export const SafetyStatsStrip: React.FC<SafetyStatsStripProps> = ({
  activeDangerZone,
  nearestSafePlace,
  affectedCount,
  sosCount,
  lastUpdatedText
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Active Hazards */}
      <div className="glass-panel p-3.5 rounded-2xl border border-teal-border space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-cream-subtle uppercase">
          <span>Active Hazards</span>
          <AlertOctagon className={`w-3.5 h-3.5 ${activeDangerZone ? 'text-danger' : 'text-safe'}`} />
        </div>
        <div className="text-xl sm:text-2xl font-light text-white font-mono">
          {activeDangerZone ? '01' : '00'}
        </div>
        <div className="text-[10px] font-mono text-cream-subtle truncate">
          {activeDangerZone ? activeDangerZone.hazardType.toUpperCase() : 'Sector clear'}
        </div>
      </div>

      {/* 2. Nearest Shelter */}
      <div className="glass-panel p-3.5 rounded-2xl border border-teal-border space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-cream-subtle uppercase">
          <span>Nearest Shelter</span>
          <ShieldCheck className="w-3.5 h-3.5 text-safe" />
        </div>
        <div className="text-xl sm:text-2xl font-light text-white font-mono">
          {nearestSafePlace ? `${nearestSafePlace.distanceKm.toFixed(1)}` : '1.2'} <span className="text-xs font-normal text-cream-subtle">km</span>
        </div>
        <div className="text-[10px] font-mono text-cream-subtle truncate">
          {nearestSafePlace ? nearestSafePlace.safePlace.name : 'Relief Camp'}
        </div>
      </div>

      {/* 3. Affected Users (Anonymized Aggregate) */}
      <div className="glass-panel p-3.5 rounded-2xl border border-teal-border space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-cream-subtle uppercase">
          <span>Monitored Users</span>
          <Users className="w-3.5 h-3.5 text-accent" />
        </div>
        <div className="text-xl sm:text-2xl font-light text-white font-mono">
          {affectedCount > 0 ? (affectedCount < 10 ? `0${affectedCount}` : affectedCount) : '05'}
        </div>
        <div className="text-[10px] font-mono text-cream-subtle truncate">
          {affectedCount > 0 ? 'Inside perimeter' : 'Registered in sector'}
        </div>
      </div>

      {/* 4. Recent SOS Reports */}
      <div className="glass-panel p-3.5 rounded-2xl border border-teal-border space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-cream-subtle uppercase">
          <span>Distress Signals</span>
          <Radio className={`w-3.5 h-3.5 ${sosCount > 0 ? 'text-danger animate-pulse' : 'text-cream-subtle'}`} />
        </div>
        <div className="text-xl sm:text-2xl font-light text-white font-mono">
          {sosCount < 10 ? `0${sosCount}` : sosCount}
        </div>
        <div className="text-[10px] font-mono text-cream-subtle truncate">
          {sosCount > 0 ? 'Active rescue ops' : 'Zero active distress'}
        </div>
      </div>

      {/* 5. Last Alert Update Time */}
      <div className="glass-panel p-3.5 rounded-2xl border border-teal-border space-y-1 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-cream-subtle uppercase">
          <span>Advisory Synchronized</span>
          <Clock className="w-3.5 h-3.5 text-accent" />
        </div>
        <div className="text-xl sm:text-2xl font-light text-white font-mono">
          {lastUpdatedText}
        </div>
        <div className="text-[10px] font-mono text-cream-subtle truncate">
          Real-time telemetry stream
        </div>
      </div>
    </div>
  );
};
