import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, AlertTriangle, CheckCircle2, Volume2, VolumeX, Shield, Clock, MapPin, HeartHandshake, Route, Home, Compass } from 'lucide-react';
import { DangerZone, SafePlace } from '../../../shared/types.js';
import { CRISIS_TEMPLATES } from '../../../shared/templates.js';
import { speechService } from '../services/speech.js';

interface SafetyBannerProps {
  currentLocation: [number, number];
  locationName: string;
  activeDangerZone: DangerZone | null;
  nearestSafePlace: { safePlace: SafePlace; distanceKm: number } | null;
  onSetPresetLocation: (loc: [number, number], name: string) => void;
  onOpenCheckIn: () => void;
  onViewSafeRoute?: () => void;
  onFindNearestShelter?: () => void;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({
  currentLocation,
  locationName,
  activeDangerZone,
  nearestSafePlace,
  onSetPresetLocation,
  onOpenCheckIn,
  onViewSafeRoute,
  onFindNearestShelter
}) => {
  const { t, i18n } = useTranslation();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const lang = i18n.language in CRISIS_TEMPLATES ? i18n.language : 'en';
  const template = CRISIS_TEMPLATES[lang];

  // Determine safety status
  let status: 'red' | 'amber' | 'green' = 'green';
  if (activeDangerZone) {
    status = activeDangerZone.severity;
  }

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
    } else {
      let speechText = '';
      if (status === 'red' && activeDangerZone) {
        speechText = `${activeDangerZone.hazardType.toUpperCase()} Warning active. ${activeDangerZone.name}. ${template.adviceRed}. ${
          nearestSafePlace ? `Nearest verified shelter is ${nearestSafePlace.safePlace.name}, ${nearestSafePlace.distanceKm.toFixed(1)} km away.` : ''
        }`;
      } else if (status === 'amber' && activeDangerZone) {
        speechText = `Weather advisory active. ${activeDangerZone.name}. ${template.adviceAmber}`;
      } else {
        speechText = `Safe sector. ${template.adviceGreen}`;
      }

      speechService.speak(
        speechText,
        lang,
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
      setIsPlayingAudio(true);
    }
  };

  const pubTime = activeDangerZone ? new Date(activeDangerZone.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Continuous';

  return (
    <div className="w-full space-y-4">
      {/* Central Hero Information Area */}
      <div
        className={`w-full rounded-3xl p-6 sm:p-8 glass-panel border transition-all relative overflow-hidden ${
          status === 'red'
            ? 'border-danger/70 shadow-2xl shadow-danger/25'
            : status === 'amber'
            ? 'border-warning/70 shadow-2xl shadow-warning/20'
            : 'border-safe/50 shadow-2xl shadow-safe/10'
        }`}
      >
        {/* Subtle background glow */}
        <div
          className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
            status === 'red' ? 'bg-danger' : status === 'amber' ? 'bg-warning' : 'bg-safe'
          }`}
        />

        <div className="space-y-6 relative z-10">
          {/* Top metadata strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-border/40 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                  status === 'red'
                    ? 'bg-danger/20 text-danger border border-danger/40'
                    : status === 'amber'
                    ? 'bg-warning/20 text-warning border border-warning/40'
                    : 'bg-safe/20 text-safe border border-safe/40'
                }`}
              >
                {status === 'red' ? 'CRITICAL EVACUATION' : status === 'amber' ? 'WEATHER ADVISORY' : 'NORMAL CONDITIONS'}
              </span>

              <span className="text-xs font-mono text-cream-subtle bg-teal-muted/40 px-2.5 py-1 rounded-full border border-teal-border/40 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-accent" />
                <span>OFFICIAL VERIFIED • NDMA / SDRF</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-cream-subtle">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Bulletin Published: {pubTime}</span>
              </span>

