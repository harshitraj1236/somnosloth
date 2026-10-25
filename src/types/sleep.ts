export type SoundscapeType = "rain" | "fire" | "cosmos";
export type SleepTimerMinutes = 15 | 30 | 45;
export type AIEngineType = "webgpu" | "ollama" | "fables";

export interface SoundscapePreset {
  id: SoundscapeType;
  title: string;
  subtitle: string;
  iconName: string;
  description: string;
}

export interface SleepSessionState {
  isActive: boolean;
  soundscape: SoundscapeType;
  timerMinutes: SleepTimerMinutes;
  remainingSeconds: number;
  storyTitle: string;
  storyText: string;
  engineUsed: AIEngineType;
  isSpeechActive: boolean;
  isPaused: boolean;
}

export interface BedtimeStory {
  title: string;
  text: string;
  engine: AIEngineType;
}
