import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, MapPin, AlertOctagon, CheckCircle2, AlertTriangle, Home, Route, Bell, MessageSquare, PhoneCall, Globe, Key, UserCheck, Inbox } from 'lucide-react';
import { DangerZone, SafePlace } from '../../../shared/types.js';

interface TouristSidebarProps {
  currentTab: 'safety' | 'route' | 'alerts' | 'rumors' | 'contacts';
  setCurrentTab: (tab: 'safety' | 'route' | 'alerts' | 'rumors' | 'contacts') => void;
  locationName: string;
  userLocation: [number, number];
  activeDangerZone: DangerZone | null;
  nearestSafePlace: { safePlace: SafePlace; distanceKm: number } | null;
  dangerZonesCount: number;
  unreadSmsCount: number;
  onOpenLanguage: () => void;
  onOpenSmsInbox: () => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const TouristSidebar: React.FC<TouristSidebarProps> = ({
  currentTab,
  setCurrentTab,
  locationName,
  userLocation,
  activeDangerZone,
  nearestSafePlace,
  dangerZonesCount,
  unreadSmsCount,
  onOpenLanguage,
  onOpenSmsInbox,
  onNavigate,
  currentRoute,
  isOpenMobile,
  onCloseMobile
}) => {
  const { t, i18n } = useTranslation();

  const isDanger = activeDangerZone && activeDangerZone.severity === 'red';
  const isCaution = activeDangerZone && activeDangerZone.severity === 'amber';
  const isSafe = !activeDangerZone || activeDangerZone.severity === 'green';

  return (
    <aside
      className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-72 lg:w-64 xl:w-72 glass-panel border-r border-teal-border/70 flex flex-col justify-between py-5 px-4 transition-transform duration-300 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } bg-charcoal/95 lg:bg-teal-dark/60 backdrop-blur-xl`}
    >
      <div className="space-y-5 overflow-y-auto pr-1">
        {/* Brand & Logo Header */}
        <div className="flex items-center justify-between pb-3 border-b border-teal-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-muted to-teal-dark border border-accent/40 flex items-center justify-center text-accent shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-light tracking-widest text-white leading-none">
                SAFESTAY
              </div>
              <div className="text-[9px] font-mono tracking-wider text-accent uppercase mt-0.5">
                Crisis Intelligence
              </div>
            </div>
          </div>

          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-cream-muted hover:text-white text-xs font-mono p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* User Location Pill */}
        <div className="glass-card p-3 rounded-2xl border border-teal-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-cream-subtle uppercase">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-accent" />
              <span>Monitored Sector</span>
            </span>
            <span className="text-safe flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse"></span>
              <span>GPS Active</span>
            </span>
          </div>
          <div className="text-xs font-medium text-cream truncate leading-tight">
            {locationName}
          </div>
          <div className="text-[10px] font-mono text-cream-subtle">
            {userLocation[0].toFixed(4)}°N, {userLocation[1].toFixed(4)}°E
          </div>
        </div>

        {/* Safety Status Widget */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            isDanger
              ? 'bg-danger/10 border-danger/50 text-danger'
              : isCaution
              ? 'bg-warning/10 border-warning/50 text-warning'
              : 'bg-safe/10 border-safe/40 text-safe'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
              Current Sector Status
            </span>
            {isDanger ? (
              <AlertOctagon className="w-4 h-4 text-danger animate-pulse" />
            ) : isCaution ? (
              <AlertTriangle className="w-4 h-4 text-warning" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-safe" />
            )}
          </div>
          <div className="text-sm font-light tracking-wide text-white mt-1">
            {isDanger ? 'ACTIVE RED DANGER' : isCaution ? 'WEATHER ADVISORY' : 'NORMAL / NO THREAT'}
          </div>
          <div className="text-[10px] font-mono text-cream-subtle mt-0.5">
            {activeDangerZone ? activeDangerZone.name : 'Sector clear of designated hazard perimeters'}
          </div>
        </div>

        {/* Nearest Shelter Quick Indicator */}
        {nearestSafePlace && (
          <div className="glass-card p-3 rounded-2xl border border-teal-border/50 space-y-1">
            <div className="text-[10px] font-mono text-accent uppercase tracking-wider flex items-center justify-between">
              <span>Nearest Shelter</span>
              <span className="text-white font-bold">{nearestSafePlace.distanceKm.toFixed(1)} km</span>
            </div>
            <div className="text-xs font-light text-white truncate">
              {nearestSafePlace.safePlace.name}
            </div>
            <button
              onClick={() => {
                if (currentRoute !== '/') onNavigate('/');
                setCurrentTab('route');
                if (onCloseMobile) onCloseMobile();
              }}
              className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1 pt-0.5"
            >
              <span>View safe route</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}

        {/* Navigation Section */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-cream-subtle px-2 mb-2">
            Intelligence Navigation
          </div>

          <button
            onClick={() => {
              if (currentRoute !== '/') onNavigate('/');
              setCurrentTab('safety');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
              currentRoute === '/' && currentTab === 'safety'
                ? 'bg-teal-border/60 text-white font-bold border border-accent/40 shadow-sm'
                : 'text-cream-muted hover:text-white hover:bg-teal-muted/30'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Home className="w-3.5 h-3.5 text-accent" />
              <span>Safety Overview</span>
            </span>
            <span className="text-[10px] font-mono text-cream-subtle">01</span>
          </button>

          <button
            onClick={() => {
              if (currentRoute !== '/') onNavigate('/');
              setCurrentTab('route');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
              currentRoute === '/' && currentTab === 'route'
                ? 'bg-teal-border/60 text-white font-bold border border-accent/40 shadow-sm'
                : 'text-cream-muted hover:text-white hover:bg-teal-muted/30'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Route className="w-3.5 h-3.5 text-accent" />
              <span>Safe Evacuation Route</span>
            </span>
            <span className="text-[10px] font-mono text-cream-subtle">02</span>
          </button>

          <button
            onClick={() => {
              if (currentRoute !== '/') onNavigate('/');
              setCurrentTab('alerts');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
              currentRoute === '/' && currentTab === 'alerts'
                ? 'bg-teal-border/60 text-white font-bold border border-accent/40 shadow-sm'
                : 'text-cream-muted hover:text-white hover:bg-teal-muted/30'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Bell className="w-3.5 h-3.5 text-accent" />
              <span>Official Bulletins</span>
            </span>
            {dangerZonesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-danger/20 text-danger text-[10px] font-bold rounded-full border border-danger/40">
                {dangerZonesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (currentRoute !== '/') onNavigate('/');
              setCurrentTab('rumors');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
              currentRoute === '/' && currentTab === 'rumors'
                ? 'bg-teal-border/60 text-white font-bold border border-accent/40 shadow-sm'
                : 'text-cream-muted hover:text-white hover:bg-teal-muted/30'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <MessageSquare className="w-3.5 h-3.5 text-accent" />
              <span>Fact Check & Rumors</span>
            </span>
            <span className="text-[10px] font-mono text-cream-subtle">04</span>
          </button>

          <button
            onClick={() => {
              if (currentRoute !== '/') onNavigate('/');
              setCurrentTab('contacts');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
              currentRoute === '/' && currentTab === 'contacts'
                ? 'bg-teal-border/60 text-white font-bold border border-accent/40 shadow-sm'
                : 'text-cream-muted hover:text-white hover:bg-teal-muted/30'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <PhoneCall className="w-3.5 h-3.5 text-accent" />
              <span>Emergency Helplines</span>
            </span>
            <span className="text-[10px] font-mono text-cream-subtle">24/7</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-teal-border/40 pt-2 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-cream-subtle px-2 mb-2">
            System & Tools
          </div>

          <button
            onClick={onOpenSmsInbox}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-cream-muted hover:text-white hover:bg-teal-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Inbox className="w-3.5 h-3.5 text-accent" />
              <span>Simulated Phone SMS</span>
            </span>
            {unreadSmsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-accent text-charcoal text-[10px] font-bold rounded-full animate-pulse">
                {unreadSmsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenLanguage}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-cream-muted hover:text-white hover:bg-teal-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span>Language ({i18n.language.toUpperCase()})</span>
            </span>
            <span className="text-[10px] font-mono text-cream-subtle">14 Langs</span>
          </button>

          <button
            onClick={() => {
              onNavigate('/register');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
              currentRoute === '/register'
                ? 'bg-teal-border/60 text-white font-bold border border-accent/40'
                : 'text-cream-muted hover:text-white hover:bg-teal-muted/30'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <UserCheck className="w-3.5 h-3.5 text-accent" />
              <span>Tourist Registration</span>
            </span>
            <span className="text-[10px] font-mono text-cream-subtle">PWA</span>
          </button>

          <button
            onClick={() => {
              onNavigate('/admin');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
              currentRoute === '/admin'
                ? 'bg-teal-border/60 text-white font-bold border border-accent/40'
                : 'text-cream-muted hover:text-white hover:bg-teal-muted/30'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Key className="w-3.5 h-3.5 text-warning" />
              <span>Authority Admin Portal</span>
            </span>
            <span className="text-[10px] font-mono text-cream-subtle">Console</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-teal-border/40 text-[10px] font-mono text-cream-subtle space-y-1">
        <div className="flex items-center justify-between">
          <span>SafeStay Core Engine</span>
          <span className="text-safe">v2.4 Online</span>
        </div>
        <div className="text-[9px] text-cream-subtle/70">
          Powered by NDMA & SDRF Early Warning
        </div>
      </div>
    </aside>
  );
};
