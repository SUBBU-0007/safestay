import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, HeartHandshake, ShieldCheck, RefreshCw, Sparkles, MapPin, Route, Home, ChevronRight, PhoneCall, Info } from 'lucide-react';
import { DangerZone, SafePlace, RumorNotice } from '../../../shared/types.js';
import { isPointInDangerZone, findNearestSafePlace } from '../../../shared/geo.js';
import { fetchDangerZones, fetchShelters, fetchRumors, sendCheckIn, syncQueuedOfflineSos, getSimulatedOffline } from '../services/api.js';
import { getLastSyncTime } from '../services/db.js';
import { SafetyBanner } from '../components/SafetyBanner.js';
import { SafetyStatsStrip } from '../components/SafetyStatsStrip.js';
import { DisasterTimeline } from '../components/DisasterTimeline.js';
import { TouristSidebar } from '../components/TouristSidebar.js';
import { MapView } from '../components/MapView.js';
import { RoutePlanner } from '../components/RoutePlanner.js';
import { AlertsFeed } from '../components/AlertsFeed.js';
import { RumorBoard } from '../components/RumorBoard.js';
import { EmergencyContacts } from '../components/EmergencyContacts.js';
import { SosModal } from '../components/SosModal.js';
import { RouteResult } from '../services/routing.js';

interface TouristAppProps {
  currentTab: 'safety' | 'route' | 'alerts' | 'rumors' | 'contacts';
  setCurrentTab: (tab: 'safety' | 'route' | 'alerts' | 'rumors' | 'contacts') => void;
  dangerZones: DangerZone[];
  safePlaces: SafePlace[];
  rumors: RumorNotice[];
  onRefreshData: () => void;
  onOpenLanguage: () => void;
  onOpenSmsInbox: () => void;
  unreadSmsCount: number;
  onNavigate: (route: string) => void;
  isMobileSidebarOpen?: boolean;
  onCloseMobileSidebar?: () => void;
}

