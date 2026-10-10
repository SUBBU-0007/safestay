import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, X, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../../shared/templates.js';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstOpen?: boolean;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose, isFirstOpen }) => {
  const { i18n } = useTranslation();

  if (!isOpen) return null;

  const handleSelectLanguage = (langCode: string, dir: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('safestay_lang', langCode);
    localStorage.setItem('safestay_has_chosen_lang', 'true');
    // Set document HTML direction (LTR or RTL for Arabic)
    document.documentElement.dir = dir;
    document.documentElement.lang = langCode;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-deep/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-teal-border w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-cream">
        {/* Header */}
        <div className="px-6 py-5 border-b border-teal-border/40 flex items-center justify-between bg-charcoal-deep">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-muted border border-accent/40 rounded-xl text-accent">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-light tracking-wide text-white">Select Emergency Language</h2>
              <p className="text-xs text-cream-subtle font-mono">
                {isFirstOpen
                  ? 'All localized SMS warnings, emergency banners, and audio synthesis will adapt to your choice.'
                  : 'Change language for UI, voice readouts, and crisis bulletins.'}
              </p>
            </div>
          </div>
          {!isFirstOpen && (
            <button
              onClick={onClose}
              className="text-cream-subtle hover:text-white p-1.5 rounded-xl hover:bg-teal-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Language Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code, lang.dir)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-accent/20 border-accent text-white shadow-md shadow-accent/20 font-bold'
                    : 'glass-card border-teal-border text-cream-muted hover:border-accent/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{lang.flag}</span>
                  <div>
                    <div className="text-xs text-white leading-tight">{lang.name}</div>
                    <div className="text-[10px] text-cream-subtle font-mono mt-0.5">{lang.native}</div>
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-accent" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
