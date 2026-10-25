"use client";

import { useState, useEffect, useRef } from "react";
import type { SoundscapeType, SleepTimerMinutes, AIEngineType, VoiceStyle } from "../types/sleep";
import { ProceduralSoundscape } from "../lib/audio/procedural";
import { SleepNarrator, VOICE_PRESETS } from "../lib/audio/speech";
import { storyEngine } from "../lib/story/engine";
import { checkDistressHeuristic, CRISIS_RESOURCE } from "../lib/safety/crisis";

interface SoundscapeOption {
  id: SoundscapeType;
  title: string;
  description: string;
  renderIcon: () => JSX.Element;
}

const SOUNDSCAPES: SoundscapeOption[] = [
  {
    id: "rain",
    title: "Rain on leaves",
    description: "Gentle brownian rainfall through the forest canopy",
    renderIcon: () => (
      <svg
        className="w-5 h-5 shrink-0 text-[#b3a78f]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4.5 19.5C4.5 19.5 6.5 11 14 7C17 5.5 19.5 5 19.5 5C19.5 5 19 7.5 17.5 10.5C14 18 6.5 19.5 4.5 19.5Z" />
        <path d="M5 19C8 15.5 11.5 12.5 14 10.5" />
        <path d="M9 4.5C9 5.2 8.4 5.8 7.7 5.8C7 5.8 6.5 5.2 6.5 4.5C6.5 3.8 7.7 2 7.7 2C7.7 2 9 3.8 9 4.5Z" />
        <path d="M19.5 15C19.5 15.7 18.9 16.2 18.2 16.2C17.5 16.2 17 15.7 17 15C17 14.3 18.2 12.5 18.2 12.5C18.2 12.5 19.5 14.3 19.5 15Z" />
      </svg>
    ),
  },
  {
    id: "fire",
    title: "Cozy hearth",
    description: "Soft wood fire crackle with resonant low warmth",
    renderIcon: () => (
      <svg
        className="w-5 h-5 shrink-0 text-[#b3a78f]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4.5 19.5L19.5 19.5" />
        <path d="M5.5 21.5L18.5 17.5" />
        <path d="M12 3.5C9.5 7 7.5 9.5 7.5 12.8C7.5 15.8 9.5 17.8 12 17.8C14.5 17.8 16.5 15.8 16.5 12.8C16.5 10.2 15.2 8.2 13.8 6.2C13.2 8.2 12 9.2 11 10.2C10.5 8.8 11 6.8 12 3.5Z" />
      </svg>
    ),
  },
  {
    id: "cosmos",
    title: "Deep cosmos",
    description: "Slow two-hertz delta drone for deep rest",
    renderIcon: () => (
      <svg
        className="w-5 h-5 shrink-0 text-[#b3a78f]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2.5C12 7 13 8 17.5 8C13 8 12 9 12 13.5C12 9 11 8 6.5 8C11 8 12 7 12 2.5Z" />
        <path d="M17.5 14.5C17.5 16.5 18 17 20 17C18 17 17.5 17.5 17.5 19.5C17.5 17.5 17 17 15 17C17 17 17.5 16.5 17.5 14.5Z" />
        <path d="M6.5 15C6.5 16.2 6.8 16.5 8 16.5C6.8 16.5 6.5 16.8 6.5 18C6.5 16.8 6.2 16.5 5 16.5C6.2 16.5 6.5 16.2 6.5 15Z" />
      </svg>
    ),
  },
];

const VOICE_OPTIONS: { id: VoiceStyle; name: string; description: string }[] = [
  {
    id: "willow",
    name: "Willow",
    description: "Soft & gentle",
  },
  {
    id: "cedar",
    name: "Cedar",
    description: "Deep & grounded",
  },
  {
    id: "drift",
    name: "Quiet Drift",
    description: "Slow & hypnotic",
  },
];