export const TouristApp: React.FC<TouristAppProps> = ({
  currentTab,
  setCurrentTab,
  dangerZones,
  safePlaces,
  rumors,
  onRefreshData,
  onOpenLanguage,
  onOpenSmsInbox,
  unreadSmsCount,
  onNavigate,
  isMobileSidebarOpen,
  onCloseMobileSidebar
}) => {
  const { t, i18n } = useTranslation();

  // User Location State (Default: Munnar Valley flood coordinates for immediate demo responsiveness)
  const [userLocation, setUserLocation] = useState<[number, number]>([10.0865, 77.0570]);
  const [locationName, setLocationName] = useState<string>('Munnar Tea Valley, Kerala');
  const [radiusKm, setRadiusKm] = useState<number>(5);

  // Active danger zone matching
  const [activeZone, setActiveZone] = useState<DangerZone | null>(null);
  const [nearestSafe, setNearestSafe] = useState<{ safePlace: SafePlace; distanceKm: number } | null>(null);

  // Routing State
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [selectedSafePlace, setSelectedSafePlace] = useState<SafePlace | null>(null);

  // Modals & Feedback
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [checkInCelebration, setCheckInCelebration] = useState(false);
  const [lastSyncDisplay, setLastSyncDisplay] = useState<string>('Just now');
  const [sosDistressCount, setSosDistressCount] = useState<number>(0);

  // Handle URL parameters (if opened via SMS link e.g. /?phone=+336...&lang=fr&zone=dz_munnar)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get('phone');
    const langParam = params.get('lang');
    const zoneParam = params.get('zone');

    if (phoneParam) {
      localStorage.setItem('safestay_user_phone', phoneParam);
    }
    if (langParam) {
      i18n.changeLanguage(langParam);
      localStorage.setItem('safestay_lang', langParam);
    }
    if (zoneParam) {
      const match = dangerZones.find((z) => z.id === zoneParam);
      if (match && match.center) {
        setUserLocation(match.center);
        setLocationName(`Near ${match.name}`);
      }
    }
  }, [dangerZones]);

  // Recalculate safety status whenever location or danger zones change
  useEffect(() => {
    const matchedZone = dangerZones.find((z) => isPointInDangerZone(userLocation, z) && z.isActive) || null;
    setActiveZone(matchedZone);

    const nearest = findNearestSafePlace(userLocation[0], userLocation[1], safePlaces);
    setNearestSafe(nearest);
  }, [userLocation, dangerZones, safePlaces]);

  // Auto-select nearest shelter when navigating to route tab if no shelter is selected
  useEffect(() => {
    if (currentTab === 'route' && !selectedSafePlace && nearestSafe) {
      setSelectedSafePlace(nearestSafe.safePlace);
    }
  }, [currentTab, selectedSafePlace, nearestSafe]);

  // Query active SOS count
  useEffect(() => {
    fetch('/api/sos')
      .then((res) => res.json())
      .then((data: any[]) => {
        const active = data.filter((s) => s.status === 'received' || s.status === 'dispatched');
        setSosDistressCount(active.length);
      })
      .catch(() => {});
  }, []);

  // Sync offline queue & check sync time
  useEffect(() => {
    getLastSyncTime().then((ts) => {
      if (ts) {
        setLastSyncDisplay(new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });

    const interval = setInterval(() => {
      syncQueuedOfflineSos().then((count) => {
        if (count > 0) {
          console.log(`[Auto-Sync] Flushed ${count} queued offline SOS distress packets!`);
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSetPresetLocation = (loc: [number, number], name: string) => {
    setUserLocation(loc);
    setLocationName(name);
  };

  const handleImSafeCheckIn = async () => {
    const phone = localStorage.getItem('safestay_user_phone') || '+91 98765 43210';
    try {
      await sendCheckIn({
        name: 'Tourist Check-in',
        phone,
        lat: userLocation[0],
        lng: userLocation[1],
        note: 'Marked self safe from tourist dashboard.'
      });
      setCheckInCelebration(true);
      setTimeout(() => setCheckInCelebration(false), 5000);
    } catch (err) {
      console.error('Checkin error:', err);
    }
  };

  const handleViewSafeRoute = () => {
    if (nearestSafe) {
      setSelectedSafePlace(nearestSafe.safePlace);
    }
    setCurrentTab('route');
  };

  const handleFindNearestShelter = () => {
    if (nearestSafe) {
      setSelectedSafePlace(nearestSafe.safePlace);
      setCurrentTab('route');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-50px)]">
      {/* Sidebar: Persistent on Desktop, Slide-out Drawer on Mobile */}
      <TouristSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        locationName={locationName}
        userLocation={userLocation}
        activeDangerZone={activeZone}
        nearestSafePlace={nearestSafe}
        dangerZonesCount={dangerZones.filter((z) => z.isActive).length}
        unreadSmsCount={unreadSmsCount}
        onOpenLanguage={onOpenLanguage}
        onOpenSmsInbox={onOpenSmsInbox}
        onNavigate={onNavigate}
        currentRoute="/"
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={onCloseMobileSidebar}
      />

      {/* Main Content Intelligence Area */}
      <div className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
        {/* Offline Status Ribbon */}
        <div className="flex items-center justify-between text-xs font-mono text-cream-subtle glass-card px-4 py-2 rounded-2xl border border-teal-border/50">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getSimulatedOffline() ? 'bg-warning animate-pulse' : 'bg-safe'}`}></span>
            <span className="truncate">
              {getSimulatedOffline()
                ? `Offline mesh mode active • Cached crisis map: ${lastSyncDisplay}`
                : `Connected to Live Telemetry Stream • Last synchronized: ${lastSyncDisplay}`}
            </span>
          </div>
          <button
            onClick={onRefreshData}
            className="flex items-center gap-1.5 text-accent hover:text-white transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Synchronize</span>
          </button>
        </div>

        {/* High-Visibility Emergency SOS Hero Bar with Critical Danger (#FF5B5B) Treatment */}
        <div className="w-full bg-gradient-to-r from-danger via-danger-600 to-danger-700 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-danger/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-white border border-danger-400/40">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="p-3 bg-black/20 rounded-2xl animate-pulse">
              <AlertOctagon className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-light tracking-wide leading-none">
                {t('sosButton')}
              </div>
              <div className="text-xs text-danger-100 font-mono mt-1">
                Instant Cellular SOS & Offline Mesh Relay (3-Tier Auto Escalation)
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSosOpen(true)}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-100 text-danger-700 font-mono font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>DISPATCH SOS</span>
            <span className="w-2 h-2 rounded-full bg-danger animate-ping"></span>
          </button>
        </div>

        {/* "I'm Safe" Celebration Toast */}
        {checkInCelebration && (
          <div className="glass-panel border border-safe/60 bg-safe/10 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-warning flex-shrink-0" />
              <div>
                <div className="font-bold text-sm text-safe font-mono">Status Broadcast: You Are Marked Safe!</div>
                <div className="text-xs text-cream-muted mt-0.5">
                  Rescue dispatchers and disaster coordinators have received your check-in. Rescuer radio channels kept free for critical evacuations.
                </div>
              </div>
            </div>
            <button
              onClick={() => setCheckInCelebration(false)}
              className="text-xs font-mono bg-safe/20 hover:bg-safe/30 text-safe px-3 py-1 rounded-xl transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Tab Views */}
        {currentTab === 'safety' && (
          <div className="space-y-6">
            {/* Central Safety Status Hero Banner */}
            <SafetyBanner
              currentLocation={userLocation}
              locationName={locationName}
              activeDangerZone={activeZone}
              nearestSafePlace={nearestSafe}
              onSetPresetLocation={handleSetPresetLocation}
              onOpenCheckIn={handleImSafeCheckIn}
              onViewSafeRoute={handleViewSafeRoute}
              onFindNearestShelter={handleFindNearestShelter}
            />

            {/* Compact Safety Statistics Strip */}
            <SafetyStatsStrip
              activeDangerZone={activeZone}
              nearestSafePlace={nearestSafe}
              affectedCount={activeZone ? 5 : 0}
              sosCount={sosDistressCount}
              lastUpdatedText={lastSyncDisplay}
            />

            {/* Forecast-Style Horizontal Disaster Timeline */}
            <DisasterTimeline
              activeZone={activeZone}
              nearestShelter={nearestSafe ? nearestSafe.safePlace : (safePlaces[0] || null)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Interactive Leaflet Map Section */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-cream-subtle flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    <span>Live Hazard Perimeter & Relief Map</span>
                    <span className="text-[10px] text-cream-subtle bg-teal-muted/40 px-2 py-0.5 rounded-full border border-teal-border/40 font-mono">
                      Leaflet + OpenStreetMap
                    </span>
                  </h2>
                </div>
                <div className="rounded-3xl overflow-hidden border border-teal-border shadow-2xl">
                  <MapView
                    userLocation={userLocation}
                    radiusKm={radiusKm}
                    setRadiusKm={setRadiusKm}
                    dangerZones={dangerZones}
                    safePlaces={safePlaces}
                    routeResult={routeResult}
                    onSelectSafePlaceForRoute={(sp) => {
                      setSelectedSafePlace(sp);
                      setCurrentTab('route');
                    }}
                    heightClass="h-[460px] sm:h-[520px]"
                  />
                </div>
              </div>

              {/* Verified Shelters Card Section */}
              <div className="glass-panel rounded-3xl p-5 border border-teal-border text-cream space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-teal-border/40 pb-3 mb-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-safe" />
                      <span>Verified Shelters</span>
                    </h3>
                    <span className="text-[11px] font-mono text-safe px-2 py-0.5 rounded-full bg-safe/10 border border-safe/30">
                      {safePlaces.length} Audited
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {safePlaces.map((sp) => {
                      const occupancyPct = Math.round((sp.currentOccupancy / sp.capacity) * 100);
                      return (
                        <div
                          key={sp.id}
                          className="glass-card hover:border-accent/50 rounded-2xl p-3.5 space-y-2 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[10px] uppercase font-mono font-bold text-accent">
                                {sp.type.replace('_', ' ')}
                              </div>
                              <div className="font-light text-sm text-white leading-tight mt-0.5">
                                {sp.name}
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-muted text-accent border border-teal-border font-mono flex-shrink-0">
                              {occupancyPct}% Full
                            </span>
                          </div>

                          <div className="w-full bg-charcoal-deep h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-safe h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, occupancyPct)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono text-cream-subtle pt-1">
                            <span>{sp.contactPerson}</span>
                            <button
                              onClick={() => {
                                setSelectedSafePlace(sp);
                                setCurrentTab('route');
                              }}
                              className="text-accent hover:text-white font-bold underline flex items-center gap-1"
                            >
                              <span>Safe Route</span>
                              <span>&rarr;</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-teal-border/40 text-[10px] font-mono text-cream-subtle text-center">
                  All designated shelters audited by State Disaster Management Authority
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Safe Route Planner Tab */}
        {currentTab === 'route' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <RoutePlanner
                userLocation={userLocation}
                locationName={locationName}
                dangerZones={dangerZones}
                safePlaces={safePlaces}
                routeResult={routeResult}
                setRouteResult={setRouteResult}
                selectedDestinationPlace={selectedSafePlace}
                setSelectedDestinationPlace={setSelectedSafePlace}
                nearestSafePlace={nearestSafe}
              />
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-3xl overflow-hidden border border-teal-border shadow-2xl">
                <MapView
                  userLocation={userLocation}
                  radiusKm={radiusKm}
                  dangerZones={dangerZones}
                  safePlaces={safePlaces}
                  routeResult={routeResult}
                  heightClass="h-[520px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Official Alerts Feed Tab */}
        {currentTab === 'alerts' && (
          <AlertsFeed
            zones={dangerZones}
            onSelectRoute={() => setCurrentTab('route')}
          />
        )}

        {/* Rumor Fact-Check Board Tab */}
        {currentTab === 'rumors' && (
          <RumorBoard
            rumors={rumors}
            onRefreshData={onRefreshData}
          />
        )}

        {/* Emergency Contacts Tab */}
        {currentTab === 'contacts' && <EmergencyContacts />}

        {/* Multi-Tier SOS Modal */}
        <SosModal
          isOpen={isSosOpen}
          onClose={() => setIsSosOpen(false)}
          userLocation={userLocation}
          locationName={locationName}
        />
      </div>
    </div>
  );
};
