# SomnoSloth: The Zero-Cloud Offline Wind-Down Companion That Puts You to Sleep

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

---

## What I Built

Every night, millions of developers and knowledge workers experience the exact same struggle: after spending 8 to 12 hours staring into code editors and terminals, they lie in bed with racing thoughts, falling into "revenge bedtime procrastination." 

Commercial sleep apps like Calm and Headspace promise to help, but they lock basic white noise and bedtime stories behind recurring annual subscriptions, push pushy upsells, and require an active internet connection that leaves your bedroom exposed to late-night notification pings.

### Enter SomnoSloth 🦥
In honor of **International Sloth Day (October 20)**, **SomnoSloth** is an open-source, zero-cloud relaxation companion engineered to reward sheer laziness by doing the entire wind-down routine for you.

You tap **one button**, set your phone face down on the nightstand, and close your eyes. SomnoSloth takes over:
1. **Procedural Ambient Soundscapes:** Synthesizes non-looping rain, crackling hearth fire, and deep cosmic drones directly inside the browser using the **Web Audio API**—zero audio files to download, zero buffering, and non-repetitive organic sound.
2. **Slow Bedtime Journeys:** Generates calming, slow-paced bedtime narratives designed with zero conflict or cliffhangers, anchoring your thoughts until you drift off.
3. **Hardware-Accurate Sleep Fade:** Gradually lowers voice volume and sound frequencies across 15, 30, or 45 minutes using audio hardware clocks, fading smoothly into total silence.
4. **Bedtime Brain Dump with Crisis Guardrail:** An offline space to type and offload whatever thoughts are keeping you awake. Includes non-judgmental safety heuristics linking to free global support via [findahelpline.com](https://findahelpline.com).
5. **Works Offline Once Loaded:** Cached through a minimal Service Worker, SomnoSloth functions in true **Airplane Mode** so you can turn off Wi-Fi and sleep without distractions.

---

## Demo

- **Live Application:** [https://somnosloth.onrender.com](https://somnosloth.onrender.com)
- **Local Port:** `http://localhost:1094`
- **Mobile Ergonomics:** Engineered with an OLED deep-black theme (`#090A0F`) and single-thumb 48px touch targets for effortless one-handed use in a dark bedroom.

### The 1-Tap Wind-Down Routine:
1. Select your preferred soundscape (*🌧️ Rain on Leaves*, *🔥 Cozy Hearth*, or *🌌 Deep Cosmos*).
2. Choose your sleep fade timer (*15 min*, *30 min*, or *45 min*).
3. Tap **`[ ▶ BEGIN WIND DOWN (LAZY MODE) ]`** and set your phone down.
4. The audio plays, the story narrates at a gentle 0.8x cadence, and the audio hardware smoothly ramps down to silence as you sleep.

---

## Code

SomnoSloth is 100% open-source under the MIT License:

**GitHub Repository:** [https://github.com/harshitraj1236/somnosloth](https://github.com/harshitraj1236/somnosloth)

### Technical Stack:
- **Frontend & App Shell:** Next.js 14 (App Router), Tailwind CSS, Lucide Icons
- **In-Browser Open AI:** Google Gemma 2 (2B) executing locally in the browser via WebGPU (`@mlc-ai/web-llm`) + desktop Ollama bridge (`http://localhost:11434`) + curated offline sleep fables engine
- **Procedural Sound Engine:** Native Web Audio API mathematical brown/pink noise synthesis (0 MB assets)
- **Voice Synthesis:** Native Web Speech API (`SpeechSynthesis`) with sentence-level chunking to eliminate mobile browser utterance cutoff bugs
- **Offline PWA Shell:** Service Worker (`sw.js`) precaching static HTML/JS/CSS for offline execution
- **Deployment:** Multi-stage production `Dockerfile` running on Render

---

## How I Built It

SomnoSloth was built around three principles of radical simplicity:

### 1. The Zero-Asset Procedural Audio Engine
Most soundscape apps stream multi-megabyte MP3 files that stutter, consume mobile bandwidth, and have noticeable loop seams. 

SomnoSloth generates soundscapes mathematically in real time through the **Web Audio API**:
- **Rain on Leaves:** Generates brownian integrated noise passed through a custom biquad lowpass filter (650 Hz cutoff with Q=1.0).
- **Cozy Hearth:** Generates brownian noise with randomized impulse crackle through a resonant bandpass filter (320 Hz cutoff with Q=1.8).
- **Deep Cosmos:** Synthesizes two pure sine oscillators at 108 Hz and 110 Hz, generating an organic 2 Hz binaural delta rhythm.

### 2. The Sentence-Chunked Sleep Narrator
A common bug in mobile browser `SpeechSynthesis` is that long paragraphs get abruptly truncated mid-sentence by browser audio daemons. SomnoSloth splits all bedtime narratives into individual sentence chunks (`story.match(/[^.!?\n]+[.!?\n]+/g)`) and queues them sequentially using `onend` callbacks with natural 450ms breath pauses, spoken at a relaxed 0.8x rate and 0.85x pitch.

### 3. Hardware-Accurate Sleep Fade
Rather than using JavaScript `setInterval` timers (which drift or stall when phone screens lock), volume fading is scheduled directly onto the audio hardware clock:
```typescript
const now = this.ctx.currentTime;
this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
this.masterGain.gain.linearRampToValueAtTime(0.0001, now + durationSeconds);
```

---

## Why Does Open Innovation Matter?

### 1. Genuine Airplane Mode (Zero Cloud Dependency)
Commercial sleep apps stream audio and models from remote servers. This requires you to keep Wi-Fi or cellular data active beside your pillow, leaving you vulnerable to notification pings that shatter sleep cycles. 

By combining open-weight models (**Google Gemma 2** running via WebGPU / Ollama), native **Web Audio API** procedural sounds, and **browser SpeechSynthesis**, SomnoSloth operates without any active internet connection. You can load it once, enable **Airplane Mode**, and sleep in total peace.

### 2. Complete Emotional Privacy
When users type their worries into bedtime apps, they are sharing intimate thoughts. Cloud-based LLMs send that text over the wire to remote servers. By keeping inference completely on-device, your midnight thoughts never leave your hardware.

### 3. Free Forever Unit Economics
Running proprietary cloud speech and completion APIs for every bedtime session costs ongoing API fees. Using open weights and native browser synthesis costs **$0.00 per session**, making a permanent, ad-free tool viable without subscriptions.

---

## Prize Categories

- 🏆 **Best Use of Gemma ($200):** Leverages Google's **Gemma 2 (2B)** open-weight model to generate sensory, slow-paced bedtime journeys that disengage cognitive hyper-arousal.
- 🏆 **Best Use of Render ($200):** Deployed as a production-grade standalone web application on Render with multi-stage Docker containerization.
- 🏆 **Overall Winner ($250):** An original, zero-cloud relaxation tool that genuinely rewards laziness and embraces the "Slow and Steady" spirit of International Sloth Day.

---

*Disclaimer: SomnoSloth is an offline relaxation companion, not clinical therapy. If you or someone you know is in distress, free and confidential support is available globally at [findahelpline.com](https://findahelpline.com).*
