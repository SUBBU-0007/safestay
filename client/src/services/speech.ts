/**
 * Web Speech API service to read critical alerts aloud in the user's chosen language.
 */

const LANG_VOICE_MAP: Record<string, string[]> = {
  en: ['en-US', 'en-GB', 'en-IN', 'en'],
  hi: ['hi-IN', 'hi'],
  ta: ['ta-IN', 'ta'],
  ml: ['ml-IN', 'ml'],
  te: ['te-IN', 'te'],
  kn: ['kn-IN', 'kn'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  fr: ['fr-FR', 'fr-CA', 'fr'],
  de: ['de-DE', 'de'],
  es: ['es-ES', 'es-MX', 'es'],
  ar: ['ar-SA', 'ar-AE', 'ar-EG', 'ar'],
  zh: ['zh-CN', 'zh-TW', 'zh'],
  ja: ['ja-JP', 'ja'],
  ru: ['ru-RU', 'ru']
};

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, langCode: string, onEnd?: () => void, onError?: () => void) {
    if (!this.synth) {
      console.warn('[Web Speech] SpeechSynthesis is not supported on this browser.');
      onError?.();
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower for clarity during emergencies
    utterance.pitch = 1.0;

    // Pick appropriate voice if loaded
    const voices = this.synth.getVoices();
    const targetTags = LANG_VOICE_MAP[langCode] || ['en-US'];

    const matchedVoice = voices.find((v) =>
      targetTags.some((tag) => v.lang.toLowerCase().startsWith(tag.toLowerCase()))
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = targetTags[0] || 'en-US';
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.error('[Web Speech Error]:', e);
      this.isSpeaking = false;
      onError?.();
    };

    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  speaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechService = new SpeechService();
