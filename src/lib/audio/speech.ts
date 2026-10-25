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
    utterance.rate = 0.8; // Slow, calming tempo
    utterance.pitch = 0.85; // Warm, gentle pitch

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
