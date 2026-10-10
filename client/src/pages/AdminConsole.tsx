import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Users, MapPin, Send, Plus, CheckCircle2, Radio, Check, X, Flame, MessageSquare, PhoneCall, Home, RefreshCw, Repeat, HelpCircle, FileText, ExternalLink, Key, Lock, AlertOctagon } from 'lucide-react';
import { DangerZone, SafePlace, Tourist, SosRequest, RumorNotice, HazardType, Severity, SafePlaceType, AlertDelivery, SmsConfig } from '../../../shared/types.js';
import { fetchSmsDeliveries, fetchSmsConfig, updateSmsMode, retrySmsDelivery, triggerAlertSend } from '../services/api.js';

interface AdminConsoleProps {
  dangerZones: DangerZone[];
  safePlaces: SafePlace[];
  tourists: Tourist[];
  rumors: RumorNotice[];
  onRefreshData: () => void;
  onOpenSmsInbox: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  dangerZones,
  safePlaces,
  tourists,
  rumors,
  onRefreshData,
  onOpenSmsInbox
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem('safestay_admin_auth') === 'true'
  );
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('safestay2025');
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'zones' | 'sos' | 'shelters' | 'rumors'>('overview');

  // SMS Configuration & Delivery Monitoring State
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);
  const [deliveries, setDeliveries] = useState<AlertDelivery[]>([]);
  const [isUpdatingMode, setIsUpdatingMode] = useState<boolean>(false);
  const [showDltModal, setShowDltModal] = useState<boolean>(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Danger Zone Creation Form
  const [zoneName, setZoneName] = useState('Munnar Valley Flash Flood Sector 4');
  const [hazardType, setHazardType] = useState<HazardType>('flood');
  const [severity, setSeverity] = useState<Severity>('red');
  const [zoneMessage, setZoneMessage] = useState('Heavy floodwaters rising in river basin. Immediate evacuation uphill.');
  const [centerLat, setCenterLat] = useState<number>(10.0865);
  const [centerLng, setCenterLng] = useState<number>(77.0570);
  const [radiusKm, setRadiusKm] = useState<number>(0.9);

  // Safe Place Creation Form
  const [shelterName, setShelterName] = useState('');
  const [shelterType, setShelterType] = useState<SafePlaceType>('shelter');
  const [shelterLat, setShelterLat] = useState<number>(10.0915);
  const [shelterLng, setShelterLng] = useState<number>(77.0645);
  const [shelterCap, setShelterCap] = useState<number>(500);
  const [shelterPhone, setShelterPhone] = useState('+91 4865 230303');
  const [shelterAddress, setShelterAddress] = useState('Top Road, Munnar');

  // Rumor Form
  const [rumorTitle, setRumorTitle] = useState('');
  const [rumorContent, setRumorContent] = useState('');
  const [rumorStatus, setRumorStatus] = useState<'verified' | 'debunked'>('debunked');

  // SOS Requests
  const [sosList, setSosList] = useState<SosRequest[]>([]);
  const [isSimulatingFlood, setIsSimulatingFlood] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  // Load SOS list and SMS deliveries
  const loadSos = async () => {
    try {
      const res = await fetch('/api/sos');
      if (res.ok) {
        const data = await res.json();
        setSosList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSmsData = async () => {
    try {
      const [cfg, dels] = await Promise.all([fetchSmsConfig(), fetchSmsDeliveries()]);
      setSmsConfig(cfg);
      setDeliveries(dels || []);
    } catch (err) {
      console.error('Failed to load SMS telemetry:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSos();
      loadSmsData();
      const interval = setInterval(() => {
        loadSos();
        loadSmsData();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && (password === 'safestay2025' || password === 'admin')) {
      setIsAuthenticated(true);
      sessionStorage.setItem('safestay_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. Use demo login: admin / safestay2025');
    }
  };

  const handleOneClickLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('safestay_admin_auth', 'true');
  };

  // Toggle between Mock SMS and Real Twilio Mode
  const handleToggleSmsMode = async () => {
    if (!smsConfig) return;
    const targetMode = smsConfig.mode === 'mock' ? 'real' : 'mock';
    setIsUpdatingMode(true);
    try {
      const res = await updateSmsMode(targetMode);
      if (res.success) {
        setSmsConfig(res.summary);
        setAlertFeedback(`SMS Dispatch Mode switched to: ${targetMode.toUpperCase()}`);
        setTimeout(() => setAlertFeedback(null), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setAlertFeedback(`Failed to update mode: ${err.message}`);
    } finally {
      setIsUpdatingMode(false);
    }
  };

  // Retry single failed SMS
  const handleRetryDelivery = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    try {
      const res = await retrySmsDelivery(deliveryId);
      loadSmsData();
      if (res.success) {
        setAlertFeedback(`Message retry submitted. Status: ${res.status.toUpperCase()}`);
      } else {
        setAlertFeedback(`Retry attempted: ${res.errorMessage || 'Failed'}`);
      }
      setTimeout(() => setAlertFeedback(null), 6000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  // Demo Trigger: Simulate Flash Flood
  const handleSimulateFlood = async () => {
    setIsSimulatingFlood(true);
    try {
      const res = await fetch('/api/simulate-flood', { method: 'POST' });
      const data = await res.json();
      onRefreshData();
      loadSos();
      loadSmsData();
      setAlertFeedback(`⚡ Flash Flood alert dispatched to ${data.sentMessages.length} tourists in 5 languages! Live SMS link: ${data.publicIncidentUrl}`);
      setTimeout(() => setAlertFeedback(null), 10000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingFlood(false);
    }
  };

  // Send Alert Button for a specific zone
  const handleSendZoneAlert = async (zoneId: string) => {
    try {
      const data = await triggerAlertSend(zoneId, true);
      onRefreshData();
      loadSmsData();
      setAlertFeedback(`Emergency alert dispatched to ${data.affectedCount} eligible tourists! Submitted: ${data.submittedCount}, Delivered: ${data.deliveredCount}, Failed: ${data.failedCount}`);
      setTimeout(() => setAlertFeedback(null), 9000);
    } catch (err: any) {
      console.error(err);
      setAlertFeedback(`Alert error: ${err.message}`);
    }
  };

  // Create Danger Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = 0.007; // ~800m offset
    const coords: [number, number][] = [
      [centerLat - d, centerLng - d],
      [centerLat + d, centerLng - d],
      [centerLat + d, centerLng + d],
      [centerLat - d, centerLng + d]
    ];

    try {
      await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zoneName,
          hazardType,
          severity,
          coordinates: coords,
          center: [centerLat, centerLng],
          radiusKm,
          message: zoneMessage,
          source: 'Kerala / Tamil Nadu SDRF Control Room'
        })
      });
      onRefreshData();
      setActiveTab('overview');
      setAlertFeedback('Zone created successfully!');
      setTimeout(() => setAlertFeedback(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Safe Place
  const handleCreateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/shelters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shelterName,
          type: shelterType,
          lat: shelterLat,
          lng: shelterLng,
          capacity: shelterCap,
          currentOccupancy: 0,
          phone: shelterPhone,
          address: shelterAddress,
          contactPerson: 'Relief In-Charge',
          amenities: ['Emergency Drinking Water', 'First Aid', 'Satellite Radio']
        })
      });
      onRefreshData();
      setShelterName('');
      setActiveTab('shelters');
    } catch (err) {
      console.error(err);
    }
  };

  // Create Rumor Notice
  const handleCreateRumor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/rumors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: rumorTitle,
          content: rumorContent,
          status: rumorStatus,
          source: 'District Collectorate Information Cell'
        })
      });
      onRefreshData();
      setRumorTitle('');
      setRumorContent('');
      setActiveTab('rumors');
    } catch (err) {
      console.error(err);
    }
  };

  // Update SOS status
  const handleUpdateSosStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/sos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      loadSos();
    } catch (err) {
      console.error(err);
    }
  };

  // Login view
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="glass-panel border border-teal-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-cream space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-danger/10 border border-danger/40 rounded-2xl text-danger mb-1">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-light tracking-wide text-white">Authority Incident Command Portal</h1>
            <p className="text-xs text-cream-subtle font-mono">
              State Disaster Management Authority (SDMA) & NDRF Tactical Dashboard
            </p>
          </div>

          {authError && (
            <div className="bg-danger/20 border border-danger/60 text-danger text-xs p-3 rounded-xl text-center font-mono">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-cream-muted font-semibold mb-1">Officer Login ID</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-cream-muted font-semibold mb-1">Security Key / Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-danger hover:bg-danger-600 font-bold rounded-xl text-white transition-colors shadow-lg shadow-danger/30 uppercase tracking-wider"
            >
              Sign In to Command Portal
            </button>
          </form>

          <div className="pt-2 border-t border-teal-border/40 text-center">
            <button
              onClick={handleOneClickLogin}
              className="w-full py-2.5 glass-card hover:bg-teal-muted text-accent font-semibold rounded-xl text-xs font-mono transition-colors flex items-center justify-center gap-2"
            >
              <Key className="w-3.5 h-3.5" />
              <span>One-Click Authority Demo Access</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Delivery stats
  const totalDeliveries = deliveries.length;
  const deliveredCount = deliveries.filter((d) => d.status === 'delivered' || d.status === 'simulated').length;
  const queuedCount = deliveries.filter((d) => d.status === 'queued' || d.status === 'accepted' || d.status === 'sent').length;
  const failedCount = deliveries.filter((d) => d.status === 'failed' || d.status === 'undelivered').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 text-cream font-sans">
      {/* Top Banner: Incident Command & Live Provider Selector */}
      <div className="glass-panel rounded-3xl p-5 border border-teal-border shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse"></span>
            <h1 className="text-xl font-light tracking-wide text-white">SDRF Incident Operations Command</h1>
            <span className="text-[10px] bg-teal-muted text-accent border border-teal-border px-2 py-0.5 rounded-full font-mono uppercase">
              Tamil Nadu & Kerala Operational Grid
            </span>
          </div>
          <p className="text-xs text-cream-subtle font-mono">
            Autonomous danger-zone perimeter management, real cellular SMS dispatch, and rescue triage
          </p>
        </div>

        {/* SMS Mode Selector & Demo Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* Real vs Mock Mode Switcher */}
          <button
            onClick={handleToggleSmsMode}
            disabled={isUpdatingMode}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-colors ${
              smsConfig?.mode === 'real'
                ? 'bg-safe/20 text-safe border-safe/50 font-bold'
                : 'glass-card text-accent border-accent/40'
            }`}
            title="Toggle between Mock SMS simulator and live Twilio cellular transmission"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>SMS Mode: {smsConfig?.mode === 'real' ? 'TWILIO (LIVE)' : 'MOCK (DEV)'}</span>
          </button>

          <button
            onClick={() => setShowDltModal(true)}
            className="px-3 py-2 glass-card hover:bg-teal-muted text-cream-subtle hover:text-white rounded-xl text-xs font-mono border border-teal-border flex items-center gap-1.5 transition-colors"
            title="TRAI DLT regulatory compliance guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span>DLT Info</span>
          </button>

          <button
            onClick={handleSimulateFlood}
            disabled={isSimulatingFlood}
            className="px-4 py-2.5 bg-danger hover:bg-danger-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-danger/30 flex items-center gap-2 transition-all active:scale-95"
            title="Creates active red flash flood in Munnar and sends multilingual SMS alerts"
          >
            <Flame className="w-4 h-4 text-warning" />
            <span>{isSimulatingFlood ? 'Simulating...' : 'Simulate Flash Flood (Demo)'}</span>
          </button>

          <button
            onClick={onOpenSmsInbox}
            className="px-3 py-2 glass-card hover:bg-teal-muted border border-teal-border text-cream font-mono text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Phone Inbox</span>
          </button>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {alertFeedback && (
        <div className="p-4 rounded-2xl glass-panel border border-accent/50 text-accent text-xs font-mono shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-safe flex-shrink-0" />
            <span>{alertFeedback}</span>
          </div>
          <button onClick={() => setAlertFeedback(null)} className="underline text-cream-subtle hover:text-white ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* SMS Provider Credentials Status Banner (when in real mode) */}
      {smsConfig?.mode === 'real' && (
        <div className={`p-3.5 rounded-2xl border text-xs font-mono flex items-center justify-between ${
          smsConfig.hasCredentials
            ? 'glass-card border-safe/40 text-safe'
            : 'glass-panel border-danger/60 text-danger bg-danger/10'
        }`}>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>
              {smsConfig.hasCredentials
                ? `Twilio Cellular Service Connected • Sender Number: ${smsConfig.phoneNumber} • Webhook Status: Active`
                : 'Twilio Credentials Missing in server/.env (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER). Messages will fail honestly without crashing.'}
            </span>
          </div>
          <div className="text-[10px] text-cream-subtle">
            Public App URL: {smsConfig.publicAppUrl}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-teal-border/40 pb-2 overflow-x-auto text-xs font-mono whitespace-nowrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'overview' ? 'bg-teal-border text-white font-bold border border-accent/40' : 'text-cream-subtle hover:text-white hover:bg-teal-muted/30'
          }`}
        >
          Overview & Density
        </button>
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'deliveries' ? 'bg-teal-border text-white font-bold border border-accent/40' : 'text-cream-subtle hover:text-white hover:bg-teal-muted/30'
          }`}
        >
          <span>SMS Deliveries</span>
          {failedCount > 0 ? (
            <span className="bg-danger text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {failedCount} err
            </span>
          ) : (
            <span className="bg-safe text-charcoal text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {totalDeliveries}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'zones' ? 'bg-teal-border text-white font-bold border border-accent/40' : 'text-cream-subtle hover:text-white hover:bg-teal-muted/30'
          }`}
        >
          Danger Zones & Alert Engine
        </button>
        <button
          onClick={() => setActiveTab('sos')}
          className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'sos' ? 'bg-teal-border text-white font-bold border border-accent/40' : 'text-cream-subtle hover:text-white hover:bg-teal-muted/30'
          }`}
        >
          <span>Incoming SOS</span>
          {sosList.filter((s) => s.status === 'received' || s.status === 'relayed').length > 0 && (
            <span className="bg-danger text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {sosList.filter((s) => s.status === 'received' || s.status === 'relayed').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('shelters')}
          className={`px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'shelters' ? 'bg-teal-border text-white font-bold border border-accent/40' : 'text-cream-subtle hover:text-white hover:bg-teal-muted/30'
          }`}
        >
          Shelters ({safePlaces.length})
        </button>
        <button
          onClick={() => setActiveTab('rumors')}
          className={`px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'rumors' ? 'bg-teal-border text-white font-bold border border-accent/40' : 'text-cream-subtle hover:text-white hover:bg-teal-muted/30'
          }`}
        >
          Rumor Control Board
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-teal-border space-y-1">
              <div className="text-[10px] font-mono uppercase text-cream-subtle">Registered Tourists</div>
              <div className="text-2xl font-light text-white font-mono">{tourists.length}</div>
              <div className="text-[10px] font-mono text-danger">
                {tourists.filter((t) => t.status === 'in_danger').length} in active danger zones
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-teal-border space-y-1">
              <div className="text-[10px] font-mono uppercase text-cream-subtle">Active Danger Zones</div>
              <div className="text-2xl font-light text-warning font-mono">
                {dangerZones.filter((z) => z.isActive).length}
              </div>
              <div className="text-[10px] font-mono text-cream-subtle">
                {dangerZones.filter((z) => z.severity === 'red').length} Critical Red Perimeter
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-teal-border space-y-1">
              <div className="text-[10px] font-mono uppercase text-cream-subtle">SMS Confirmed Delivered</div>
              <div className="text-2xl font-light text-safe font-mono">{deliveredCount}</div>
              <div className="text-[10px] font-mono text-cream-subtle">
                {totalDeliveries} total messages recorded
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-teal-border space-y-1">
              <div className="text-[10px] font-mono uppercase text-cream-subtle">Shelters Operational</div>
              <div className="text-2xl font-light text-accent font-mono">{safePlaces.length}</div>
              <div className="text-[10px] font-mono text-cream-subtle">
                {safePlaces.reduce((acc, s) => acc + s.capacity, 0)} total shelter capacity
              </div>
            </div>
          </div>

          {/* Tourist Anonymized Density Register */}
          <div className="glass-panel rounded-3xl p-5 border border-teal-border space-y-4">
            <div className="flex items-center justify-between border-b border-teal-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="font-light text-base text-white">Registered Tourist Monitoring Register</h3>
              </div>
              <span className="text-[11px] font-mono text-cream-subtle">Anonymized coordinates & consent verified</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {tourists.map((t) => (
                <div
                  key={t.id}
                  className={`p-3 rounded-2xl border text-xs font-mono space-y-1.5 transition-colors ${
                    t.status === 'in_danger'
                      ? 'glass-panel border-danger/60 bg-danger/10 text-danger'
                      : t.status === 'sos'
                      ? 'glass-panel border-warning/60 bg-warning/10 text-warning animate-pulse'
                      : 'glass-card border-teal-border text-cream'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate">{t.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border uppercase">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-cream-subtle">
                    {t.phone} • {t.country} ({t.language.toUpperCase()})
                  </div>
                  <div className="text-[10px] text-cream-subtle truncate">
                    Hotel: {t.hotel || 'Self check-in'} • Last update: {new Date(t.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SMS DELIVERIES TAB */}
      {activeTab === 'deliveries' && (
        <div className="glass-panel rounded-3xl p-5 border border-teal-border space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-border/40 pb-4">
            <div>
              <h3 className="text-base font-light text-white tracking-wide flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <span>SMS Alert Delivery Telemetry & Webhook Logs</span>
              </h3>
              <p className="text-xs text-cream-subtle font-mono mt-0.5">
                Provider status, message IDs, Twilio webhook receipts, and retry execution
              </p>
            </div>

            <button
              onClick={loadSmsData}
              className="px-3 py-1.5 glass-card hover:bg-teal-muted text-accent text-xs font-mono rounded-xl border border-teal-border flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Delivery Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="glass-card p-3 rounded-xl border border-teal-border/60">
              <span className="text-cream-subtle">Total Submitted:</span>
              <div className="text-lg font-bold text-white">{totalDeliveries}</div>
            </div>
            <div className="glass-card p-3 rounded-xl border border-safe/40">
              <span className="text-safe">Delivered:</span>
              <div className="text-lg font-bold text-safe">{deliveredCount}</div>
            </div>
            <div className="glass-card p-3 rounded-xl border border-warning/40">
              <span className="text-warning">Queued / Sent:</span>
              <div className="text-lg font-bold text-warning">{queuedCount}</div>
            </div>
            <div className="glass-card p-3 rounded-xl border border-danger/40">
              <span className="text-danger">Failed / Undelivered:</span>
              <div className="text-lg font-bold text-danger">{failedCount}</div>
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="overflow-x-auto rounded-2xl border border-teal-border">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-charcoal-deep text-cream-subtle uppercase border-b border-teal-border">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Provider & SID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Error / Note</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-border/40">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-cream-subtle">
                      No SMS deliveries recorded yet. Trigger an emergency alert to dispatch messages.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((del) => {
                    const isDelivered = del.status === 'delivered' || del.status === 'simulated';
                    const isFailed = del.status === 'failed' || del.status === 'undelivered';
                    return (
                      <tr key={del.id} className="hover:bg-teal-muted/20 transition-colors">
                        <td className="p-3 text-cream-subtle whitespace-nowrap">
                          {new Date(del.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-3 font-semibold text-white truncate max-w-[120px]">
                          {del.touristName}
                        </td>
                        <td className="p-3 text-cream font-mono">
                          {del.phone}
                        </td>
                        <td className="p-3 text-cream-subtle text-[11px]">
                          <div>{del.provider || 'TwilioProvider'}</div>
                          <div className="text-[10px] text-accent truncate max-w-[140px] font-mono">
                            {del.providerMessageId || 'Pending SID'}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                            isDelivered
                              ? 'bg-safe/20 text-safe border-safe/40'
                              : isFailed
                              ? 'bg-danger/20 text-danger border-danger/40'
                              : 'bg-warning/20 text-warning border-warning/40'
                          }`}>
                            {del.status}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-cream-subtle max-w-[200px] truncate" title={del.errorMessage || ''}>
                          {del.errorCode ? `[${del.errorCode}] ` : ''}{del.errorMessage || 'Delivered cleanly'}
                        </td>
                        <td className="p-3 text-right">
                          {isFailed ? (
                            <button
                              onClick={() => handleRetryDelivery(del.id)}
                              disabled={retryingId === del.id || (del.retryCount || 0) >= 3}
                              className="px-2.5 py-1 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40 rounded-lg text-[10px] font-bold uppercase transition-colors"
                            >
                              {retryingId === del.id ? 'Retrying...' : (del.retryCount || 0) >= 3 ? 'Max Retries' : `Retry (${del.retryCount || 0}/3)`}
                            </button>
                          ) : (
                            <span className="text-[10px] text-cream-subtle">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DANGER ZONES TAB */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-light text-white tracking-wide">
              Active Disaster Zones & Targeted Alert Engine
            </h3>

            <div className="space-y-3">
              {dangerZones.map((zone) => (
                <div key={zone.id} className="glass-panel rounded-2xl p-4 border border-teal-border space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          zone.severity === 'red' ? 'bg-danger/20 text-danger border-danger/40' : 'bg-warning/20 text-warning border-warning/40'
                        }`}>
                          {zone.hazardType.toUpperCase()} {zone.severity.toUpperCase()}
                        </span>
                        <h4 className="font-light text-base text-white">{zone.name}</h4>
                      </div>
                      <p className="text-xs text-cream-muted mt-1">{zone.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-teal-border/40 text-xs font-mono">
                    <span className="text-cream-subtle">
                      Center: {zone.center ? `${zone.center[0]}, ${zone.center[1]}` : 'Polygon perimeter'}
                    </span>
                    <button
                      onClick={() => handleSendZoneAlert(zone.id)}
                      className="px-4 py-2 bg-danger hover:bg-danger-600 text-white font-mono font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-danger/30 transition-transform active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Cellular SMS Alert</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create New Zone Form */}
          <div className="glass-panel rounded-3xl p-5 border border-teal-border text-cream space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-accent border-b border-teal-border/40 pb-2">
              Create New Danger Zone
            </h3>

            <form onSubmit={handleCreateZone} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-cream-subtle mb-1">Zone Name</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-cream-subtle mb-1">Hazard Type</label>
                  <select
                    value={hazardType}
                    onChange={(e) => setHazardType(e.target.value as HazardType)}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="flood">Flash Flood</option>
                    <option value="landslide">Landslide</option>
                    <option value="cyclone">Cyclone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-cream-subtle mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="red">Red (Evacuate)</option>
                    <option value="amber">Amber (Warning)</option>
                    <option value="green">Green (Advisory)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-cream-subtle mb-1">Center Lat</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={centerLat}
                    onChange={(e) => setCenterLat(parseFloat(e.target.value))}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-cream-subtle mb-1">Center Lng</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={centerLng}
                    onChange={(e) => setCenterLng(parseFloat(e.target.value))}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cream-subtle mb-1">Warning Message</label>
                <textarea
                  rows={2}
                  value={zoneMessage}
                  onChange={(e) => setZoneMessage(e.target.value)}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-accent hover:bg-accent-light text-charcoal font-bold rounded-xl transition-colors uppercase tracking-wider"
              >
                Add Zone to Map
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SOS RESCUE COMMAND TAB */}
      {activeTab === 'sos' && (
        <div className="glass-panel rounded-3xl p-5 border border-teal-border space-y-4">
          <div className="flex items-center justify-between border-b border-teal-border/40 pb-3">
            <h3 className="text-base font-light text-white tracking-wide flex items-center gap-2">
              <Radio className="w-4 h-4 text-danger animate-pulse" />
              <span>Incoming Distress Signals & Multi-Tier Escalations</span>
            </h3>
            <span className="text-xs font-mono text-cream-subtle">{sosList.length} Distress Records</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sosList.length === 0 ? (
              <div className="p-8 text-center text-cream-subtle font-mono text-xs">
                Zero active distress signals reported. Radio spectrum clear.
              </div>
            ) : (
              sosList.map((sos) => (
                <div key={sos.id} className="glass-card rounded-2xl p-4 border border-teal-border space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{sos.touristName || 'Anonymous Tourist'}</span>
                        <span className="text-[10px] font-mono text-cream-subtle">({sos.phone})</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-danger/40 bg-danger/20 text-danger uppercase font-bold">
                          {sos.triage}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-cream-subtle mt-0.5">
                        GPS: {sos.lat.toFixed(4)}, {sos.lng.toFixed(4)} • People: {sos.peopleCount} • Hop Level: {sos.level}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cream-subtle">
                      {new Date(sos.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {sos.note && (
                    <div className="p-2.5 rounded-xl bg-charcoal-deep text-xs font-mono text-cream-muted border border-teal-border/40">
                      Note: {sos.note}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-teal-border/30 text-xs font-mono">
                    <span className="text-cream-subtle">Status: <strong className="text-white uppercase">{sos.status}</strong></span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateSosStatus(sos.id, 'acknowledged')}
                        className="px-2.5 py-1 glass-card hover:bg-teal-muted text-accent border border-teal-border rounded-lg text-[10px]"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleUpdateSosStatus(sos.id, 'dispatched')}
                        className="px-2.5 py-1 bg-warning/20 hover:bg-warning/30 text-warning border border-warning/40 rounded-lg text-[10px]"
                      >
                        Dispatch Team
                      </button>
                      <button
                        onClick={() => handleUpdateSosStatus(sos.id, 'resolved')}
                        className="px-2.5 py-1 bg-safe/20 hover:bg-safe/30 text-safe border border-safe/40 rounded-lg text-[10px]"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SHELTERS TAB */}
      {activeTab === 'shelters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-light text-white tracking-wide">Managed Safe Shelters & Relief Bases</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {safePlaces.map((sp) => (
                <div key={sp.id} className="glass-panel rounded-2xl p-4 border border-teal-border space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-light text-sm text-white">{sp.name}</span>
                    <span className="text-[10px] bg-teal-muted text-accent px-2 py-0.5 rounded border border-teal-border uppercase">
                      {sp.type}
                    </span>
                  </div>
                  <div className="text-cream-subtle">{sp.address}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-teal-border/30 text-[11px]">
                    <span>Occupancy: {sp.currentOccupancy} / {sp.capacity}</span>
                    <span className="text-safe">{sp.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-5 border border-teal-border space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-accent border-b border-teal-border/40 pb-2">
              Add New Safe Shelter
            </h3>
            <form onSubmit={handleCreateShelter} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-cream-subtle mb-1">Shelter Name</label>
                <input
                  type="text"
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-cream-subtle mb-1">Type</label>
                  <select
                    value={shelterType}
                    onChange={(e) => setShelterType(e.target.value as SafePlaceType)}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="shelter">Shelter</option>
                    <option value="hospital">Hospital</option>
                    <option value="high_ground">High Ground</option>
                    <option value="rescue_center">Rescue Base</option>
                  </select>
                </div>
                <div>
                  <label className="block text-cream-subtle mb-1">Capacity</label>
                  <input
                    type="number"
                    value={shelterCap}
                    onChange={(e) => setShelterCap(parseInt(e.target.value))}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-cream-subtle mb-1">Lat</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={shelterLat}
                    onChange={(e) => setShelterLat(parseFloat(e.target.value))}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-cream-subtle mb-1">Lng</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={shelterLng}
                    onChange={(e) => setShelterLng(parseFloat(e.target.value))}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-cream-subtle mb-1">Helpline Phone</label>
                <input
                  type="text"
                  value={shelterPhone}
                  onChange={(e) => setShelterPhone(e.target.value)}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-accent hover:bg-accent-light text-charcoal font-bold rounded-xl transition-colors uppercase tracking-wider"
              >
                Register Safe Place
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RUMORS TAB */}
      {activeTab === 'rumors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-light text-white tracking-wide">Active Rumor Fact-Checks</h3>
            <div className="space-y-3">
              {rumors.map((r) => (
                <div key={r.id} className="glass-panel rounded-2xl p-4 border border-teal-border space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-light text-sm text-white">{r.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      r.status === 'debunked' ? 'bg-danger/20 text-danger border-danger/40' : 'bg-safe/20 text-safe border-safe/40'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-cream-muted font-sans">{r.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-5 border border-teal-border space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-accent border-b border-teal-border/40 pb-2">
              Publish Fact-Check Notice
            </h3>
            <form onSubmit={handleCreateRumor} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-cream-subtle mb-1">Notice Title</label>
                <input
                  type="text"
                  value={rumorTitle}
                  onChange={(e) => setRumorTitle(e.target.value)}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-cream-subtle mb-1">Verdict Status</label>
                <select
                  value={rumorStatus}
                  onChange={(e) => setRumorStatus(e.target.value as 'verified' | 'debunked')}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-2.5 py-2 text-white"
                >
                  <option value="debunked">Debunked Rumor (False)</option>
                  <option value="verified">Verified Official Fact (True)</option>
                </select>
              </div>
              <div>
                <label className="block text-cream-subtle mb-1">Official Clarification</label>
                <textarea
                  rows={3}
                  value={rumorContent}
                  onChange={(e) => setRumorContent(e.target.value)}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white font-sans"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-accent hover:bg-accent-light text-charcoal font-bold rounded-xl transition-colors uppercase tracking-wider"
              >
                Publish to Tourist Feed
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DLT Telecom Compliance Modal */}
      {showDltModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-deep/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-teal-border w-full max-w-2xl rounded-3xl shadow-2xl p-6 text-cream space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-teal-border/40 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                <h3 className="text-base font-light text-white tracking-wide">
                  Indian Telecom (TRAI) & DLT Compliance Reference
                </h3>
              </div>
              <button onClick={() => setShowDltModal(false)} className="text-cream-subtle hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono leading-relaxed text-cream-muted">
              <div className="p-3.5 rounded-2xl bg-charcoal-deep border border-teal-border/60 space-y-2">
                <div className="text-accent font-bold">1. TRAI TCCCPR 2018 Regulation</div>
                <p>
                  All A2P SMS transmitted across Indian telecom carriers (Jio, Airtel, Vi, BSNL) must be routed through an approved Distributed Ledger Technology (DLT) entity. Unregistered bulk SMS will be dropped at carrier SMSCs.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-charcoal-deep border border-teal-border/60 space-y-2">
                <div className="text-accent font-bold">2. Principal Entity & Sender Header</div>
                <p>
                  Register the operating agency on Vilpower/Trueconnect portals. Register 6-character header: <code className="text-white bg-teal-muted px-1.5 py-0.5 rounded">SFSTAY</code> under "Service Implicit" category (exempt from promotional DND filtering).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-charcoal-deep border border-teal-border/60 space-y-2">
                <div className="text-accent font-bold">3. Registered Template Format</div>
                <p className="bg-charcoal p-2 rounded-xl border border-teal-border text-cream-subtle font-mono text-[11px]">
                  SAFESTAY EMERGENCY ALERT: A &#123;#var#&#125; threat has been reported near your last-known location. Follow official evacuation instructions. Nearest verified shelter: &#123;#var#&#125; (&#123;#var#&#125; km). View latest alert & safe route: &#123;#var#&#125;
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-charcoal-deep border border-teal-border/60 space-y-2">
                <div className="text-accent font-bold">4. Emergency Fallback</div>
                <p>
                  SafeStay automatically formats numbers into E.164 and provides native device SMS fallback protocols (<code className="text-white">sms:</code> URI scheme) for instantaneous SDRF distress dispatch when carrier aggregator routes are delayed.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowDltModal(false)}
                className="px-5 py-2 bg-teal-muted hover:bg-teal-border text-white rounded-xl text-xs font-mono transition-colors"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
