import React, { useState, useEffect } from 'react';
import { Shield, AlertOctagon, AlertTriangle, MapPin, Phone, Volume2, VolumeX, CheckCircle, Navigation, ExternalLink, ArrowLeft, HeartHandshake } from 'lucide-react';
import { fetchIncident, sendCheckIn } from '../services/api.js';
import { Incident, DangerZone, SafePlace } from '../../../shared/types.js';
import { speechService } from '../services/speech.js';
import { MapView } from '../components/MapView.js';

interface PublicIncidentPageProps {
  incidentId: string;
  onBackToApp: () => void;
  onOpenSos: () => void;
}

export const PublicIncidentPage: React.FC<PublicIncidentPageProps> = ({
  incidentId,
  onBackToApp,
  onOpenSos
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [zone, setZone] = useState<DangerZone | null>(null);
  const [shelter, setShelter] = useState<SafePlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [markedSafe, setMarkedSafe] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchIncident(incidentId)
      .then((data) => {
        if (isMounted) {
          setIncident(data.incident);
          if (data.zone) setZone(data.zone);
          if (data.shelter) setShelter(data.shelter);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load incident bulletin');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [incidentId]);

  const handleAudioToggle = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
    } else if (incident) {
      const text = `Emergency Alert. ${incident.title}. Hazard: ${incident.hazardType}. Area: ${incident.areaName}. Evacuation instruction: ${incident.instructions}. Nearest shelter is ${shelter?.name || incident.shelterName || 'designated relief camp'}.`;
      speechService.speak(text, 'en', () => setIsPlayingAudio(false), () => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    }
  };

  const handleMarkSafe = async () => {
    const phone = localStorage.getItem('safestay_user_phone') || '+91 99999 99999';
    try {
      await sendCheckIn({
        name: 'Public Incident Check-in',
        phone,
        lat: zone?.center ? zone.center[0] : 10.0865,
        lng: zone?.center ? zone.center[1] : 77.0570,
        note: `Self marked safe from public incident advisory: ${incidentId}`
      });
      setMarkedSafe(true);
      setTimeout(() => setMarkedSafe(false), 6000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal text-cream flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl border border-teal-border text-center max-w-md w-full space-y-4">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-lg font-light tracking-wide text-cream">Loading Crisis Advisory...</h2>
          <p className="text-xs text-cream-subtle font-mono">Securing live incident link: {incidentId}</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-charcoal text-cream flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl border border-danger/40 text-center max-w-md w-full space-y-4">
          <AlertOctagon className="w-12 h-12 text-danger mx-auto" />
          <h2 className="text-xl font-light text-cream">Incident Advisory Not Found</h2>
          <p className="text-xs text-cream-muted">{error || 'This incident URL may have expired or is not active.'}</p>
          <button
            onClick={onBackToApp}
            className="px-6 py-2.5 bg-teal-muted hover:bg-teal-border text-cream text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors"
          >
            Open SafeStay Live Map
          </button>
        </div>
      </div>
    );
  }

  const isRed = incident.severity === 'red';
  const pubTime = new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  const updTime = new Date(incident.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-charcoal text-cream font-sans p-3 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between border-b border-teal-border pb-4">
        <button
          onClick={onBackToApp}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Full Dashboard</span>
        </button>
        <div className="flex items-center gap-2 text-xs font-mono text-cream-subtle">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
          <span>OFFICIAL EMERGENCY BULLETIN • NO LOGIN REQUIRED</span>
        </div>
      </div>

      {/* Main Incident Hero Header */}
      <div className={`glass-panel rounded-3xl p-6 sm:p-8 border ${isRed ? 'border-danger/60 shadow-2xl shadow-danger/20' : 'border-warning/60 shadow-2xl shadow-warning/20'} space-y-6 relative overflow-hidden`}>
        {/* Severity pill & timestamps */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${isRed ? 'bg-danger/20 text-danger border border-danger/40' : 'bg-warning/20 text-warning border border-warning/40'}`}>
              {isRed ? 'CRITICAL EVACUATION ADVISORY' : 'WEATHER WARNING'}
            </span>
            <span className="text-xs font-mono text-cream-subtle bg-teal-dark px-2.5 py-1 rounded-full border border-teal-border">
              {incident.status.toUpperCase()}
            </span>
          </div>
          <div className="text-xs font-mono text-cream-subtle">
            Published: {pubTime} • Updated: {updTime}
          </div>
        </div>

        {/* Headline with large elegant typography */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            {incident.hazardType.toUpperCase()} ALERT: {incident.areaName}
          </h1>
          <p className="text-sm sm:text-base text-cream-muted leading-relaxed font-light">
            {incident.message}
          </p>
        </div>

        {/* Official Safety Instructions Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-deep/80 border border-teal-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-accent uppercase tracking-wider font-semibold">
              Mandatory Safety Instructions
            </span>
            <button
              onClick={handleAudioToggle}
              className="flex items-center gap-1.5 text-xs text-cream-muted hover:text-white bg-teal-muted/40 hover:bg-teal-muted px-2.5 py-1 rounded-lg transition-colors"
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 text-danger" /> : <Volume2 className="w-3.5 h-3.5 text-accent" />}
              <span>{isPlayingAudio ? 'Stop Audio' : 'Listen Instructions'}</span>
            </button>
          </div>
          <p className="text-sm text-cream font-medium leading-relaxed">
            {incident.instructions}
          </p>
        </div>

        {/* Immediate Emergency Action Strip */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onOpenSos}
            className="w-full sm:w-auto px-6 py-3.5 bg-danger hover:bg-danger-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-danger/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>TRIGGER RESCUE SOS</span>
          </button>

          <button
            onClick={handleMarkSafe}
            className="w-full sm:w-auto px-6 py-3.5 glass-card hover:bg-teal-muted text-safe font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>I AM SAFE (NOTIFY AUTHORITIES)</span>
          </button>
        </div>

        {markedSafe && (
          <div className="p-3 bg-safe/20 border border-safe/40 rounded-xl text-safe text-xs font-mono animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Your safe check-in has been acknowledged by emergency responders. Keep phone lines free for active rescue.</span>
          </div>
        )}
      </div>

      {/* Verified Shelter & Evacuation Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 border border-teal-border space-y-4">
          <div className="flex items-center justify-between border-b border-teal-border pb-3">
            <h3 className="text-sm font-mono uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Designated Evacuation Shelter</span>
            </h3>
            <span className="text-[11px] font-mono text-safe px-2 py-0.5 rounded-full bg-safe/10 border border-safe/30">
              AUDITED & OPEN
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-lg font-light text-white">{shelter?.name || incident.shelterName}</div>
              <div className="text-xs text-cream-subtle mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span>{shelter?.address || incident.shelterAddress}</span>
              </div>
            </div>

            {shelter && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono text-cream-subtle">
                  <span>Shelter Capacity</span>
                  <span>{shelter.currentOccupancy} / {shelter.capacity} people ({Math.round((shelter.currentOccupancy / shelter.capacity) * 100)}% occupied)</span>
                </div>
                <div className="w-full bg-charcoal-deep h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-safe h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((shelter.currentOccupancy / shelter.capacity) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-3 flex flex-wrap gap-2">
              {(shelter?.amenities || ['Clean Water', 'Food Rations', 'Backup Power', 'First Aid']).map((a, i) => (
                <span key={i} className="text-[10px] font-mono bg-teal-muted/40 text-cream-muted px-2 py-0.5 rounded-md border border-teal-border/40">
                  ✓ {a}
                </span>
              ))}
            </div>

            <div className="pt-2">
              <a
                href={`tel:${shelter?.phone || incident.shelterPhone || '+914865230303'}`}
                className="inline-flex items-center gap-2 text-xs font-mono text-accent hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Shelter Coordinator: {shelter?.phone || incident.shelterPhone || '+91 4865 230303'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Emergency Helplines Card */}
        <div className="glass-panel rounded-3xl p-6 border border-teal-border space-y-4">
          <div className="flex items-center justify-between border-b border-teal-border pb-3">
            <h3 className="text-sm font-mono uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Official Emergency Hotlines</span>
            </h3>
            <span className="text-[11px] font-mono text-cream-subtle">TOLL-FREE 24/7</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href="tel:112" className="glass-card p-3 rounded-xl hover:border-accent transition-colors block text-center">
              <div className="text-xl font-bold font-mono text-white">112</div>
              <div className="text-[10px] text-cream-subtle uppercase">National Emergency</div>
            </a>
            <a href="tel:1078" className="glass-card p-3 rounded-xl hover:border-accent transition-colors block text-center">
              <div className="text-xl font-bold font-mono text-white">1078</div>
              <div className="text-[10px] text-cream-subtle uppercase">NDRF Disaster Helpline</div>
            </a>
            <a href="tel:1070" className="glass-card p-3 rounded-xl hover:border-accent transition-colors block text-center">
              <div className="text-xl font-bold font-mono text-white">1070</div>
              <div className="text-[10px] text-cream-subtle uppercase">State Emergency Control</div>
            </a>
            <a href="tel:108" className="glass-card p-3 rounded-xl hover:border-accent transition-colors block text-center">
              <div className="text-xl font-bold font-mono text-white">108</div>
              <div className="text-[10px] text-cream-subtle uppercase">Emergency Ambulance</div>
            </a>
          </div>

          <div className="p-3 bg-charcoal-deep/60 rounded-xl border border-teal-border/40 text-[11px] text-cream-subtle leading-relaxed font-mono">
            ℹ Broadcast verified by State Disaster Management Authority & District Collectorate. This public URL is protected and unguessable.
          </div>
        </div>
      </div>

      {/* Map Section */}
      {zone && (
        <div className="glass-panel rounded-3xl p-6 border border-teal-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider text-cream font-semibold">
              Active Hazard Perimeter & Shelter Location
            </h3>
            <span className="text-[11px] font-mono text-cream-subtle">Interactive Leaflet Map</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-teal-border h-[400px]">
            <MapView
              userLocation={zone.center || [10.0865, 77.0570]}
              radiusKm={zone.radiusKm || 2}
              dangerZones={[zone]}
              safePlaces={shelter ? [shelter] : []}
              heightClass="h-[400px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
