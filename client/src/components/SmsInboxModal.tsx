import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, X, ExternalLink, Smartphone, Clock, ShieldCheck, Radio } from 'lucide-react';
import { SmsMessage } from '../../../shared/types.js';

interface SmsInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: SmsMessage[];
  onOpenSmsLink: (url: string) => void;
}

export const SmsInboxModal: React.FC<SmsInboxModalProps> = ({ isOpen, onClose, messages, onOpenSmsLink }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-deep/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-teal-border w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-teal-border/40 bg-charcoal-deep flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-muted border border-accent/40 rounded-xl text-accent">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-light text-white tracking-wide">Tourist Device SMS Inbox</h2>
                <span className="text-[10px] bg-teal-muted text-accent px-2 py-0.5 rounded-full font-mono border border-teal-border">
                  {messages.length} Messages
                </span>
              </div>
              <p className="text-xs text-cream-subtle font-mono">
                Receives automated cellular SMS warnings in native languages without opening browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-cream-subtle hover:text-white p-1.5 rounded-xl hover:bg-teal-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-cream-subtle text-xs font-mono">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-teal-border" />
              <div>No SMS received yet.</div>
              <div className="text-[11px] mt-1 text-cream-subtle/70">
                Trigger &quot;Send Alert&quot; or &quot;Simulate Flash Flood&quot; in the Admin Portal to dispatch live SMS broadcasts.
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              // Extract public link if present in message body
              const urlMatch = msg.body.match(/https?:\/\/[^\s]+/);
              const linkUrl = urlMatch ? urlMatch[0] : null;
              const isRealTwilio = msg.provider === 'TwilioProvider';

              return (
                <div
                  key={msg.id}
                  className="glass-card border border-teal-border hover:border-accent/40 rounded-2xl p-4 transition-colors space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{msg.to}</span>
                      {msg.touristName && (
                        <span className="text-[10px] bg-teal-muted px-2 py-0.5 rounded-md text-cream-muted">
                          {msg.touristName}
                        </span>
                      )}
                      <span className="text-[10px] uppercase bg-teal-dark text-accent border border-teal-border px-1.5 py-0.2 rounded font-mono">
                        {msg.language}
                      </span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded-full font-mono border ${
                        isRealTwilio ? 'bg-safe/20 text-safe border-safe/40' : 'bg-teal-muted text-cream-subtle border-teal-border'
                      }`}>
                        {isRealTwilio ? 'Twilio Cellular' : 'Mock Simulator'}
                      </span>
                    </div>
                    <span className="text-[10px] text-cream-subtle flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-accent" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="bg-charcoal-deep/90 border border-teal-border/50 rounded-xl p-3 text-xs text-cream leading-relaxed font-sans select-all">
                    {msg.body}
                  </div>

                  {linkUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-safe flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Emergency Link
                      </span>
                      <button
                        onClick={() => {
                          onOpenSmsLink(linkUrl);
                          onClose();
                        }}
                        className="text-xs font-mono text-accent hover:text-white font-bold underline flex items-center gap-1 transition-colors"
                      >
                        <span>Open Public Incident Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
