import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Globe, Wifi, WifiOff, MessageSquare, Menu, Key, UserCheck, ShieldAlert } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../../shared/templates.js';
import { getSimulatedOffline, setSimulatedOffline } from '../services/api.js';

interface NavbarProps {
  currentTab: 'safety' | 'route' | 'alerts' | 'rumors' | 'contacts';
  setCurrentTab: (tab: 'safety' | 'route' | 'alerts' | 'rumors' | 'contacts') => void;
  onOpenLanguage: () => void;
  onOpenSmsInbox: () => void;
  unreadSmsCount: number;
  currentRoute: string;
  navigate: (route: string) => void;
  onToggleMobileMenu?: () => void;
  onOpenSos?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenLanguage,
  onOpenSmsInbox,
  unreadSmsCount,
  currentRoute,
  navigate,
  onToggleMobileMenu,
  onOpenSos
}) => {
  const { t, i18n } = useTranslation();
  const [isOffline, setIsOffline] = useState(getSimulatedOffline());
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const toggleOfflineSimulation = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    setSimulatedOffline(nextState);
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-teal-border/60 text-cream backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Mobile menu trigger & Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 rounded-xl glass-card hover:bg-teal-muted text-cream transition-colors"
              aria-label="Toggle navigation"
            >
              <Menu className="w-4 h-4 text-accent" />
            </button>
          )}

          <div
            onClick={() => {
              navigate('/');
              setCurrentTab('safety');
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-muted to-teal-dark border border-accent/40 flex items-center justify-center text-accent shadow-inner">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-light text-sm sm:text-base tracking-widest text-white leading-none">
                SAFESTAY
              </div>
              <div className="text-[9px] font-mono tracking-wider text-accent uppercase leading-none mt-0.5 hidden sm:block">
                Crisis Intelligence Platform
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Simulated Offline Toggle */}
          <button
            onClick={toggleOfflineSimulation}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] transition-all border ${
              isOffline
                ? 'bg-warning/20 text-warning border-warning/50 animate-pulse'
                : 'glass-card text-safe border-safe/30 hover:border-safe/60'
            }`}
            title="Toggle offline state to simulate Level 2 SMS & Level 3 Bluetooth mesh fallback"
          >
            {isOffline ? <WifiOff className="w-3 h-3 text-warning" /> : <Wifi className="w-3 h-3 text-safe" />}
            <span className="hidden md:inline">
              {isOffline ? 'Offline Mode (Mesh Active)' : 'Live Telemetry'}
            </span>
          </button>

          {/* SMS Inbox Pill */}
          <button
            onClick={onOpenSmsInbox}
            className="relative flex items-center gap-1.5 px-2.5 py-1 glass-card hover:bg-teal-muted text-cream border border-teal-border/70 rounded-full font-mono text-[11px] transition-colors"
            title="View emergency SMS messages received"
          >
            <MessageSquare className="w-3 h-3 text-accent" />
            <span className="hidden sm:inline">SMS Alerts</span>
            {unreadSmsCount > 0 && (
              <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                {unreadSmsCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={onOpenLanguage}
            className="flex items-center gap-1 px-2.5 py-1 glass-card hover:bg-teal-muted text-cream border border-teal-border/70 rounded-full font-mono text-[11px] transition-colors"
            title="Change emergency translation language"
          >
            <span className="text-xs">{currentLangObj.flag}</span>
            <span className="hidden sm:inline font-bold uppercase">{currentLangObj.code}</span>
          </button>

          {/* Emergency SOS Quick Button for immediate mobile reachability */}
          {onOpenSos && (
            <button
              onClick={onOpenSos}
              className="px-3 py-1 bg-danger hover:bg-danger-600 text-white font-mono font-bold text-[11px] uppercase tracking-wider rounded-full shadow-lg shadow-danger/30 transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              <span>SOS</span>
            </button>
          )}

          {/* Authority Portal Link */}
          <button
            onClick={() => navigate(currentRoute === '/admin' ? '/' : '/admin')}
            className={`px-2.5 py-1 rounded-full font-mono text-[11px] transition-colors border hidden sm:flex items-center gap-1 ${
              currentRoute === '/admin'
                ? 'bg-warning/20 text-warning border-warning/50 font-bold'
                : 'glass-card text-cream-subtle hover:text-white border-teal-border/50'
            }`}
          >
            <Key className="w-3 h-3 text-warning" />
            <span>{currentRoute === '/admin' ? 'Exit Portal' : 'Admin'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
