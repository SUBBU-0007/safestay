import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigation, MapPin, Search, AlertOctagon, CheckCircle2, ShieldCheck, ArrowRight, CornerUpRight, RotateCcw } from 'lucide-react';
import { DangerZone, SafePlace } from '../../../shared/types.js';
import { computeRoute, geocodeSearch, RouteResult } from '../services/routing.js';

interface RoutePlannerProps {
  userLocation: [number, number];
  locationName: string;
  dangerZones: DangerZone[];
  safePlaces: SafePlace[];
  routeResult: RouteResult | null;
  setRouteResult: (res: RouteResult | null) => void;
  selectedDestinationPlace: SafePlace | null;
  setSelectedDestinationPlace: (sp: SafePlace | null) => void;
  nearestSafePlace?: { safePlace: SafePlace; distanceKm: number } | null;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  userLocation,
  locationName,
  dangerZones,
  safePlaces,
  routeResult,
  setRouteResult,
  selectedDestinationPlace,
  setSelectedDestinationPlace,
  nearestSafePlace
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(
    selectedDestinationPlace ? [selectedDestinationPlace.lat, selectedDestinationPlace.lng] : null
  );
  const [destinationTitle, setDestinationTitle] = useState(selectedDestinationPlace ? selectedDestinationPlace.name : '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Sync if parent passes a selected safe place
  React.useEffect(() => {
    if (selectedDestinationPlace) {
      setDestinationCoords([selectedDestinationPlace.lat, selectedDestinationPlace.lng]);
      setDestinationTitle(selectedDestinationPlace.name);
      handleCalculateRoute([selectedDestinationPlace.lat, selectedDestinationPlace.lng]);
    }
  }, [selectedDestinationPlace]);

  const handleSearchNominatim = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingGeocode(true);
    const results = await geocodeSearch(searchQuery);
    setSearchResults(results);
    setIsSearchingGeocode(false);
  };

  const handleSelectSearchResult = (res: { name: string; lat: number; lng: number }) => {
    setDestinationCoords([res.lat, res.lng]);
    setDestinationTitle(res.name.split(',')[0]);
    setSearchResults([]);
    setSearchQuery('');
    handleCalculateRoute([res.lat, res.lng]);
  };

  const handleSelectQuickShelter = (sp: SafePlace) => {
    setSelectedDestinationPlace(sp);
    setDestinationCoords([sp.lat, sp.lng]);
    setDestinationTitle(sp.name);
    handleCalculateRoute([sp.lat, sp.lng]);
  };

