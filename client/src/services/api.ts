import { DangerZone, SafePlace, Alert, RumorNotice, Tourist, SosRequest, CheckIn, SmsMessage, AlertDelivery, SmsConfig, Incident } from '../../../shared/types.js';
import { cacheAllData, getCachedZones, getCachedShelters, getCachedRumors, queueOfflineSos, getQueuedSos, removeQueuedSos } from './db.js';

let isSimulatingOffline = false;

export function setSimulatedOffline(status: boolean) {
  isSimulatingOffline = status;
  console.log(`[SafeStay Network] Simulated Offline set to: ${status}`);
}

export function getSimulatedOffline(): boolean {
  return isSimulatingOffline;
}

export async function fetchDangerZones(): Promise<DangerZone[]> {
  if (isSimulatingOffline) {
    return getCachedZones();
  }
  try {
    const res = await fetch('/api/zones');
    if (!res.ok) throw new Error('Network error');
    const data: DangerZone[] = await res.json();
    cacheAllData({ zones: data }).catch(console.error);
    return data;
  } catch (err) {
    console.warn('[API] Using cached danger zones');
    return getCachedZones();
  }
}

export async function fetchShelters(): Promise<SafePlace[]> {
  if (isSimulatingOffline) {
    return getCachedShelters();
  }
  try {
    const res = await fetch('/api/shelters');
    if (!res.ok) throw new Error('Network error');
    const data: SafePlace[] = await res.json();
    cacheAllData({ shelters: data }).catch(console.error);
    return data;
  } catch (err) {
    console.warn('[API] Using cached shelters');
    return getCachedShelters();
  }
}

export async function fetchRumors(): Promise<RumorNotice[]> {
  if (isSimulatingOffline) {
    return getCachedRumors();
  }
  try {
    const res = await fetch('/api/rumors');
    if (!res.ok) throw new Error('Network error');
    const data: RumorNotice[] = await res.json();
    cacheAllData({ rumors: data }).catch(console.error);
    return data;
  } catch (err) {
    console.warn('[API] Using cached rumors');
    return getCachedRumors();
  }
}

export async function fetchTourists(): Promise<Tourist[]> {
  if (isSimulatingOffline) return [];
  const res = await fetch('/api/tourists');
  return res.json();
}

export async function fetchSmsLog(): Promise<SmsMessage[]> {
  if (isSimulatingOffline) return [];
  const res = await fetch('/api/sms');
  return res.json();
}

export async function fetchSmsDeliveries(alertId?: string): Promise<AlertDelivery[]> {
  if (isSimulatingOffline) return [];
  const url = alertId ? `/api/sms/deliveries?alertId=${encodeURIComponent(alertId)}` : '/api/sms/deliveries';
  const res = await fetch(url);
  return res.json();
}

export async function fetchSmsConfig(): Promise<SmsConfig> {
  const res = await fetch('/api/sms/config');
  return res.json();
}

export async function updateSmsMode(mode: 'mock' | 'real'): Promise<{ success: boolean; mode: 'mock' | 'real'; summary: SmsConfig }> {
  const res = await fetch('/api/sms/mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  return res.json();
}

export async function retrySmsDelivery(deliveryId: string): Promise<any> {
  const res = await fetch(`/api/sms/${deliveryId}/retry`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchIncident(incidentId: string): Promise<{ incident: Incident; zone?: DangerZone; shelter?: SafePlace }> {
  const res = await fetch(`/api/incidents/${incidentId}`);
  if (!res.ok) throw new Error('Incident not found');
  return res.json();
}

export async function fetchActiveIncidents(): Promise<Incident[]> {
  const res = await fetch('/api/incidents');
  return res.json();
}

export async function triggerAlertSend(zoneId: string, force?: boolean): Promise<any> {
  const res = await fetch('/api/alerts/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zoneId, force })
  });
  return res.json();
}

export async function registerTourist(tourist: Partial<Tourist>): Promise<Tourist> {
  const res = await fetch('/api/tourists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tourist)
  });
  return res.json();
}

export async function sendSosRequest(sos: Partial<SosRequest>): Promise<{ success: boolean; data?: SosRequest; error?: string }> {
  // If simulating offline or fetch fails, queue in IndexedDB
  if (isSimulatingOffline) {
    const queuedItem: SosRequest = {
      id: 'sos_offline_' + Date.now(),
      phone: sos.phone || '',
      touristName: sos.touristName,
      lat: sos.lat || 10.0889,
      lng: sos.lng || 77.0595,
      language: sos.language || 'en',
      peopleCount: sos.peopleCount || 1,
      triage: sos.triage || 'rescue',
      note: sos.note,
      level: 2,
      status: 'sent',
      timestamp: Date.now()
    };
    await queueOfflineSos(queuedItem);
    return { success: false, error: 'NO_NETWORK_OFFLINE_QUEUED', data: queuedItem };
  }

  try {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sos)
    });
    if (!res.ok) throw new Error('Server returned ' + res.status);
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    console.warn('[API] Internet SOS request failed, queuing offline in IndexedDB:', err);
    const queuedItem: SosRequest = {
      id: 'sos_offline_' + Date.now(),
      phone: sos.phone || '',
      touristName: sos.touristName,
      lat: sos.lat || 10.0889,
      lng: sos.lng || 77.0595,
      language: sos.language || 'en',
      peopleCount: sos.peopleCount || 1,
      triage: sos.triage || 'rescue',
      note: sos.note,
      level: 2,
      status: 'sent',
      timestamp: Date.now()
    };
    await queueOfflineSos(queuedItem);
    return { success: false, error: 'FETCH_FAILED_QUEUED', data: queuedItem };
  }
}

export async function sendCheckIn(checkin: Partial<CheckIn>): Promise<CheckIn> {
  const res = await fetch('/api/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkin)
  });
  return res.json();
}

/**
 * Flush any queued offline SOS requests when internet connectivity is restored.
 */
export async function syncQueuedOfflineSos(): Promise<number> {
  if (isSimulatingOffline) return 0;
  try {
    const queued = await getQueuedSos();
    let synced = 0;
    for (const item of queued) {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        await removeQueuedSos(item.id);
        synced++;
      }
    }
    return synced;
  } catch (err) {
    console.error('[API Sync] Failed to sync queued SOS:', err);
    return 0;
  }
}
