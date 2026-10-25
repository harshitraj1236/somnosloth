import type { VoiceStyle, VoicePreset } from "../../types/sleep";

/**
 * Curated Bedtime Narrator Profiles
 * Soft, low-tempo vocal settings mapped to local system voices.
 */
export const VOICE_PRESETS: Record<VoiceStyle, VoicePreset> = {
  willow: {
    id: "willow",
    name: "Willow",
    tone: "Soft & gentle cadence",
    pitch: 0.95,
    rate: 0.8,
    genderPreference: "female",
  },
  cedar: {
    id: "cedar",
    name: "Cedar",
    tone: "Deep & grounded warmth",
    pitch: 0.75,
    rate: 0.75,
    genderPreference: "male",
  },
  drift: {
    id: "drift",
    name: "Quiet Drift",
    tone: "Slow, hypnotic rhythm",
    pitch: 0.82,
    rate: 0.7,
    genderPreference: "neutral",
  },
};

export function getSystemVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Sentence-Chunked Native Speech Narrator
 * Uses window.speechSynthesis, splitting text into small sentences
 * to prevent mobile browser utterance truncation bugs.
 */
export class SleepNarrator {
  private isSpeaking = false;
  private currentUtteranceIndex = 0;
  private sentences: string[] = [];
  private wakeLock: any = null;
  private currentStyle: VoiceStyle = "willow";
  private customVoiceURI: string | null = null;

  setVoiceStyle(style: VoiceStyle): void {
    this.currentStyle = style;
  }

  setCustomVoiceURI(uri: string | null): void {
    this.customVoiceURI = uri;
  }

  getVoiceStyle(): VoiceStyle {
    return this.currentStyle;
  }

  getCustomVoiceURI(): string | null {
    return this.customVoiceURI;
  }

  async speak(text: string, onDone?: () => void): Promise<void> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onDone) onDone();
      return;
    }

    this.stop();

    // Acquire WakeLock while speaking to prevent screen from sleeping mid-sentence
    try {
      if ("wakeLock" in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request("screen");
      }
    } catch (e) {
      // WakeLock may fail if device policy or battery low
    }

    // Split by punctuation (. ! ? \n)
    const matches = text.match(/[^.!?\n]+[.!?\n]+/g);
    this.sentences = matches && matches.length > 0 ? matches : [text];
    this.currentUtteranceIndex = 0;
    this.isSpeaking = true;

    this.playNextSentence(onDone);
  }

  private playNextSentence(onDone?: () => void): void {
    if (!this.isSpeaking || this.currentUtteranceIndex >= this.sentences.length) {
      this.isSpeaking = false;
      this.releaseWakeLock();
      if (onDone) onDone();
      return;
    }

    const sentence = this.sentences[this.currentUtteranceIndex].trim();
    if (!sentence) {
      this.currentUtteranceIndex++;
      this.playNextSentence(onDone);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    const preset = VOICE_PRESETS[this.currentStyle] || VOICE_PRESETS.willow;
    utterance.rate = preset.rate;
    utterance.pitch = preset.pitch;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const allVoices = window.speechSynthesis.getVoices();
      let matchedVoice: SpeechSynthesisVoice | undefined;

      if (this.customVoiceURI) {
        matchedVoice = allVoices.find((v) => v.voiceURI === this.customVoiceURI);
      }

      if (!matchedVoice && allVoices.length > 0) {
        const englishVoices = allVoices.filter((v) => v.lang.startsWith("en"));
        const candidatePool = englishVoices.length > 0 ? englishVoices : allVoices;

        if (preset.genderPreference === "female") {
          matchedVoice =
            candidatePool.find((v) =>
              /female|samantha|serena|karen|victoria|zira|moira|fiona|susan/i.test(v.name)
            ) || candidatePool[0];
        } else if (preset.genderPreference === "male") {
          matchedVoice =
            candidatePool.find((v) =>
              /male|daniel|david|guy|alex|oliver|george|rishi/i.test(v.name)
            ) || candidatePool[0];
        } else {
          matchedVoice = candidatePool[0];
        }
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onend = () => {
      this.currentUtteranceIndex++;
      // Natural 450ms breath pause between sentences
      setTimeout(() => this.playNextSentence(onDone), 450);
    };

    utterance.onerror = () => {
      this.currentUtteranceIndex++;
      this.playNextSentence(onDone);
    };

    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  }

  resume(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  }

  stop(): void {
    this.isSpeaking = false;
    this.releaseWakeLock();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }

  get speaking(): boolean {
    return this.isSpeaking;
  }
}