  const handleCalculateRoute = async (targetCoords?: [number, number]) => {
    const end = targetCoords || destinationCoords;
    if (!end) return;

    setIsLoading(true);
    setRouteError(null);
    try {
      const result = await computeRoute(userLocation, end, dangerZones, safePlaces);
      if (!result || !result.coordinates || result.coordinates.length === 0) {
        throw new Error('Unable to compute valid route coordinates.');
      }
      setRouteResult(result);
    } catch (err: any) {
      console.error('[Route Planning Error]:', err);
      setRouteResult(null);
      setRouteError('Route calculation failed: Unable to compute safe evacuation passage. Please verify connection or select an alternative shelter.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAlternateRoute = () => {
    if (routeResult && routeResult.alternateRoute && routeResult.recommendedSafePlace) {
      setDestinationCoords([routeResult.recommendedSafePlace.lat, routeResult.recommendedSafePlace.lng]);
      setDestinationTitle(routeResult.recommendedSafePlace.name);
      setRouteResult({
        ...routeResult.alternateRoute,
        isSafe: true,
        destinationInsideDanger: false,
        alternateRoute: undefined
      });
    }
  };

  return (
    <div className="glass-panel border border-teal-border rounded-3xl p-5 sm:p-6 shadow-2xl text-cream space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-teal-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-muted border border-accent/40 rounded-xl text-accent">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-light text-white tracking-wide leading-tight">{t('routePlanner')}</h2>
            <p className="text-xs text-cream-subtle font-mono">
              Evaluates danger zone intersections (Turf.js) and computes safe detours
            </p>
          </div>
        </div>
        {(routeResult || routeError) && (
          <button
            onClick={() => {
              setRouteResult(null);
              setRouteError(null);
            }}
            className="flex items-center gap-1 text-xs font-mono text-cream-subtle hover:text-white px-2 py-1 rounded-lg glass-card border border-teal-border"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* From and To Form */}
      <div className="space-y-3 font-mono text-xs">
        {/* From (Current Location) */}
        <div>
          <label className="block text-cream-subtle mb-1">{t('from')}</label>
          <div className="flex items-center gap-2 bg-charcoal-deep border border-teal-border rounded-xl px-3.5 py-2.5 text-xs">
            <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="font-medium text-cream truncate">{locationName}</span>
            <span className="ml-auto text-[10px] bg-teal-muted text-accent border border-teal-border px-2 py-0.5 rounded-full flex-shrink-0">
              Current
            </span>
          </div>
        </div>

        {/* To (Destination Search) */}
        <div>
          <label className="block text-cream-subtle mb-1">{t('to')}</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={destinationTitle || 'Search location or pick shelter below...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchNominatim()}
                className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-cream-subtle/50 focus:outline-none focus:border-accent"
              />
              {isSearchingGeocode && (
                <div className="absolute right-3 top-2.5 text-[10px] text-accent animate-pulse font-mono">
                  Searching...
                </div>
              )}
            </div>
            <button
              onClick={handleSearchNominatim}
              className="px-4 py-2 glass-card hover:bg-teal-muted border border-teal-border rounded-xl text-xs font-bold text-accent transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Find
            </button>
          </div>

          {/* Autocomplete Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-charcoal-deep border border-teal-border rounded-xl overflow-hidden shadow-2xl divide-y divide-teal-border/40">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-teal-muted/40 transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="truncate">{res.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nearest Shelter Quick Indicator Card */}
        {nearestSafePlace && (
          <div className="p-3 bg-charcoal-deep rounded-2xl border border-teal-border/70 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] text-accent uppercase font-mono font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-safe flex-shrink-0" />
                <span>Nearest Audited Shelter ({nearestSafePlace.distanceKm.toFixed(1)} km)</span>
              </div>
              <div className="text-xs text-white font-medium truncate">
                {nearestSafePlace.safePlace.name}
              </div>
              <div className="text-[10px] text-cream-subtle font-mono truncate">
                {nearestSafePlace.safePlace.address} • Capacity: {nearestSafePlace.safePlace.capacity}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelectQuickShelter(nearestSafePlace.safePlace)}
              className="px-3 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 rounded-xl text-[10px] font-mono font-bold uppercase whitespace-nowrap transition-colors flex-shrink-0"
            >
              Set Destination
            </button>
          </div>
        )}

        {/* Quick Shelter Selector Chips */}
        <div>
          <div className="text-[11px] text-cream-subtle mb-1.5">
            Or pick a verified safe evacuation point:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {safePlaces.slice(0, 4).map((sp) => {
              const isSelected = destinationTitle === sp.name;
              return (
                <button
                  key={sp.id}
                  onClick={() => handleSelectQuickShelter(sp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-accent/20 border-accent text-accent font-bold'
                      : 'glass-card border-teal-border text-cream-muted hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-safe" />
                  <span className="truncate max-w-[140px]">{sp.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Calculate Button */}
        <button
          onClick={() => handleCalculateRoute()}
          disabled={isLoading || !destinationCoords}
          className="w-full py-3.5 bg-accent hover:bg-accent-light text-charcoal font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-wider text-xs"
        >
          {isLoading ? 'Computing Route Safety...' : 'Analyze Safe Route'}
        </button>
      </div>

      {/* Route Error Banner */}
      {routeError && (
        <div className="glass-panel border border-danger/60 bg-danger/10 rounded-2xl p-4 text-cream space-y-2 animate-fade-in font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-danger">
            <AlertOctagon className="w-5 h-5 text-danger animate-pulse flex-shrink-0" />
            <span>Route Calculation Failed</span>
          </div>
          <p className="text-xs text-cream-muted leading-relaxed font-sans">{routeError}</p>
        </div>
      )}

      {/* Route Result Safety Verdict Banner */}
      {routeResult && (
        <div className="space-y-4 pt-2 border-t border-teal-border/40 animate-fade-in font-mono text-xs">
          {routeResult.isSafe ? (
            <div className="glass-panel border border-safe/60 bg-safe/10 rounded-2xl p-4 text-cream space-y-2">
              <div className="flex items-center gap-2 font-bold text-safe">
                <CheckCircle2 className="w-5 h-5 text-safe" />
                <span>Route is Clear of Active Hazards!</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-cream-muted pt-1">
                <span>Distance: <strong className="text-white">{routeResult.distanceKm} km</strong></span>
                <span>Est. Time: <strong className="text-white">{routeResult.durationMin} min</strong></span>
              </div>
            </div>
          ) : (
            <div className="glass-panel border border-danger/60 bg-danger/10 rounded-2xl p-4 text-cream space-y-3">
              <div className="flex items-center gap-2 font-bold text-danger">
                <AlertOctagon className="w-5 h-5 text-danger animate-pulse" />
                <span>CRITICAL: Route Intersects Active Hazard Zone!</span>
              </div>
              <p className="text-xs text-cream-muted leading-relaxed font-sans">
                {routeResult.destinationInsideDanger
                  ? 'Your chosen destination is located inside an active hazard perimeter. Evacuation to this point is unsafe.'
                  : `This route crosses the ${routeResult.crossedZone?.name || 'danger zone'} perimeter. Flowing floodwaters or rockfalls may block passage.`}
              </p>

              {routeResult.alternateRoute && routeResult.recommendedSafePlace && (
                <div className="p-3 bg-charcoal-deep rounded-xl border border-teal-border/60 space-y-2">
                  <div className="text-[11px] text-accent font-bold flex items-center gap-1.5">
                    <CornerUpRight className="w-3.5 h-3.5" />
                    <span>Recommended Safe Detour Available</span>
                  </div>
                  <div className="text-xs text-cream font-sans">
                    Reroute to: <strong>{routeResult.recommendedSafePlace.name}</strong> ({routeResult.alternateRoute.distanceKm} km, {routeResult.alternateRoute.durationMin} min)
                  </div>
                  <button
                    onClick={handleApplyAlternateRoute}
                    className="w-full py-2 bg-safe hover:bg-safe-600 text-charcoal font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                  >
                    Apply Safe Detour
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