              <button
                onClick={handleToggleAudio}
                className="flex items-center gap-1.5 text-cream-muted hover:text-white bg-teal-muted/50 hover:bg-teal-muted px-2.5 py-1 rounded-lg border border-teal-border/50 transition-colors"
                title="Audio speech synthesis"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-danger" />
                    <span className="text-danger font-medium">Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-accent" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Large Elegant Headline */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{locationName}</span>
            </div>

            {status === 'red' && activeDangerZone ? (
              <div>
                <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight">
                  {activeDangerZone.hazardType.toUpperCase()} WARNING
                </h1>
                <p className="text-sm sm:text-base text-cream-muted mt-2 font-light leading-relaxed max-w-3xl">
                  {activeDangerZone.message}
                </p>
              </div>
            ) : status === 'amber' && activeDangerZone ? (
              <div>
                <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight">
                  WEATHER ADVISORY ACTIVE
                </h1>
                <p className="text-sm sm:text-base text-cream-muted mt-2 font-light leading-relaxed max-w-3xl">
                  {activeDangerZone.message}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight">
                  MONITORED SECTOR CALM & CLEAR
                </h1>
                <p className="text-sm sm:text-base text-cream-muted mt-2 font-light leading-relaxed max-w-3xl">
                  {template.adviceGreen} No active emergency evacuation notices in this sector.
                </p>
              </div>
            )}
          </div>

          {/* Official Instructions Container */}
          <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-deep/75 border border-teal-border/60 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-accent font-bold">
              Official Safety Guidance
            </div>
            <div className="text-sm text-cream font-medium leading-relaxed">
              {status === 'red'
                ? template.adviceRed
                : status === 'amber'
                ? template.adviceAmber
                : template.adviceGreen}
            </div>
          </div>

          {/* Dominant Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onViewSafeRoute && (
              <button
                onClick={onViewSafeRoute}
                className="px-6 py-3.5 bg-accent hover:bg-accent-light text-charcoal font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Route className="w-4 h-4" />
                <span>VIEW SAFE ROUTE</span>
              </button>
            )}

            {nearestSafePlace && onFindNearestShelter && (
              <button
                onClick={onFindNearestShelter}
                className="px-6 py-3.5 glass-card hover:bg-teal-muted text-cream font-mono font-semibold text-xs uppercase tracking-wider rounded-xl border border-teal-border transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4 text-safe" />
                <span>FIND NEAREST SHELTER ({nearestSafePlace.distanceKm.toFixed(1)} KM)</span>
              </button>
            )}

            <button
              onClick={onOpenCheckIn}
              className="px-5 py-3.5 glass-card hover:bg-teal-muted text-safe font-mono font-medium text-xs uppercase tracking-wider rounded-xl border border-safe/40 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>MARK SELF SAFE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Location Test Strip for easy simulation testing */}
      <div className="flex items-center justify-between text-xs font-mono text-cream-subtle px-1">
        <span className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-accent" />
          <span>Simulate Tourist Coordinates:</span>
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onSetPresetLocation([10.0865, 77.0570], 'Munnar Tea Valley, Kerala (River Basin)')}
            className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
              currentLocation[0] === 10.0865
                ? 'bg-danger/20 text-danger border-danger/50'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            Munnar Valley (Flood Zone)
          </button>
          <button
            onClick={() => onSetPresetLocation([10.0980, 77.0680], 'KDHP High Ground, Munnar Heights')}
            className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
              currentLocation[0] === 10.0980
                ? 'bg-safe/20 text-safe border-safe/50'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            KDHP High Ground (Safe)
          </button>
          <button
            onClick={() => onSetPresetLocation([10.2381, 77.4892], 'Kodaikanal Lake Sector, Tamil Nadu')}
            className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
              currentLocation[0] === 10.2381
                ? 'bg-accent/20 text-accent border-accent/50'
                : 'glass-card text-cream-muted hover:text-white border-teal-border/40'
            }`}
          >
            Kodaikanal (Hill Station)
          </button>
        </div>
      </div>
    </div>
  );
};