export default function Home() {
  const [soundscape, setSoundscape] = useState<SoundscapeType>("rain");
  const [timerMinutes, setTimerMinutes] = useState<SleepTimerMinutes>(30);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("willow");
  const [customVoiceURI, setCustomVoiceURI] = useState<string | null>(null);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSystemVoicePicker, setShowSystemVoicePicker] = useState(false);
  const [brainDump, setBrainDump] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyExcerpt, setStoryExcerpt] = useState("");
  const [activeEngine, setActiveEngine] = useState<AIEngineType>("fables");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showDistressAlert, setShowDistressAlert] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  // Audio references
  const soundscapeRef = useRef<ProceduralSoundscape | null>(null);
  const narratorRef = useRef<SleepNarrator | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    soundscapeRef.current = new ProceduralSoundscape();
    narratorRef.current = new SleepNarrator();

    // Load offline system voices
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setSystemVoices(voices);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Check service worker status
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (navigator.serviceWorker.controller) {
        setIsOfflineReady(true);
      } else {
        navigator.serviceWorker.ready.then(() => setIsOfflineReady(true));
      }

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setIsOfflineReady(true);
      });
    }

    return () => {
      soundscapeRef.current?.stop();
      narratorRef.current?.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Check distress trigger on brain dump text change
  useEffect(() => {
    if (checkDistressHeuristic(brainDump)) {
      setShowDistressAlert(true);
    } else {
      setShowDistressAlert(false);
    }
  }, [brainDump]);

  // Volume slider sync
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundscapeRef.current?.setVolume(newVol);
  };

  // Voice selection handlers
  const handleVoiceChange = (style: VoiceStyle) => {
    setVoiceStyle(style);
    setCustomVoiceURI(null);
    narratorRef.current?.setVoiceStyle(style);
    narratorRef.current?.setCustomVoiceURI(null);
  };

  const handleCustomVoiceChange = (uri: string) => {
    if (!uri) {
      setCustomVoiceURI(null);
      narratorRef.current?.setCustomVoiceURI(null);
    } else {
      setCustomVoiceURI(uri);
      narratorRef.current?.setCustomVoiceURI(uri);
    }
  };

  // Start the Wind Down Routine
  const handleStartWindDown = async () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);
    const totalSeconds = timerMinutes * 60;
    setRemainingSeconds(totalSeconds);

    // 1. Start procedural Web Audio ambient soundscape
    soundscapeRef.current?.init(soundscape, volume);

    // 2. Fetch or generate bedtime story
    const story = await storyEngine.generateStory(soundscape, brainDump);
    setStoryTitle(story.title);
    setStoryExcerpt(story.text.slice(0, 140) + "...");
    setActiveEngine(story.engine);

    // 3. Configure voice and begin sentence-chunked native speech
    narratorRef.current?.setVoiceStyle(voiceStyle);
    narratorRef.current?.setCustomVoiceURI(customVoiceURI);
    narratorRef.current?.speak(story.text);

    // 4. Drive volume fade with linearRampToValueAtTime
    soundscapeRef.current?.fadeToSilence(totalSeconds, () => {
      handleStop();
    });

    // 5. Visual countdown timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setRemainingSeconds(0);
    soundscapeRef.current?.stop();
    narratorRef.current?.stop();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const currentSoundTitle =
    SOUNDSCAPES.find((s) => s.id === soundscape)?.title || "Rain on leaves";

  const currentVoiceName = customVoiceURI
    ? systemVoices.find((v) => v.voiceURI === customVoiceURI)?.name || "Custom"
    : VOICE_PRESETS[voiceStyle].name;

  return (
    <main className="min-h-screen max-w-[560px] mx-auto px-5 py-8 md:py-12 flex flex-col justify-between">
      <div className="space-y-7">
        {/* Header */}
        <header className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <h1 className="font-serif text-[30px] font-normal tracking-tight text-[#ebe3d2] leading-tight">
              SomnoSloth
            </h1>
            {isOfflineReady && (
              <div className="flex items-center gap-1.5 text-xs text-[#b3a78f]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9aab6a]" />
                <span>Works offline</span>
              </div>
            )}
          </div>
          <p className="text-sm text-[#b3a78f]">
            A quiet bedtime companion for when doing nothing is the whole point.
          </p>
        </header>

        {/* Section 1: Soundscape Picker */}
        <section className="space-y-2.5">
          <h2 className="font-serif text-[18px] text-[#ebe3d2] font-normal">
            Pick a sound
          </h2>
          <div
            role="radiogroup"
            aria-label="Pick a sound"
            className="space-y-2"
          >
            {SOUNDSCAPES.map((item) => {
              const isSelected = soundscape === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isPlaying}
                  onClick={() => setSoundscape(item.id)}
                  className={`w-full p-3.5 rounded-[6px] border text-left flex items-center justify-between gap-3.5 transition-colors duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#9aab6a] bg-[#28221b] text-[#ebe3d2]"
                      : "border-[#3a3228] bg-[#1f1a14] hover:bg-[#262019] text-[#b3a78f] disabled:opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {item.renderIcon()}
                    <div>
                      <div className="text-[15px] font-medium text-[#ebe3d2]">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#b3a78f] pt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isSelected ? (
                    <svg
                      className="w-4 h-4 text-[#9aab6a] shrink-0"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                    </svg>
                  ) : (
                    <span
                      className="w-4 h-4 rounded-[3px] border border-[#3a3228] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Bedtime Voice */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-[18px] text-[#ebe3d2] font-normal">
              Bedtime voice
            </h2>
            {systemVoices.length > 0 && (
              <button
                type="button"
                disabled={isPlaying}
                onClick={() => setShowSystemVoicePicker(!showSystemVoicePicker)}
                className="text-xs text-[#b3a78f] hover:text-[#ebe3d2] transition-colors cursor-pointer"
              >
                {showSystemVoicePicker ? "Hide system voices" : "System voices"}
              </button>
            )}
          </div>

          <div
            role="radiogroup"
            aria-label="Bedtime voice"
            className="grid grid-cols-3 gap-2"
          >
            {VOICE_OPTIONS.map((item) => {
              const isSelected = voiceStyle === item.id && !customVoiceURI;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isPlaying}
                  onClick={() => handleVoiceChange(item.id)}
                  className={`p-3 rounded-[6px] border text-left flex flex-col justify-between transition-colors duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#9aab6a] bg-[#28221b] text-[#ebe3d2]"
                      : "border-[#3a3228] bg-[#1f1a14] hover:bg-[#262019] text-[#b3a78f] disabled:opacity-40"
                  }`}
                >
                  <div className="text-[14px] font-medium text-[#ebe3d2]">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-[#b3a78f] pt-0.5">
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>

          {showSystemVoicePicker && systemVoices.length > 0 && (
            <div className="pt-1.5 space-y-1">
              <label
                htmlFor="system-voice-select"
                className="text-xs text-[#b3a78f] block"
              >
                Or pick an installed offline voice:
              </label>
              <select
                id="system-voice-select"
                disabled={isPlaying}
                value={customVoiceURI || ""}
                onChange={(e) => handleCustomVoiceChange(e.target.value)}
                className="w-full text-xs p-2 rounded-[6px] border border-[#3a3228] bg-[#1a1611] text-[#ebe3d2] focus:outline-none"
              >
                <option value="">
                  Use preset ({VOICE_PRESETS[voiceStyle].name})
                </option>
                {systemVoices
                  .filter((v) => v.lang.startsWith("en") || !v.lang)
                  .map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </section>

        {/* Section 3: Timer Segmented Control */}
        <section className="space-y-2.5">
          <h2 className="font-serif text-[18px] text-[#ebe3d2] font-normal">
            How long should it play?
          </h2>
          <div className="space-y-1.5">
            <div className="text-xs text-[#b3a78f]">Fade out over</div>
            <div
              role="radiogroup"
              aria-label="Fade out over"
              className="border border-[#3a3228] bg-[#1f1a14] rounded-[6px] p-1 flex items-stretch gap-1"
            >
              {([15, 30, 45] as SleepTimerMinutes[]).map((mins) => {
                const isSelected = timerMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isPlaying}
                    onClick={() => setTimerMinutes(mins)}
                    className={`flex-1 py-2 px-3 text-sm rounded-[4px] transition-colors duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-[#28221b] text-[#ebe3d2] border border-[#9aab6a] font-medium"
                        : "text-[#b3a78f] hover:text-[#ebe3d2] hover:bg-[#262019] border border-transparent disabled:opacity-40"
                    }`}
                  >
                    {mins} min
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 4: Brain Dump Notepad */}
        <section className="space-y-2.5">
          <h2 className="font-serif text-[18px] text-[#ebe3d2] font-normal">
            Anything on your mind?
          </h2>
          <div className="rounded-[12px] border border-[#3a3228] bg-[#1a1611] p-3">
            <textarea
              disabled={isPlaying}
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              rows={3}
              placeholder="Leave any restless thoughts here. You can pick them back up tomorrow."
              className="notepad-textarea w-full text-[15px] p-1 text-[#ebe3d2] placeholder:font-serif placeholder:italic placeholder:text-[#8a7f6c] border-0 focus:outline-none resize-none leading-[28px] disabled:opacity-40"
            />
          </div>

          {/* Crisis alert banner */}
          {showDistressAlert && (
            <div className="rounded-[12px] border border-[#c48a5e] bg-[#221a15] p-4 text-sm text-[#ebe3d2] space-y-2">
              <p className="font-medium text-[#c48a5e]">
                You are not alone.
              </p>
              <p className="text-xs text-[#ebe3d2] leading-relaxed">
                {CRISIS_RESOURCE.message}
              </p>
              <a
                href={CRISIS_RESOURCE.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-medium text-[#c48a5e] underline underline-offset-4 hover:text-[#ebe3d2]"
              >
                {CRISIS_RESOURCE.actionText} →
              </a>
              <p className="text-[11px] text-[#b3a78f] italic pt-1">
                {CRISIS_RESOURCE.disclaimer}
              </p>
            </div>
          )}
        </section>

        {/* Primary Action Button & Live Summary */}
        <div className="space-y-2 pt-1">
          <div className="text-sm text-[#b3a78f]">
            {currentSoundTitle}, {currentVoiceName} voice, fading out over {timerMinutes} minutes
          </div>
          <button
            type="button"
            onClick={handleStartWindDown}
            className={`px-6 py-3.5 rounded-[6px] text-sm font-medium transition-colors duration-200 cursor-pointer ${
              isPlaying
                ? "bg-[#c48a5e] hover:bg-[#b2794e] text-[#16130f]"
                : "bg-[#9aab6a] hover:bg-[#8d9e5f] text-[#16130f]"
            }`}
          >
            {isPlaying ? "Stop winding down" : "Start winding down"}
          </button>
        </div>

        {/* Active Session Panel */}
        {isPlaying && (
          <section className="rounded-[12px] border border-[#3a3228] bg-[#1f1a14] p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#9aab6a]">
                <span className="w-2 h-2 rounded-full bg-[#9aab6a]" />
                <span>Playing</span>
              </div>
              <div className="text-[#b3a78f]">
                Fading out in {formatCountdown(remainingSeconds)}
              </div>
            </div>

            {storyTitle && (
              <div className="space-y-1">
                <h3 className="font-serif text-[17px] text-[#ebe3d2] font-normal">
                  {storyTitle}
                </h3>
                <p className="font-serif italic text-xs text-[#b3a78f] leading-relaxed">
                  &ldquo;{storyExcerpt}&rdquo;
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <label
                htmlFor="volume-slider"
                className="text-xs text-[#b3a78f] shrink-0"
              >
                Volume
              </label>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#3a3228] rounded-[2px]"
              />
              <span className="text-xs text-[#b3a78f] w-8 text-right font-normal">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </section>
        )}

        {/* Information Disclosure */}
        <div className="border-t border-[#3a3228] pt-4">
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs text-[#b3a78f] hover:text-[#ebe3d2] flex items-center gap-1.5 transition-colors duration-200 cursor-pointer"
          >
            <span>Why slow & steady works</span>
            <span aria-hidden="true" className="text-[9px]">
              {showInfo ? "▲" : "▼"}
            </span>
          </button>
          {showInfo && (
            <p className="pt-2 text-xs text-[#b3a78f] leading-relaxed max-w-lg">
              SomnoSloth synthesizes ambient soundscapes and bedtime journeys
              directly on your device with no internet connection required. Once
              loaded, you can turn on airplane mode and fall asleep without midnight
              notifications.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#3a3228] mt-8 pt-5 text-xs text-[#b3a78f] leading-relaxed">
        SomnoSloth is an offline relaxation aid, not medical care. If you are
        having a difficult time, free and confidential support is available at{" "}
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noreferrer"
          className="underline text-[#9aab6a] hover:text-[#ebe3d2]"
        >
          findahelpline.com
        </a>
        .
      </footer>
    </main>
  );
}
