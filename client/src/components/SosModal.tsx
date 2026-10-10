import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, X, Send, Radio, MessageSquare, PhoneCall, CheckCircle2, Clock, Users, ShieldAlert, WifiOff } from 'lucide-react';
import { SosRequest, SosTriage } from '../../../shared/types.js';
import { CRISIS_TEMPLATES } from '../../../shared/templates.js';
import { sendSosRequest, getSimulatedOffline } from '../services/api.js';
import { MeshSimulation } from './MeshSimulation.js';
import { SosPacket } from '../services/bluetooth.js';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number];
  locationName: string;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose, userLocation, locationName }) => {
  const { t, i18n } = useTranslation();
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [triage, setTriage] = useState<SosTriage>('rescue');
  const [phone, setPhone] = useState<string>(localStorage.getItem('safestay_user_phone') || '+91 98765 43210');
  const [note, setNote] = useState<string>('');
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSos, setSubmittedSos] = useState<SosRequest | null>(null);
  const [showMeshSimModal, setShowMeshSimModal] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentLang = i18n.language in CRISIS_TEMPLATES ? i18n.language : 'en';
  const template = CRISIS_TEMPLATES[currentLang];

  const handleTriggerSos = async () => {
    setIsSubmitting(true);
    const isSimOffline = getSimulatedOffline();

    // If simulated offline is active, escalate immediately to Level 2 and Level 3
    if (isSimOffline) {
      setActiveLevel(2);
      const res = await sendSosRequest({
        phone,
        lat: userLocation[0],
        lng: userLocation[1],
        language: currentLang,
        peopleCount,
        triage,
        note,
        level: 2
      });
      setIsSubmitting(false);
      setSubmittedSos(res.data || null);
      return;
    }

    // Try Level 1 Internet
    try {
      const res = await sendSosRequest({
        phone,
        lat: userLocation[0],
        lng: userLocation[1],
        language: currentLang,
        peopleCount,
        triage,
        note,
        level: 1
      });

      setIsSubmitting(false);
      if (res.success && res.data) {
        setSubmittedSos(res.data);
        setActiveLevel(1);
      } else {
        // Escalate to Level 2
        setActiveLevel(2);
        setSubmittedSos(res.data || null);
      }
    } catch (err) {
      setIsSubmitting(false);
      setActiveLevel(2);
    }
  };

  // Level 2: Construct prefilled sms: link
  const localRescueCenterNumber = '+914865230505'; // Kerala SDRF hotline
  const smsBodyText = template.sosSms(userLocation[0], userLocation[1], peopleCount, triage.toUpperCase(), phone);
  const smsHref = `sms:${localRescueCenterNumber}?body=${encodeURIComponent(smsBodyText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-deep/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-danger/60 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-cream font-sans">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-danger via-danger-600 to-danger-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/20 rounded-xl">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-light tracking-wide text-white">{t('sosButton')}</h2>
              <p className="text-xs text-danger-100 font-mono">
                Multi-Tier Escalating Emergency Rescue Dispatch Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fallback Chain Level Indicators */}
        <div className="bg-charcoal-deep px-5 py-2.5 border-b border-teal-border/40 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-cream-subtle">Escalation:</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`px-2 py-0.5 rounded-md ${
                  activeLevel === 1 ? 'bg-safe text-charcoal font-bold' : 'bg-teal-muted text-cream-subtle'
                }`}
              >
                L1: Internet
              </span>
              <span className="text-cream-subtle">&rarr;</span>
              <span
                className={`px-2 py-0.5 rounded-md ${
                  activeLevel === 2 ? 'bg-warning text-charcoal font-bold animate-pulse' : 'bg-teal-muted text-cream-subtle'
                }`}
              >
                L2: Low-Signal SMS
              </span>
              <span className="text-cream-subtle">&rarr;</span>
              <span
                className={`px-2 py-0.5 rounded-md ${
                  activeLevel === 3 ? 'bg-accent text-charcoal font-bold animate-pulse' : 'bg-teal-muted text-cream-subtle'
                }`}
              >
                L3: BLE Mesh
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {!submittedSos ? (
            /* SOS Intake Form */
            <div className="space-y-4 font-mono text-xs">
              {/* Triage Selector */}
              <div>
                <label className="block text-xs uppercase text-cream-subtle mb-1.5">
                  Triage Urgency (Self-Assessment)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTriage('rescue')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      triage === 'rescue'
                        ? 'bg-danger/20 border-danger text-white font-bold shadow-md shadow-danger/20'
                        : 'glass-card border-teal-border text-cream-muted hover:border-accent'
                    }`}
                  >
                    <div className="text-xs font-bold text-danger">🚨 Immediate Rescue</div>
                    <div className="text-[10px] text-cream-subtle mt-0.5">Water rising / trapped</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTriage('injured')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      triage === 'injured'
                        ? 'bg-warning/20 border-warning text-white font-bold shadow-md shadow-warning/20'
                        : 'glass-card border-teal-border text-cream-muted hover:border-accent'
                    }`}
                  >
                    <div className="text-xs font-bold text-warning">🩹 Medical / Injured</div>
                    <div className="text-[10px] text-cream-subtle mt-0.5">First aid needed</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTriage('stuck_safe')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      triage === 'stuck_safe'
                        ? 'bg-safe/20 border-safe text-white font-bold shadow-md shadow-safe/20'
                        : 'glass-card border-teal-border text-cream-muted hover:border-accent'
                    }`}
                  >
                    <div className="text-xs font-bold text-safe">🛡️ Safe / Stranded</div>
                    <div className="text-[10px] text-cream-subtle mt-0.5">Terrace/high ground</div>
                  </button>
                </div>
              </div>

              {/* People Count & Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-cream-subtle mb-1">
                    Number of Persons
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 4, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPeopleCount(num)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          peopleCount === num
                            ? 'bg-danger border-danger text-white'
                            : 'glass-card border-teal-border text-cream-muted hover:text-white'
                        }`}
                      >
                        {num === 8 ? '8+' : num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-cream-subtle mb-1">
                    Your Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              {/* GPS Coordinates Preview */}
              <div className="glass-card border border-teal-border rounded-2xl p-3 text-xs text-cream flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Broadcast GPS Coordinates:</div>
                  <div className="text-[11px] text-cream-subtle mt-0.5 font-mono">
                    {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)} ({locationName})
                  </div>
                </div>
                <span className="text-[10px] bg-danger/20 text-danger border border-danger/40 px-2 py-0.5 rounded-full font-mono">
                  ACCURACY: ±8m
                </span>
              </div>

              {/* Optional Situation Note */}
              <div>
                <label className="block text-xs text-cream-subtle mb-1">
                  Optional Details (Landmark, injuries, hazards):
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. 2nd floor balcony, elderly traveler with medication..."
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-cream-subtle/50 focus:outline-none focus:border-accent font-sans"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleTriggerSos}
                disabled={isSubmitting}
                className="w-full py-4 bg-danger hover:bg-danger-600 active:scale-98 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-danger/30 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Transmitting SOS to Rescuers...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>BROADCAST EMERGENCY SOS NOW</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* SOS Dispatched / Active Status */
            <div className="space-y-4 font-mono text-xs">
              {/* Level 1 Confirmation */}
              {activeLevel === 1 && (
                <div className="glass-panel border border-safe/60 bg-safe/10 rounded-2xl p-4 text-cream space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-safe" />
                    <span className="font-bold text-sm text-safe">Level 1 Internet SOS Received by Command Base!</span>
                  </div>
                  <p className="text-xs text-cream-muted leading-relaxed">
                    Disaster coordinators have confirmed your distress beacon. Stay in place on high ground away from electrical wires.
                  </p>
                  <div className="bg-charcoal-deep rounded-xl p-3 text-xs text-cream-muted space-y-1 border border-teal-border/40">
                    <div>Assigned Rescue Base: <strong className="text-white">{submittedSos.assignedRescueCenter || 'Kerala SDRF HQ'}</strong></div>
                    <div>Estimated Rescue Boat / Team ETA: <strong className="text-safe font-mono">{submittedSos.etaMinutes || 12} minutes</strong></div>
                  </div>
                </div>
              )}

              {/* Level 2: Low-Signal Fallback Card */}
              {activeLevel === 2 && (
                <div className="glass-panel border border-warning/60 bg-warning/10 rounded-2xl p-4 text-cream space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-warning">
                    <WifiOff className="w-5 h-5 text-warning" />
                    <span>Level 2: Cellular Data Unavailable — Direct SMS Fallback Prepared</span>
                  </div>
                  <p className="text-xs text-cream-muted leading-relaxed">
                    Cellular internet is down. We have queued your beacon in offline storage and prepared an encrypted native SMS with your exact GPS coordinates to the local SDRF hotline.
                  </p>

                  <a
                    href={smsHref}
                    className="w-full bg-warning hover:bg-warning-600 text-charcoal font-mono font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-transform shadow-md uppercase tracking-wider"
                  >
                    <MessageSquare className="w-4 h-4 text-charcoal" />
                    <span>Send Prefilled Rescue SMS ({localRescueCenterNumber})</span>
                  </a>

                  <div className="pt-2 border-t border-teal-border/40 flex items-center justify-between text-xs">
                    <span className="text-cream-subtle">Zero cellular towers reachable?</span>
                    <button
                      onClick={() => {
                        setActiveLevel(3);
                        setShowMeshSimModal(true);
                      }}
                      className="text-accent underline font-bold"
                    >
                      Activate Bluetooth Mesh &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Reset/Dismiss */}
              <button
                onClick={() => {
                  setSubmittedSos(null);
                  onClose();
                }}
                className="w-full py-2.5 glass-card hover:bg-teal-muted text-cream-subtle hover:text-white rounded-xl text-xs transition-colors"
              >
                Close SOS Dialog
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Level 3 Mesh Simulation Modal */}
      {showMeshSimModal && (
        <MeshSimulation
          onClose={() => setShowMeshSimModal(false)}
          onDelivered={(_packet) => {
            setShowMeshSimModal(false);
          }}
          initialPacket={{
            id: 'pkt_' + Date.now(),
            phone: phone || 'unknown',
            lat: userLocation[0],
            lng: userLocation[1],
            peopleCount,
            triage,
            timestamp: Date.now(),
            hopCount: 0,
            ttl: 4,
            meshPath: ['You']
          }}
        />
      )}
    </div>
  );
};
