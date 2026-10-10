import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DangerZone, SafePlace, Tourist, RumorNotice, SmsMessage } from '../../shared/types.js';
import { fetchDangerZones, fetchShelters, fetchTourists, fetchRumors, fetchSmsLog } from './services/api.js';
import { Navbar } from './components/Navbar.js';
import { LanguageModal } from './components/LanguageModal.js';
import { SmsInboxModal } from './components/SmsInboxModal.js';
import { TouristApp } from './pages/TouristApp.js';
import { AdminConsole } from './pages/AdminConsole.js';
import { TouristRegister } from './pages/TouristRegister.js';
import { PublicIncidentPage } from './pages/PublicIncidentPage.js';
import { SosModal } from './components/SosModal.js';

export const App: React.FC = () => {
  const { i18n } = useTranslation();

  // Navigation Routing helper: support pathname, query param, or hash
  const getInitialRouteState = (): { route: string; incidentId?: string } => {
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace(/^#/, '');

    if (search.get('incident')) {
      return { route: '/incident', incidentId: search.get('incident')! };
    }
    if (path.startsWith('/incident/')) {
      const id = path.replace('/incident/', '');
      return { route: '/incident', incidentId: id };
    }
    if (hash.startsWith('/incident/') || hash.startsWith('incident/')) {
      const id = hash.replace(/^\/?incident\//, '');
      return { route: '/incident', incidentId: id };
    }

    if (path === '/admin' || hash === '/admin' || hash === 'admin') return { route: '/admin' };
    if (path === '/register' || hash === '/register' || hash === 'register') return { route: '/register' };
    return { route: '/' };
  };

  const initial = getInitialRouteState();
  const [currentRoute, setCurrentRoute] = useState<string>(initial.route);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(initial.incidentId || null);
  const [currentTab, setCurrentTab] = useState<'safety' | 'route' | 'alerts' | 'rumors' | 'contacts'>('safety');

  // Shared Data States
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [rumors, setRumors] = useState<RumorNotice[]>([]);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);
  const [unreadSmsCount, setUnreadSmsCount] = useState<number>(0);

  // Modals & Drawers
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);
  const [isFirstLanguageOpen, setIsFirstLanguageOpen] = useState<boolean>(false);
  const [isSmsInboxOpen, setIsSmsInboxOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isGlobalSosOpen, setIsGlobalSosOpen] = useState<boolean>(false);

  // Router navigation helper
  const navigate = (route: string) => {
    if (route.startsWith('/incident/')) {
      const id = route.replace('/incident/', '');
      setActiveIncidentId(id);
      setCurrentRoute('/incident');
      window.history.pushState({}, '', route);
    } else {
      setActiveIncidentId(null);
      setCurrentRoute(route);
      window.history.pushState({}, '', route);
    }
    setIsMobileSidebarOpen(false);
  };

  // Check first open for language prompt
  useEffect(() => {
    const hasChosen = localStorage.getItem('safestay_has_chosen_lang');
    if (!hasChosen) {
      setIsLanguageModalOpen(true);
      setIsFirstLanguageOpen(true);
    }
  }, []);

  // Fetch initial data
  const loadAllData = async () => {
    try {
      const [z, s, t, r, sms] = await Promise.all([
        fetchDangerZones(),
        fetchShelters(),
        fetchTourists(),
        fetchRumors(),
        fetchSmsLog()
      ]);
      setDangerZones(z || []);
      setSafePlaces(s || []);
      setTourists(t || []);
      setRumors(r || []);
      setSmsMessages(sms || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Listen for browser popstate
  useEffect(() => {
    const onPop = () => {
      const state = getInitialRouteState();
      setCurrentRoute(state.route);
      if (state.incidentId) {
        setActiveIncidentId(state.incidentId);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Server-Sent Events (SSE) Live Feed Subscription
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/stream');

      eventSource.addEventListener('zone_created', (e) => {
        const zone = JSON.parse(e.data);
        setDangerZones((prev) => [zone, ...prev.filter((z) => z.id !== zone.id)]);
      });

      eventSource.addEventListener('zone_updated', () => loadAllData());
      eventSource.addEventListener('zone_deleted', () => loadAllData());

      eventSource.addEventListener('sms_sent', (e) => {
        const msg: SmsMessage = JSON.parse(e.data);
        setSmsMessages((prev) => [msg, ...prev.filter((m) => m.id !== msg.id)]);
        setUnreadSmsCount((prev) => prev + 1);
      });

      eventSource.addEventListener('rumor_created', (e) => {
        const rumor = JSON.parse(e.data);
        setRumors((prev) => [rumor, ...prev.filter((r) => r.id !== rumor.id)]);
      });

      eventSource.addEventListener('simulation_triggered', () => {
        loadAllData();
      });
    } catch (err) {
      console.warn('SSE subscription unavailable, using regular polling fallback:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleOpenSmsInbox = () => {
    setIsSmsInboxOpen(true);
    setUnreadSmsCount(0);
  };

  const handleOpenSmsLink = (url: string) => {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.pathname.startsWith('/incident/')) {
        const id = parsed.pathname.replace('/incident/', '');
        navigate(`/incident/${id}`);
      } else {
        window.history.pushState({}, '', parsed.pathname + parsed.search);
        setCurrentRoute('/');
        setCurrentTab('safety');
        loadAllData();
      }
      setIsSmsInboxOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-cream flex flex-col font-sans selection:bg-accent selection:text-charcoal">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLanguage={() => {
          setIsFirstLanguageOpen(false);
          setIsLanguageModalOpen(true);
        }}
        onOpenSmsInbox={handleOpenSmsInbox}
        unreadSmsCount={unreadSmsCount}
        currentRoute={currentRoute}
        navigate={navigate}
        onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        onOpenSos={() => setIsGlobalSosOpen(true)}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentRoute === '/incident' && activeIncidentId ? (
          <PublicIncidentPage
            incidentId={activeIncidentId}
            onBackToApp={() => navigate('/')}
            onOpenSos={() => setIsGlobalSosOpen(true)}
          />
        ) : currentRoute === '/admin' ? (
          <AdminConsole
            dangerZones={dangerZones}
            safePlaces={safePlaces}
            tourists={tourists}
            rumors={rumors}
            onRefreshData={loadAllData}
            onOpenSmsInbox={handleOpenSmsInbox}
          />
        ) : currentRoute === '/register' ? (
          <TouristRegister
            navigate={navigate}
            onRefreshData={loadAllData}
          />
        ) : (
          <TouristApp
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            dangerZones={dangerZones}
            safePlaces={safePlaces}
            rumors={rumors}
            onRefreshData={loadAllData}
            onOpenLanguage={() => {
              setIsFirstLanguageOpen(false);
              setIsLanguageModalOpen(true);
            }}
            onOpenSmsInbox={handleOpenSmsInbox}
            unreadSmsCount={unreadSmsCount}
            onNavigate={navigate}
            isMobileSidebarOpen={isMobileSidebarOpen}
            onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </main>

      {/* Language Selection Modal */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        isFirstOpen={isFirstLanguageOpen}
      />

      {/* Simulated Phone SMS Inbox Modal */}
      <SmsInboxModal
        isOpen={isSmsInboxOpen}
        onClose={() => setIsSmsInboxOpen(false)}
        messages={smsMessages}
        onOpenSmsLink={handleOpenSmsLink}
      />

      {/* Global SOS Modal triggerable from top bar */}
      <SosModal
        isOpen={isGlobalSosOpen}
        onClose={() => setIsGlobalSosOpen(false)}
        userLocation={[10.0865, 77.0570]}
        locationName="Munnar Tea Valley, Kerala"
      />
    </div>
  );
};
