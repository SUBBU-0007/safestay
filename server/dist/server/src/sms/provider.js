import { db } from '../db.js';
import { eventBus } from '../events.js';
/**
 * Validates and normalizes phone number to E.164 international standard.
 */
export function validateAndFormatPhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') {
        return { isValid: false, formatted: '', error: 'Phone number is empty or not a string' };
    }
    // Remove spaces, hyphens, dots, parentheses
    let cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, '');
    // If local 10-digit Indian number without country code, prepend +91
    if (/^[6-9]\d{9}$/.test(cleaned)) {
        cleaned = '+91' + cleaned;
    }
    else if (!cleaned.startsWith('+')) {
        // If digits only without +, assume +
        cleaned = '+' + cleaned;
    }
    // E.164 pattern: + followed by 8 to 15 digits
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    if (!e164Regex.test(cleaned)) {
        return {
            isValid: false,
            formatted: cleaned,
            error: `Invalid phone number format "${rawPhone}". Must be in international E.164 format (e.g. +919876543210 or +14155552671)`
        };
    }
    return { isValid: true, formatted: cleaned };
}
/**
 * Mock SMS Provider for local development and offline resilience testing.
 */
export class MockSmsProvider {
    name = 'MockSmsProvider';
    isReal = false;
    async sendSms(msg) {
        const phoneCheck = validateAndFormatPhone(msg.to);
        const targetPhone = phoneCheck.isValid ? phoneCheck.formatted : msg.to;
        const id = 'sms_mock_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        const status = 'simulated';
        const fullMsg = {
            id,
            to: targetPhone,
            body: msg.body,
            language: msg.language,
            timestamp: msg.timestamp || Date.now(),
            alertId: msg.alertId,
            touristName: msg.touristName,
            provider: 'MockSmsProvider',
            status,
            providerMessageId: 'SIM_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            success: true
        };
        const stmt = db.prepare(`
      INSERT INTO sms_log (id, to_phone, body, language, timestamp, alert_id, tourist_name, provider, status, provider_message_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(fullMsg.id, fullMsg.to, fullMsg.body, fullMsg.language, fullMsg.timestamp, fullMsg.alertId || null, fullMsg.touristName || null, fullMsg.provider, fullMsg.status, fullMsg.providerMessageId);
        // Broadcast SMS arrival immediately so the UI simulated inbox updates live
        eventBus.broadcast('sms_sent', fullMsg);
        console.log(`[SMS DISPATCHED via ${this.name}] To: ${fullMsg.to} | Lang: ${fullMsg.language} | Status: ${fullMsg.status}`);
        return fullMsg;
    }
    async getSentMessages() {
        const rows = db.prepare(`
      SELECT 
        id, 
        to_phone as "to", 
        body, 
        language, 
        timestamp, 
        alert_id as alertId, 
        tourist_name as touristName, 
        provider,
        status,
        provider_message_id as providerMessageId,
        error_code as errorCode,
        error_message as errorMessage,
        retry_count as retryCount
      FROM sms_log
      ORDER BY timestamp DESC
    `).all();
        return rows;
    }
}
/**
 * Real Twilio SMS Provider using direct HTTPS REST calls with zero heavy dependencies.
 */
export class TwilioProvider {
    name = 'TwilioProvider';
    isReal = true;
    accountSid;
    authToken;
    fromNumber;
    publicAppUrl;
    constructor() {
        this.accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
        this.authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
        this.fromNumber = (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || '').trim();
        this.publicAppUrl = (process.env.PUBLIC_APP_URL || '').trim();
    }
    hasValidCredentials() {
        return Boolean(this.accountSid && this.authToken && this.fromNumber);
    }
    async sendSms(msg) {
        const id = 'sms_tw_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        // 1. Phone number format validation
        const phoneCheck = validateAndFormatPhone(msg.to);
        if (!phoneCheck.isValid) {
            console.warn(`[TwilioProvider] Validation failed for phone: ${msg.to}: ${phoneCheck.error}`);
            const failedResult = {
                id,
                to: msg.to,
                body: msg.body,
                language: msg.language,
                timestamp: Date.now(),
                alertId: msg.alertId,
                touristName: msg.touristName,
                provider: 'TwilioProvider',
                status: 'failed',
                errorCode: 'INVALID_PHONE_FORMAT',
                errorMessage: phoneCheck.error,
                success: false
            };
            db.prepare(`
        INSERT INTO sms_log (id, to_phone, body, language, timestamp, alert_id, tourist_name, provider, status, error_code, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(failedResult.id, failedResult.to, failedResult.body, failedResult.language, failedResult.timestamp, failedResult.alertId || null, failedResult.touristName || null, failedResult.provider, failedResult.status, failedResult.errorCode, failedResult.errorMessage);
            eventBus.broadcast('sms_sent', failedResult);
            return failedResult;
        }
        const targetPhone = phoneCheck.formatted;
        // 2. Credential validation check
        if (!this.hasValidCredentials()) {
            const missingFields = [];
            if (!this.accountSid)
                missingFields.push('TWILIO_ACCOUNT_SID');
            if (!this.authToken)
                missingFields.push('TWILIO_AUTH_TOKEN');
            if (!this.fromNumber)
                missingFields.push('TWILIO_PHONE_NUMBER');
            const errMsg = `Twilio credentials missing in server environment: [${missingFields.join(', ')}]`;
            console.error(`[TwilioProvider] Error: ${errMsg}`);
            const failedResult = {
                id,
                to: targetPhone,
                body: msg.body,
                language: msg.language,
                timestamp: Date.now(),
                alertId: msg.alertId,
                touristName: msg.touristName,
                provider: 'TwilioProvider',
                status: 'failed',
                errorCode: 'MISSING_CREDENTIALS',
                errorMessage: errMsg,
                success: false
            };
            db.prepare(`
        INSERT INTO sms_log (id, to_phone, body, language, timestamp, alert_id, tourist_name, provider, status, error_code, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(failedResult.id, failedResult.to, failedResult.body, failedResult.language, failedResult.timestamp, failedResult.alertId || null, failedResult.touristName || null, failedResult.provider, failedResult.status, failedResult.errorCode, failedResult.errorMessage);
            eventBus.broadcast('sms_sent', failedResult);
            return failedResult;
        }
        // 3. Dispatch via Twilio Messages API
        try {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
            const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
            const params = new URLSearchParams({
                To: targetPhone,
                From: this.fromNumber,
                Body: msg.body
            });
            // Add status callback webhook if PUBLIC_APP_URL is present
            if (this.publicAppUrl) {
                const webhookUrl = `${this.publicAppUrl.replace(/\/$/, '')}/api/sms/webhook`;
                params.append('StatusCallback', webhookUrl);
            }
            console.log(`[TwilioProvider] Dispatching real SMS to ${targetPhone} via Twilio API...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });
            const data = await response.json();
            if (!response.ok) {
                // Twilio API returned error code (e.g. 21211, 21614, etc.)
                const errCode = data.code ? String(data.code) : `HTTP_${response.status}`;
                const errText = data.message || `Twilio request failed with status ${response.status}`;
                console.error(`[TwilioProvider] Twilio Error: [${errCode}] ${errText}`);
                const failedResult = {
                    id,
                    to: targetPhone,
                    body: msg.body,
                    language: msg.language,
                    timestamp: Date.now(),
                    alertId: msg.alertId,
                    touristName: msg.touristName,
                    provider: 'TwilioProvider',
                    status: 'failed',
                    errorCode: errCode,
                    errorMessage: errText,
                    success: false
                };
                db.prepare(`
          INSERT INTO sms_log (id, to_phone, body, language, timestamp, alert_id, tourist_name, provider, status, error_code, error_message)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(failedResult.id, failedResult.to, failedResult.body, failedResult.language, failedResult.timestamp, failedResult.alertId || null, failedResult.touristName || null, failedResult.provider, failedResult.status, failedResult.errorCode, failedResult.errorMessage);
                eventBus.broadcast('sms_sent', failedResult);
                return failedResult;
            }
            // Success: Twilio accepted the message
            const providerSid = data.sid;
            const twilioStatus = (data.status || 'queued').toLowerCase();
            const status = twilioStatus === 'delivered' ? 'delivered' : 'queued';
            console.log(`[TwilioProvider] Message accepted by Twilio! SID: ${providerSid} | Status: ${status}`);
            const successResult = {
                id,
                to: targetPhone,
                body: msg.body,
                language: msg.language,
                timestamp: Date.now(),
                alertId: msg.alertId,
                touristName: msg.touristName,
                provider: 'TwilioProvider',
                status,
                providerMessageId: providerSid,
                success: true
            };
            db.prepare(`
        INSERT INTO sms_log (id, to_phone, body, language, timestamp, alert_id, tourist_name, provider, status, provider_message_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(successResult.id, successResult.to, successResult.body, successResult.language, successResult.timestamp, successResult.alertId || null, successResult.touristName || null, successResult.provider, successResult.status, successResult.providerMessageId);
            eventBus.broadcast('sms_sent', successResult);
            return successResult;
        }
        catch (networkErr) {
            console.error('[TwilioProvider] Network transport error communicating with Twilio:', networkErr);
            const failedResult = {
                id,
                to: targetPhone,
                body: msg.body,
                language: msg.language,
                timestamp: Date.now(),
                alertId: msg.alertId,
                touristName: msg.touristName,
                provider: 'TwilioProvider',
                status: 'failed',
                errorCode: 'NETWORK_ERROR',
                errorMessage: networkErr.message || 'Network error communicating with Twilio',
                success: false
            };
            db.prepare(`
        INSERT INTO sms_log (id, to_phone, body, language, timestamp, alert_id, tourist_name, provider, status, error_code, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(failedResult.id, failedResult.to, failedResult.body, failedResult.language, failedResult.timestamp, failedResult.alertId || null, failedResult.touristName || null, failedResult.provider, failedResult.status, failedResult.errorCode, failedResult.errorMessage);
            eventBus.broadcast('sms_sent', failedResult);
            return failedResult;
        }
    }
    async getSentMessages() {
        const rows = db.prepare(`
      SELECT 
        id, 
        to_phone as "to", 
        body, 
        language, 
        timestamp, 
        alert_id as alertId, 
        tourist_name as touristName, 
        provider,
        status,
        provider_message_id as providerMessageId,
        error_code as errorCode,
        error_message as errorMessage,
        retry_count as retryCount
      FROM sms_log
      ORDER BY timestamp DESC
    `).all();
        return rows;
    }
}
// Runtime provider configuration state
let currentMode = process.env.SMS_MODE || 'mock';
let mockProviderInstance = new MockSmsProvider();
let twilioProviderInstance = new TwilioProvider();
export function setSmsMode(mode) {
    currentMode = mode;
    console.log(`[SafeStay SMS] Active dispatch mode switched to: ${mode.toUpperCase()}`);
}
export function getSmsMode() {
    return currentMode;
}
export function getSmsProvider() {
    if (currentMode === 'real') {
        return twilioProviderInstance;
    }
    return mockProviderInstance;
}
export function getSmsStatusSummary() {
    const twilio = twilioProviderInstance;
    const hasCreds = twilio.hasValidCredentials();
    const rawNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || '';
    const maskedNumber = rawNumber ? rawNumber.replace(/(\+\d{2,3})\d+(\d{4})/, '$1****$2') : 'Not Configured';
    return {
        mode: currentMode,
        hasCredentials: hasCreds,
        accountSidConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID),
        phoneNumber: maskedNumber,
        publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:5173',
        statusCallbackConfigured: Boolean(process.env.PUBLIC_APP_URL)
    };
}
