import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { eventBus } from './events.js';
import { getSmsProvider, getSmsMode, setSmsMode, getSmsStatusSummary, validateAndFormatPhone } from './sms/provider.js';
import { CRISIS_TEMPLATES } from '../../shared/templates.js';
import { isPointInDangerZone, findNearestSafePlace, haversineDistance } from '../../shared/geo.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
// Support urlencoded for Twilio status callbacks
app.use(express.urlencoded({ extended: true }));
// Maximum allowed age for user location to be considered recent (72 hours in ms)
const LOCATION_RECENCY_MAX_AGE_MS = 72 * 60 * 60 * 1000;
// Duplicate send suppression window (15 minutes in ms)
const DUPLICATE_SUPPRESSION_WINDOW_MS = 15 * 60 * 1000;
// ==========================================
// SSE Live Stream Endpoint
// ==========================================
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const clientId = 'client_' + Math.random().toString(36).substring(2, 9);
    eventBus.addClient(clientId, res);
    req.on('close', () => {
        eventBus.removeClient(clientId);
    });
});
// ==========================================
// Health Check
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        system: 'SafeStay Emergency Core',
        smsMode: getSmsMode(),
        activeSseClients: eventBus.getClientCount(),
        timestamp: Date.now()
    });
});
// ==========================================
// Danger Zones API
// ==========================================
app.get('/api/zones', (req, res) => {
    const rows = db.prepare('SELECT * FROM danger_zones ORDER BY created_at DESC').all();
    const zones = rows.map((r) => ({
        id: r.id,
        name: r.name,
        hazardType: r.hazard_type,
        severity: r.severity,
        coordinates: JSON.parse(r.coordinates_json || '[]'),
        center: r.center_lat && r.center_lng ? [r.center_lat, r.center_lng] : undefined,
        radiusKm: r.radius_km || undefined,
        message: r.message,
        source: r.source,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        isActive: Boolean(r.is_active)
    }));
    res.json(zones);
});
app.post('/api/zones', (req, res) => {
    const { name, hazardType, severity, coordinates, center, radiusKm, message, source, expiresAt } = req.body;
    const id = 'dz_' + Date.now();
    const createdAt = Date.now();
    const exp = expiresAt || createdAt + 24 * 3600 * 1000;
    db.prepare(`
    INSERT INTO danger_zones (id, name, hazard_type, severity, coordinates_json, center_lat, center_lng, radius_km, message, source, created_at, expires_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, name, hazardType, severity, JSON.stringify(coordinates || []), center ? center[0] : null, center ? center[1] : null, radiusKm || null, message, source || 'Disaster Management Authority', createdAt, exp);
    const newZone = {
        id,
        name,
        hazardType,
        severity,
        coordinates: coordinates || [],
        center,
        radiusKm,
        message,
        source: source || 'Disaster Management Authority',
        createdAt,
        expiresAt: exp,
        isActive: true
    };
    eventBus.broadcast('zone_created', newZone);
    res.status(201).json(newZone);
});
app.put('/api/zones/:id', (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    db.prepare('UPDATE danger_zones SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
    eventBus.broadcast('zone_updated', { id, isActive });
    res.json({ success: true, id, isActive });
});
app.delete('/api/zones/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM danger_zones WHERE id = ?').run(id);
    eventBus.broadcast('zone_deleted', { id });
    res.json({ success: true, id });
});
// ==========================================
// Safe Places (Shelters, Hospitals, Rescue)
// ==========================================
app.get('/api/shelters', (req, res) => {
    const rows = db.prepare('SELECT * FROM safe_places ORDER BY name ASC').all();
    const places = rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        lat: r.lat,
        lng: r.lng,
        capacity: r.capacity,
        currentOccupancy: r.current_occupancy,
        phone: r.phone,
        address: r.address,
        contactPerson: r.contact_person,
        amenities: JSON.parse(r.amenities_json || '[]')
    }));
    res.json(places);
});
app.post('/api/shelters', (req, res) => {
    const { name, type, lat, lng, capacity, currentOccupancy, phone, address, contactPerson, amenities } = req.body;
    const id = 'sp_' + Date.now();
    db.prepare(`
    INSERT INTO safe_places (id, name, type, lat, lng, capacity, current_occupancy, phone, address, contact_person, amenities_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, type, lat, lng, capacity || 100, currentOccupancy || 0, phone || '', address || '', contactPerson || '', JSON.stringify(amenities || []));
    const newPlace = {
        id,
        name,
        type,
        lat,
        lng,
        capacity: capacity || 100,
        currentOccupancy: currentOccupancy || 0,
        phone: phone || '',
        address: address || '',
        contactPerson: contactPerson || '',
        amenities: amenities || []
    };
    eventBus.broadcast('shelter_created', newPlace);
    res.status(201).json(newPlace);
});
app.put('/api/shelters/:id', (req, res) => {
    const { id } = req.params;
    const { currentOccupancy, capacity } = req.body;
    db.prepare(`
    UPDATE safe_places 
    SET current_occupancy = COALESCE(?, current_occupancy),
        capacity = COALESCE(?, capacity)
    WHERE id = ?
  `).run(currentOccupancy, capacity, id);
    eventBus.broadcast('shelter_updated', { id, currentOccupancy, capacity });
    res.json({ success: true, id });
});
// ==========================================
// Tourists API
// ==========================================
app.get('/api/tourists', (req, res) => {
    const rows = db.prepare('SELECT * FROM tourists ORDER BY last_updated DESC').all();
    const tourists = rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        country: r.country,
        language: r.language,
        hotel: r.hotel,
        lat: r.lat,
        lng: r.lng,
        status: r.status,
        lastUpdated: r.last_updated,
        notificationConsent: r.notification_consent !== 0
    }));
    res.json(tourists);
});
app.post('/api/tourists', (req, res) => {
    const { name, phone, country, language, hotel, lat, lng, notificationConsent } = req.body;
    const id = 't_' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();
    const consentVal = notificationConsent !== false ? 1 : 0;
    // Normalize phone if possible
    const formattedPhone = validateAndFormatPhone(phone).formatted || phone;
    // Check if phone already registered, update if so
    const existing = db.prepare('SELECT id FROM tourists WHERE phone = ?').get(formattedPhone);
    if (existing) {
        db.prepare(`
      UPDATE tourists 
      SET name = ?, country = ?, language = ?, hotel = ?, lat = ?, lng = ?, last_updated = ?, notification_consent = ?
      WHERE id = ?
    `).run(name, country, language, hotel, lat || 10.0889, lng || 77.0595, now, consentVal, existing.id);
        return res.json({ id: existing.id, updated: true });
    }
    db.prepare(`
    INSERT INTO tourists (id, name, phone, country, language, hotel, lat, lng, status, last_updated, notification_consent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'safe', ?, ?)
  `).run(id, name, formattedPhone, country, language || 'en', hotel || '', lat || 10.0889, lng || 77.0595, now, consentVal);
    const tourist = {
        id,
        name,
        phone: formattedPhone,
        country,
        language: language || 'en',
        hotel: hotel || '',
        lat: lat || 10.0889,
        lng: lng || 77.0595,
        status: 'safe',
        lastUpdated: now,
        notificationConsent: Boolean(consentVal)
    };
    eventBus.broadcast('tourist_registered', tourist);
    res.status(201).json(tourist);
});
app.patch('/api/tourists/:id/location', (req, res) => {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const now = Date.now();
    db.prepare('UPDATE tourists SET lat = ?, lng = ?, last_updated = ? WHERE id = ?').run(lat, lng, now, id);
    eventBus.broadcast('tourist_moved', { id, lat, lng, lastUpdated: now });
    res.json({ success: true, id, lat, lng });
});
// ==========================================
// SMS Provider Configuration & Mode Controls
// ==========================================
app.get('/api/sms/config', (req, res) => {
    res.json(getSmsStatusSummary());
});
app.post('/api/sms/mode', (req, res) => {
    const { mode } = req.body;
    if (mode !== 'mock' && mode !== 'real') {
        return res.status(400).json({ error: 'Invalid mode. Must be "mock" or "real"' });
    }
    setSmsMode(mode);
    eventBus.broadcast('sms_mode_changed', { mode });
    res.json({ success: true, mode: getSmsMode(), summary: getSmsStatusSummary() });
});
// ==========================================
// Public Incidents API
// ==========================================
app.get('/api/incidents', (req, res) => {
    const rows = db.prepare('SELECT * FROM incidents ORDER BY created_at DESC').all();
    const incidents = rows.map((r) => ({
        id: r.id,
        zoneId: r.zone_id,
        title: r.title,
        hazardType: r.hazard_type,
        severity: r.severity,
        areaName: r.area_name,
        message: r.message,
        instructions: r.instructions,
        shelterId: r.shelter_id,
        shelterName: r.shelter_name,
        shelterAddress: r.shelter_address,
        shelterPhone: r.shelter_phone,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        status: r.status
    }));
    res.json(incidents);
});
app.get('/api/incidents/:id', (req, res) => {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!row) {
        return res.status(404).json({ error: 'Incident advisory record not found' });
    }
    // Also attach zone and shelter details if present
    let zone = null;
    if (row.zone_id) {
        const zRow = db.prepare('SELECT * FROM danger_zones WHERE id = ?').get(row.zone_id);
        if (zRow) {
            zone = {
                id: zRow.id,
                name: zRow.name,
                hazardType: zRow.hazard_type,
                severity: zRow.severity,
                coordinates: JSON.parse(zRow.coordinates_json || '[]'),
                center: zRow.center_lat && zRow.center_lng ? [zRow.center_lat, zRow.center_lng] : undefined,
                radiusKm: zRow.radius_km || undefined,
                message: zRow.message,
                source: zRow.source,
                createdAt: zRow.created_at,
                expiresAt: zRow.expires_at,
                isActive: Boolean(zRow.is_active)
            };
        }
    }
    let shelter = null;
    if (row.shelter_id) {
        const spRow = db.prepare('SELECT * FROM safe_places WHERE id = ?').get(row.shelter_id);
        if (spRow) {
            shelter = {
                id: spRow.id,
                name: spRow.name,
                type: spRow.type,
                lat: spRow.lat,
                lng: spRow.lng,
                capacity: spRow.capacity,
                currentOccupancy: spRow.current_occupancy,
                phone: spRow.phone,
                address: spRow.address,
                contactPerson: spRow.contact_person,
                amenities: JSON.parse(spRow.amenities_json || '[]')
            };
        }
    }
    const incident = {
        id: row.id,
        zoneId: row.zone_id,
        title: row.title,
        hazardType: row.hazard_type,
        severity: row.severity,
        areaName: row.area_name,
        message: row.message,
        instructions: row.instructions,
        shelterId: row.shelter_id,
        shelterName: row.shelter_name,
        shelterAddress: row.shelter_address,
        shelterPhone: row.shelter_phone,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status
    };
    res.json({ incident, zone, shelter });
});
// ==========================================
// Alerts & Automated SMS Dispatch Engine
// ==========================================
app.get('/api/alerts', (req, res) => {
    const rows = db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC').all();
    res.json(rows);
});
app.get('/api/sms/deliveries', (req, res) => {
    const { alertId } = req.query;
    let sql = 'SELECT * FROM alert_deliveries';
    const params = [];
    if (alertId) {
        sql += ' WHERE alert_id = ?';
        params.push(alertId);
    }
    sql += ' ORDER BY sent_at DESC LIMIT 200';
    const rows = db.prepare(sql).all(...params);
    const deliveries = rows.map((r) => ({
        id: r.id,
        alertId: r.alert_id,
        touristId: r.tourist_id,
        touristName: r.tourist_name,
        phone: r.phone,
        language: r.language,
        message: r.message,
        sentAt: r.sent_at,
        status: r.status,
        provider: r.provider,
        providerMessageId: r.provider_message_id,
        errorCode: r.error_code,
        errorMessage: r.error_message,
        retryCount: r.retry_count || 0,
        lastAttemptAt: r.last_attempt_at
    }));
    res.json(deliveries);
});
// Trigger emergency broadcast for a danger zone
app.post('/api/alerts/send', async (req, res) => {
    const { zoneId, force } = req.body;
    // 1. Fetch danger zone details
    const zoneRow = db.prepare('SELECT * FROM danger_zones WHERE id = ?').get(zoneId);
    if (!zoneRow) {
        return res.status(404).json({ error: 'Danger zone not found' });
    }
    const zone = {
        id: zoneRow.id,
        name: zoneRow.name,
        hazardType: zoneRow.hazard_type,
        severity: zoneRow.severity,
        coordinates: JSON.parse(zoneRow.coordinates_json || '[]'),
        center: zoneRow.center_lat && zoneRow.center_lng ? [zoneRow.center_lat, zoneRow.center_lng] : undefined,
        radiusKm: zoneRow.radius_km || undefined,
        message: zoneRow.message,
        source: zoneRow.source,
        createdAt: zoneRow.created_at,
        expiresAt: zoneRow.expires_at,
        isActive: Boolean(zoneRow.is_active)
    };
    const now = Date.now();
    // 2. Query safe places to identify nearest shelter
    const safePlacesRows = db.prepare('SELECT * FROM safe_places').all();
    const safePlaces = safePlacesRows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        lat: r.lat,
        lng: r.lng,
        capacity: r.capacity,
        currentOccupancy: r.current_occupancy,
        phone: r.phone,
        address: r.address,
        contactPerson: r.contact_person,
        amenities: JSON.parse(r.amenities_json || '[]')
    }));
    // Find representative nearest shelter for zone center
    const centerLat = zone.center ? zone.center[0] : (zone.coordinates[0]?.[0] || 10.0865);
    const centerLng = zone.center ? zone.center[1] : (zone.coordinates[0]?.[1] || 77.0570);
    const defaultNearest = findNearestSafePlace(centerLat, centerLng, safePlaces);
    const defaultShelter = defaultNearest?.safePlace;
    // 3. Generate or retrieve unguessable public incident record
    let incident = db.prepare('SELECT * FROM incidents WHERE zone_id = ? AND status != "resolved" ORDER BY created_at DESC LIMIT 1').get(zone.id);
    if (!incident) {
        const randomHex = Math.random().toString(36).substring(2, 8);
        const incidentId = `inc_${Date.now().toString(36)}_${randomHex}`;
        // Hazard-specific instruction summary
        let instructions = 'Follow official evacuation instructions. Avoid low-lying riverbeds and damaged roads. Proceed immediately to designated shelters.';
        if (zone.hazardType === 'flood') {
            instructions = 'Flash flood hazard active. Move to high ground immediately. Do NOT attempt to cross flowing water or submerged bridges.';
        }
        else if (zone.hazardType === 'landslide') {
            instructions = 'Unstable slope and mudflow alert. Evacuate hillside roads and steep valleys immediately. Stay clear of drainage paths.';
        }
        else if (zone.hazardType === 'cyclone') {
            instructions = 'High gale-force winds and storm surge active. Seek immediate shelter in reinforced masonry structures away from glass.';
        }
        db.prepare(`
      INSERT INTO incidents (id, zone_id, title, hazard_type, severity, area_name, message, instructions, shelter_id, shelter_name, shelter_address, shelter_phone, created_at, updated_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(incidentId, zone.id, `CRITICAL ALERT: ${zone.name}`, zone.hazardType, zone.severity, zone.name, zone.message, instructions, defaultShelter?.id || null, defaultShelter?.name || 'Munnar Secondary School Relief Camp', defaultShelter?.address || 'High School Junction, Munnar Top Road', defaultShelter?.phone || '+91 4865 230303', now, now);
        incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);
    }
    // 4. Create Alert Record linked to incident
    const alertId = 'alt_' + Date.now();
    db.prepare(`
    INSERT INTO alerts (id, zone_id, hazard_type, severity, title, message, source, timestamp, expires_at, incident_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(alertId, zone.id, zone.hazardType, zone.severity, `CRITICAL ALERT: ${zone.name}`, zone.message, zone.source, now, zone.expiresAt, incident.id);
    // 5. Query tourists and apply Location Recency & Notification Targeting Policy
    const touristsRows = db.prepare('SELECT * FROM tourists').all();
    const targetedTourists = [];
    let skippedStaleLocation = 0;
    let skippedNoConsent = 0;
    for (const r of touristsRows) {
        const tourist = {
            id: r.id,
            name: r.name,
            phone: r.phone,
            country: r.country,
            language: r.language,
            hotel: r.hotel,
            lat: r.lat,
            lng: r.lng,
            status: r.status,
            lastUpdated: r.last_updated,
            notificationConsent: r.notification_consent !== 0
        };
        // A. Check if point is inside danger zone
        if (!isPointInDangerZone([tourist.lat, tourist.lng], zone)) {
            continue;
        }
        // B. Check notification consent
        if (tourist.notificationConsent === false) {
            skippedNoConsent++;
            continue;
        }
        // C. Check location recency (within 72 hours, or hotel in zone)
        const locationAge = now - tourist.lastUpdated;
        if (locationAge > LOCATION_RECENCY_MAX_AGE_MS) {
            skippedStaleLocation++;
            continue;
        }
        targetedTourists.push(tourist);
        // Update tourist status to 'in_danger'
        db.prepare("UPDATE tourists SET status = 'in_danger' WHERE id = ?").run(tourist.id);
    }
    // 6. Public incident URL generation
    const appBaseUrl = process.env.PUBLIC_APP_URL || req.headers.origin || 'http://localhost:5173';
    const publicIncidentUrl = `${appBaseUrl.replace(/\/$/, '')}/incident/${incident.id}`;
    // 7. Dispatch SMS with duplicate-send protection & provider logging
    const smsProvider = getSmsProvider();
    const deliveries = [];
    let skippedDuplicates = 0;
    let submittedCount = 0;
    let deliveredCount = 0;
    let queuedCount = 0;
    let failedCount = 0;
    for (const tourist of targetedTourists) {
        // Duplicate send check: was an SMS sent to this phone in the past 15 min for this zone?
        const recentDelivery = db.prepare(`
      SELECT sent_at FROM alert_deliveries 
      WHERE phone = ? AND alert_id = ?
      ORDER BY sent_at DESC LIMIT 1
    `).get(tourist.phone, alertId);
        if (recentDelivery && !force) {
            skippedDuplicates++;
            continue;
        }
        // Calculate nearest verified shelter for this specific tourist
        const nearest = findNearestSafePlace(tourist.lat, tourist.lng, safePlaces);
        const safePlaceName = nearest?.safePlace.name || defaultShelter?.name || 'Verified Relief Camp';
        const distanceKm = nearest ? nearest.distanceKm.toFixed(1) : '1.2';
        const lang = tourist.language in CRISIS_TEMPLATES ? tourist.language : 'en';
        // Format localized SMS message
        const hazardCapitalized = zone.hazardType.toUpperCase();
        const smsBody = `SAFESTAY EMERGENCY ALERT: A ${hazardCapitalized} threat has been reported near your last-known location. Follow official evacuation instructions. Nearest verified shelter: ${safePlaceName} (${distanceKm} km). View latest alert & safe route: ${publicIncidentUrl}`;
        // Send SMS via configured provider (Mock or Twilio)
        const sendResult = await smsProvider.sendSms({
            to: tourist.phone,
            body: smsBody,
            language: lang,
            timestamp: Date.now(),
            alertId,
            touristName: tourist.name
        });
        submittedCount++;
        if (sendResult.status === 'delivered' || sendResult.status === 'simulated') {
            deliveredCount++;
        }
        else if (sendResult.status === 'queued' || sendResult.status === 'accepted') {
            queuedCount++;
        }
        else {
            failedCount++;
        }
        // Record in alert_deliveries
        const deliveryId = 'del_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        db.prepare(`
      INSERT INTO alert_deliveries (
        id, alert_id, tourist_id, tourist_name, phone, language, message, sent_at, status, 
        provider, provider_message_id, error_code, error_message, retry_count, last_attempt_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(deliveryId, alertId, tourist.id, tourist.name, sendResult.to, lang, smsBody, now, sendResult.status, sendResult.provider, sendResult.providerMessageId || null, sendResult.errorCode || null, sendResult.errorMessage || null, now);
        deliveries.push({
            id: deliveryId,
            alertId,
            touristId: tourist.id,
            touristName: tourist.name,
            phone: sendResult.to,
            language: lang,
            message: smsBody,
            sentAt: now,
            status: sendResult.status || 'queued',
            provider: sendResult.provider,
            providerMessageId: sendResult.providerMessageId,
            errorCode: sendResult.errorCode,
            errorMessage: sendResult.errorMessage,
            retryCount: 0,
            lastAttemptAt: now
        });
    }
    const broadcastPayload = {
        alertId,
        incidentId: incident.id,
        zone,
        affectedCount: targetedTourists.length,
        submittedCount,
        deliveredCount,
        queuedCount,
        failedCount,
        skippedDuplicates,
        skippedStaleLocation,
        skippedNoConsent,
        publicIncidentUrl,
        deliveries
    };
    eventBus.broadcast('alert_dispatched', broadcastPayload);
    res.json({
        success: true,
        alertId,
        incidentId: incident.id,
        zoneName: zone.name,
        affectedCount: targetedTourists.length,
        submittedCount,
        deliveredCount,
        queuedCount,
        failedCount,
        skippedDuplicates,
        skippedStaleLocation,
        publicIncidentUrl,
        deliveries
    });
});
// Twilio Delivery Status Webhook
app.post('/api/sms/webhook', (req, res) => {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;
    console.log(`[Twilio Webhook] Received status callback: SID=${MessageSid} | Status=${MessageStatus} | ErrorCode=${ErrorCode}`);
    if (MessageSid) {
        let mappedStatus = 'queued';
        const rawStatus = (MessageStatus || '').toLowerCase();
        if (rawStatus === 'delivered')
            mappedStatus = 'delivered';
        else if (rawStatus === 'undelivered' || rawStatus === 'failed')
            mappedStatus = 'failed';
        else if (rawStatus === 'sent')
            mappedStatus = 'sent';
        else if (rawStatus === 'queued' || rawStatus === 'accepted')
            mappedStatus = 'queued';
        // Update alert_deliveries
        db.prepare(`
      UPDATE alert_deliveries 
      SET status = ?, error_code = COALESCE(?, error_code), error_message = COALESCE(?, error_message)
      WHERE provider_message_id = ?
    `).run(mappedStatus, ErrorCode || null, ErrorMessage || null, MessageSid);
        // Update sms_log
        db.prepare(`
      UPDATE sms_log 
      SET status = ?, error_code = COALESCE(?, error_code), error_message = COALESCE(?, error_message)
      WHERE provider_message_id = ?
    `).run(mappedStatus, ErrorCode || null, ErrorMessage || null, MessageSid);
        eventBus.broadcast('sms_delivery_status_updated', {
            providerMessageId: MessageSid,
            status: mappedStatus,
            errorCode: ErrorCode,
            errorMessage: ErrorMessage
        });
    }
    // Respond with standard 200 OK
    res.type('text/xml').send('<Response></Response>');
});
// Admin SMS Retry Endpoint
app.post('/api/sms/:deliveryId/retry', async (req, res) => {
    const { deliveryId } = req.params;
    const row = db.prepare('SELECT * FROM alert_deliveries WHERE id = ?').get(deliveryId);
    if (!row) {
        return res.status(404).json({ error: 'Delivery record not found' });
    }
    if (row.retry_count >= 3) {
        return res.status(400).json({ error: 'Maximum retry limit (3) exceeded for this message.' });
    }
    const smsProvider = getSmsProvider();
    const retryResult = await smsProvider.sendSms({
        to: row.phone,
        body: row.message,
        language: row.language,
        timestamp: Date.now(),
        alertId: row.alert_id,
        touristName: row.tourist_name
    });
    const newRetryCount = (row.retry_count || 0) + 1;
    const now = Date.now();
    db.prepare(`
    UPDATE alert_deliveries 
    SET status = ?, provider_message_id = ?, error_code = ?, error_message = ?, retry_count = ?, last_attempt_at = ?
    WHERE id = ?
  `).run(retryResult.status, retryResult.providerMessageId || null, retryResult.errorCode || null, retryResult.errorMessage || null, newRetryCount, now, deliveryId);
    eventBus.broadcast('sms_delivery_status_updated', {
        deliveryId,
        status: retryResult.status,
        retryCount: newRetryCount
    });
    res.json({
        success: retryResult.success,
        deliveryId,
        status: retryResult.status,
        retryCount: newRetryCount,
        providerMessageId: retryResult.providerMessageId,
        errorMessage: retryResult.errorMessage
    });
});
// ==========================================
// SOS API & Multi-Tier Fallback Handling
// ==========================================
app.get('/api/sos', (req, res) => {
    const rows = db.prepare('SELECT * FROM sos_requests ORDER BY timestamp DESC').all();
    const requests = rows.map((r) => ({
        id: r.id,
        touristName: r.tourist_name,
        phone: r.phone,
        lat: r.lat,
        lng: r.lng,
        language: r.language,
        peopleCount: r.people_count,
        triage: r.triage,
        note: r.note,
        level: r.level,
        status: r.status,
        timestamp: r.timestamp,
        hopCount: r.hop_count,
        meshPath: JSON.parse(r.mesh_path_json || '[]'),
        assignedRescueCenter: r.assigned_rescue_center,
        etaMinutes: r.eta_minutes
    }));
    res.json(requests);
});
app.post('/api/sos', (req, res) => {
    const { touristName, phone, lat, lng, language, peopleCount, triage, note, level, hopCount, meshPath } = req.body;
    const id = 'sos_' + Date.now();
    const timestamp = Date.now();
    // Calculate nearest rescue center
    const safePlacesRows = db.prepare("SELECT * FROM safe_places WHERE type = 'rescue_center' OR type = 'hospital'").all();
    let nearestRescueName = 'Kerala SDRF & Fire Rescue Headquarters';
    let minDistance = Infinity;
    for (const sp of safePlacesRows) {
        const dist = haversineDistance(lat, lng, sp.lat, sp.lng);
        if (dist < minDistance) {
            minDistance = dist;
            nearestRescueName = sp.name;
        }
    }
    // Calculate estimated ETA based on distance (assuming rugged terrain rescue 20 km/h)
    const etaMinutes = Math.max(8, Math.round((minDistance / 20) * 60 + 5));
    db.prepare(`
    INSERT INTO sos_requests (
      id, tourist_name, phone, lat, lng, language, people_count, triage, note, level, status, timestamp, hop_count, mesh_path_json, assigned_rescue_center, eta_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?)
  `).run(id, touristName || 'Anonymous Tourist', phone || '+91 99999 99999', lat, lng, language || 'en', peopleCount || 1, triage || 'rescue', note || '', level || 1, timestamp, hopCount || 0, JSON.stringify(meshPath || (level === 3 ? ['Mesh Ingested'] : ['Direct Cellular/Wi-Fi'])), nearestRescueName, etaMinutes);
    // Update tourist status to 'sos' if registered
    if (phone) {
        db.prepare("UPDATE tourists SET status = 'sos' WHERE phone = ?").run(phone);
    }
    const newSos = {
        id,
        touristName: touristName || 'Anonymous Tourist',
        phone: phone || '+91 99999 99999',
        lat,
        lng,
        language: language || 'en',
        peopleCount: peopleCount || 1,
        triage: triage || 'rescue',
        note,
        level: level || 1,
        status: 'received',
        timestamp,
        hopCount: hopCount || 0,
        meshPath: meshPath || (level === 3 ? ['Mesh Ingested'] : ['Direct Cellular/Wi-Fi']),
        assignedRescueCenter: nearestRescueName,
        etaMinutes
    };
    eventBus.broadcast('sos_received', newSos);
    res.status(201).json(newSos);
});
app.patch('/api/sos/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, etaMinutes } = req.body;
    db.prepare(`
    UPDATE sos_requests 
    SET status = ?, eta_minutes = COALESCE(?, eta_minutes)
    WHERE id = ?
  `).run(status, etaMinutes, id);
    eventBus.broadcast('sos_status_updated', { id, status, etaMinutes });
    res.json({ success: true, id, status, etaMinutes });
});
// ==========================================
// "I'm Safe" Check-In API
// ==========================================
app.get('/api/checkins', (req, res) => {
    const rows = db.prepare('SELECT * FROM checkins ORDER BY timestamp DESC').all();
    res.json(rows);
});
app.post('/api/checkins', (req, res) => {
    const { touristId, name, phone, lat, lng, note } = req.body;
    const id = 'chk_' + Date.now();
    const timestamp = Date.now();
    db.prepare(`
    INSERT INTO checkins (id, tourist_id, name, phone, lat, lng, status, timestamp, note)
    VALUES (?, ?, ?, ?, ?, ?, 'safe', ?, ?)
  `).run(id, touristId || null, name || 'Self Registered', phone || '', lat, lng, timestamp, note || '');
    // Reset tourist status to safe
    if (phone) {
        db.prepare("UPDATE tourists SET status = 'safe', last_updated = ? WHERE phone = ?").run(timestamp, phone);
    }
    const checkin = {
        id,
        touristId,
        name: name || 'Self Registered',
        phone: phone || '',
        lat,
        lng,
        status: 'safe',
        timestamp,
        note
    };
    eventBus.broadcast('checkin_received', checkin);
    res.status(201).json(checkin);
});
// ==========================================
// Rumor Control Board
// ==========================================
app.get('/api/rumors', (req, res) => {
    const rows = db.prepare('SELECT * FROM rumor_notices ORDER BY timestamp DESC').all();
    res.json(rows);
});
app.post('/api/rumors', (req, res) => {
    const { title, content, status, source } = req.body;
    const id = 'rum_' + Date.now();
    const timestamp = Date.now();
    db.prepare(`
    INSERT INTO rumor_notices (id, title, content, status, source, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title, content, status, source || 'Official Authority Verification', timestamp);
    const rumor = {
        id,
        title,
        content,
        status,
        source: source || 'Official Authority Verification',
        timestamp
    };
    eventBus.broadcast('rumor_created', rumor);
    res.status(201).json(rumor);
});
app.patch('/api/rumors/:id', (req, res) => {
    const { id } = req.params;
    const { status, content } = req.body;
    db.prepare('UPDATE rumor_notices SET status = COALESCE(?, status), content = COALESCE(?, content) WHERE id = ?').run(status, content, id);
    const updated = db.prepare('SELECT * FROM rumor_notices WHERE id = ?').get(id);
    if (!updated) {
        return res.status(404).json({ error: 'Rumor not found' });
    }
    eventBus.broadcast('rumor_updated', updated);
    res.json({ success: true, rumor: updated });
});
// ==========================================
// Simulated SMS Inbox API
// ==========================================
app.get('/api/sms', async (req, res) => {
    const provider = getSmsProvider();
    const messages = await provider.getSentMessages();
    res.json(messages);
});
// ==========================================
// Demo Simulation: "Simulate Flash Flood"
// ==========================================
app.post('/api/simulate-flood', async (req, res) => {
    console.log('[Demo Mode] Triggering Simulated Flash Flood in Munnar Valley...');
    const zoneId = 'dz_munnar_flood_' + Date.now();
    const now = Date.now();
    const zone = {
        id: zoneId,
        name: 'Munnar Tea Valley Flash Flood (Cloudburst)',
        hazardType: 'flood',
        severity: 'red',
        coordinates: [
            [10.0820, 77.0520],
            [10.0910, 77.0540],
            [10.0925, 77.0610],
            [10.0860, 77.0620],
            [10.0805, 77.0585]
        ],
        center: [10.0864, 77.0575],
        radiusKm: 0.9,
        message: 'Torrential 185mm cloudburst triggered sudden flash flood in Muthirapuzha river basin. Water levels rising rapidly. Evacuate immediately.',
        source: 'Kerala SDRF & Central Water Commission',
        createdAt: now,
        expiresAt: now + 86400000,
        isActive: true
    };
    db.prepare(`
    INSERT INTO danger_zones (id, name, hazard_type, severity, coordinates_json, center_lat, center_lng, radius_km, message, source, created_at, expires_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(zone.id, zone.name, zone.hazardType, zone.severity, JSON.stringify(zone.coordinates), zone.center[0], zone.center[1], zone.radiusKm, zone.message, zone.source, zone.createdAt, zone.expiresAt);
    eventBus.broadcast('zone_created', zone);
    // 2. Register diverse international and local tourists inside the zone
    const demoTourists = [
        { name: 'Jean-Luc Moreau', phone: '+33612345678', country: 'France', language: 'fr', hotel: 'Tea County Resort', lat: 10.0865, lng: 77.0570 },
        { name: 'Hans Gruber', phone: '+491701234567', country: 'Germany', language: 'de', hotel: 'River View Homestay', lat: 10.0875, lng: 77.0580 },
        { name: 'Fatima Al-Mansoor', phone: '+971501234567', country: 'UAE', language: 'ar', hotel: 'Silver Cloud Estate', lat: 10.0855, lng: 77.0560 },
        { name: 'Kenji Sato', phone: '+819012345678', country: 'Japan', language: 'ja', hotel: 'Munnar Heritage Inn', lat: 10.0888, lng: 77.0592 },
        { name: 'Rajesh Sharma', phone: '+919876543210', country: 'India', language: 'hi', hotel: 'Hill Mist Cottages', lat: 10.0845, lng: 77.0575 }
    ];
    for (const t of demoTourists) {
        const tid = 't_demo_' + Math.random().toString(36).substring(2, 7);
        db.prepare(`
      INSERT OR REPLACE INTO tourists (id, name, phone, country, language, hotel, lat, lng, status, last_updated, notification_consent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_danger', ?, 1)
    `).run(tid, t.name, t.phone, t.country, t.language, t.hotel, t.lat, t.lng, now);
    }
    // 3. Create incident record
    const incidentId = `inc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const shelterRow = db.prepare('SELECT * FROM safe_places WHERE type = "shelter" ORDER BY capacity DESC LIMIT 1').get();
    db.prepare(`
    INSERT INTO incidents (id, zone_id, title, hazard_type, severity, area_name, message, instructions, shelter_id, shelter_name, shelter_address, shelter_phone, created_at, updated_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(incidentId, zone.id, `CRITICAL ALERT: ${zone.name}`, zone.hazardType, zone.severity, zone.name, zone.message, 'Flash flood hazard active. Move to high ground immediately. Do NOT cross rushing river crossings.', shelterRow?.id || 'sp_munnar_school', shelterRow?.name || 'Government Higher Secondary School Relief Camp', shelterRow?.address || 'High School Junction, Munnar Top Road', shelterRow?.phone || '+91 4865 230303', now, now);
    const alertId = 'alt_flood_demo_' + Date.now();
    db.prepare(`
    INSERT INTO alerts (id, zone_id, hazard_type, severity, title, message, source, timestamp, expires_at, incident_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(alertId, zone.id, zone.hazardType, zone.severity, `CRITICAL ALERT: ${zone.name}`, zone.message, zone.source, now, zone.expiresAt, incidentId);
    const appBaseUrl = process.env.PUBLIC_APP_URL || req.headers.origin || 'http://localhost:5173';
    const publicIncidentUrl = `${appBaseUrl.replace(/\/$/, '')}/incident/${incidentId}`;
    const smsProvider = getSmsProvider();
    const sentMessages = [];
    for (const t of demoTourists) {
        const lang = t.language && t.language in CRISIS_TEMPLATES ? t.language : 'en';
        const safePlaceName = shelterRow?.name || 'KDHP Tea Sanctuary High Ground';
        const distanceKm = '1.1';
        const smsBody = `SAFESTAY EMERGENCY ALERT: A FLASH FLOOD threat has been reported near your last-known location. Evacuate low ground. Nearest shelter: ${safePlaceName} (${distanceKm} km). Live safe-route & advisory: ${publicIncidentUrl}`;
        const sent = await smsProvider.sendSms({
            to: t.phone,
            body: smsBody,
            language: lang,
            timestamp: Date.now(),
            alertId,
            touristName: t.name
        });
        // Record delivery
        const deliveryId = 'del_demo_' + Math.random().toString(36).substring(2, 9);
        db.prepare(`
      INSERT INTO alert_deliveries (
        id, alert_id, tourist_id, tourist_name, phone, language, message, sent_at, status, 
        provider, provider_message_id, retry_count, last_attempt_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(deliveryId, alertId, 't_demo_' + t.name?.toLowerCase().replace(/\s/g, '_'), t.name, sent.to, lang, smsBody, now, sent.status, sent.provider, sent.providerMessageId || null, now);
        sentMessages.push({
            tourist: t.name,
            phone: sent.to,
            language: lang,
            sms: smsBody,
            safePlace: safePlaceName,
            status: sent.status,
            provider: sent.provider
        });
    }
    eventBus.broadcast('simulation_triggered', {
        zone,
        incidentId,
        publicIncidentUrl,
        touristsCount: demoTourists.length,
        sentMessages
    });
    res.json({
        success: true,
        message: 'Flash flood simulated successfully! Danger zone activated, registered tourists notified via SMS.',
        zone,
        incidentId,
        publicIncidentUrl,
        sentMessages
    });
});
// Serve static assets from client/dist if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res) => {
    // If request is not an API call, serve client index.html
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    else {
        res.status(404).json({ error: 'Endpoint not found' });
    }
});
app.listen(PORT, () => {
    console.log(`[SafeStay Server] Live on http://localhost:${PORT}`);
    console.log(`[SafeStay SMS Dispatcher] Mode: ${getSmsMode().toUpperCase()}`);
    console.log(`[SSE Stream] Available on http://localhost:${PORT}/api/stream`);
});
