import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, QrCode, Shield, CheckCircle2, ArrowRight, Bell, Phone } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../../shared/templates.js';
import { registerTourist } from '../services/api.js';

interface TouristRegisterProps {
  navigate: (route: string) => void;
  onRefreshData: () => void;
}

export const TouristRegister: React.FC<TouristRegisterProps> = ({ navigate, onRefreshData }) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [hotel, setHotel] = useState('Tea County Resort Munnar');
  const [lat, setLat] = useState<number>(10.0865);
  const [lng, setLng] = useState<number>(77.0570);
  const [notificationConsent, setNotificationConsent] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await registerTourist({
        name,
        phone,
        country,
        language,
        hotel,
        lat,
        lng,
        notificationConsent
      });
      localStorage.setItem('safestay_user_phone', phone);
      localStorage.setItem('safestay_lang', language);
      i18n.changeLanguage(language);
      setIsSuccess(true);
      onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="glass-panel border border-teal-border rounded-3xl p-6 sm:p-8 shadow-2xl text-cream space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-teal-muted border border-accent/40 rounded-2xl text-accent mb-1 shadow-inner">
            <QrCode className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-light text-white tracking-tight">{t('registerTitle')}</h1>
          <p className="text-xs text-cream-subtle font-mono leading-relaxed">
            Hotel reception QR check-in & location beacon for targeted emergency SMS evacuation warnings
          </p>
        </div>

        {isSuccess ? (
          <div className="glass-card border border-safe/60 rounded-2xl p-6 text-cream space-y-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-safe mx-auto animate-bounce" />
            <div>
              <h2 className="font-light text-xl text-white">Registration Confirmed!</h2>
              <p className="text-xs text-cream-muted mt-2 leading-relaxed font-mono">
                Your device is now linked to the District Emergency Broadcast System. In case of sudden flash flood, landslide, or cyclone advisories in your sector, you will receive targeted SMS alerts with safe shelter coordinates in your selected language.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 bg-safe hover:bg-safe-600 text-charcoal font-mono font-bold rounded-xl text-xs uppercase tracking-wider transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Proceed to Safety Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-cream-subtle mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Sharma / Jean-Luc Moreau"
                className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-accent"
                required
              />
            </div>

            <div>
              <label className="block text-cream-subtle mb-1 flex items-center justify-between">
                <span>Mobile Phone (International E.164 Format)</span>
                <span className="text-[10px] text-accent">Real SMS Destination</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210 or +14155552671"
                className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-accent"
                required
              />
              <span className="text-[10px] text-cream-subtle/70 mt-1 block">
                Include country code (+91 for India, +1 for US, +33 for France, etc.)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-cream-subtle mb-1">Country of Residence</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-cream-subtle mb-1">Alert Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-cream-subtle mb-1">Hotel / Stay Location</label>
              <input
                type="text"
                value={hotel}
                onChange={(e) => setHotel(e.target.value)}
                className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-cream-subtle mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-cream-subtle mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full bg-charcoal-deep border border-teal-border rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Notification Consent Checkbox */}
            <div className="p-3 rounded-xl glass-card border border-teal-border/70 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="consentCheck"
                checked={notificationConsent}
                onChange={(e) => setNotificationConsent(e.target.checked)}
                className="mt-0.5 accent-accent w-4 h-4 cursor-pointer"
              />
              <label htmlFor="consentCheck" className="text-[11px] text-cream-muted cursor-pointer leading-relaxed">
                <strong className="text-white">Emergency Broadcast Consent:</strong> I authorize District Disaster Authorities to send critical SMS crisis bulletins and evacuation instructions to this mobile phone number.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-accent hover:bg-accent-light text-charcoal font-bold rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-wider text-xs"
            >
              {isSubmitting ? 'Registering Device...' : 'Complete Crisis Check-in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
