# SomnoSloth 🦥

> A calm, zero-cloud bedtime wind-down companion that does the relaxation work for you. Built entirely with native web APIs and open-source AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-Procedural-emerald)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![100% Offline](https://img.shields.io/badge/Offline-Airplane%20Mode-amber)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## Overview

After spending 8 to 12 hours in code editors and terminals, falling asleep is difficult. Commercial sleep apps lock basic white noise and bedtime stories behind annual subscriptions, push notification upsells, and require an active internet connection that leaves your bedroom exposed to late-night pings.

**SomnoSloth** is built around radical simplicity and the spirit of **International Sloth Day**: it rewards doing nothing. You tap **one button**, set your phone face down on your nightstand, and close your eyes.

SomnoSloth synthesizes infinite ambient audio and narrates slow bedtime journeys natively on your device—with **zero cloud calls, zero audio file downloads, and zero subscriptions**.

---

## Key Features

### 1. Zero-Asset Procedural Web Audio Engine
Rather than streaming large MP3 files that stutter, consume mobile data, and loop noticeably, SomnoSloth synthesizes sounds mathematically in real time via the **Web Audio API**:
- **Rain on Leaves:** Brownian noise shaped through a biquad lowpass filter (650 Hz cutoff, Q=1.0).
- **Cozy Hearth:** Brownian noise with randomized impulse crackle through a resonant bandpass filter (320 Hz cutoff, Q=1.8).
- **Deep Cosmos:** Dual sine oscillators at 108 Hz and 110 Hz producing an organic **2 Hz binaural delta beat** to ease cognitive arousal.

### 2. Sentence-Chunked Sleep Narrator
A known issue with mobile browser `SpeechSynthesis` is that long paragraphs get abruptly truncated mid-sentence by browser audio daemons. SomnoSloth splits all bedtime narratives into individual sentence chunks (`story.match(/[^.!?\n]+[.!?\n]+/g)`) and queues them sequentially using `onend` callbacks with natural 450ms breath pauses, spoken at a relaxed 0.8x cadence.

### 3. Hardware-Accurate Sleep Fade
Rather than using JavaScript `setInterval` timers (which drift or stall when phone screens lock), volume fading is scheduled directly onto the audio hardware clock:
```typescript
const now = this.ctx.currentTime;
this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
this.masterGain.gain.linearRampToValueAtTime(0.0001, now + durationSeconds);
```

### 4. Multi-Tier Open AI Bedtime Journeys
1. **In-Browser WebGPU:** Runs Google Gemma 2 locally inside the browser via `@mlc-ai/web-llm`.
2. **Desktop Ollama Bridge:** Connects to `http://localhost:11434` if running locally on the user's machine.
3. **Curated Offline Fables:** High-quality, sensory, non-violent bedtime stories ready with zero network latency.

### 5. Bedtime Brain Dump & Crisis Heuristics
An offline notepad where you can jot down racing thoughts so they can wait for morning. If expressions of distress are typed, SomnoSloth gently surfaces supportive resources from [findahelpline.com](https://findahelpline.com) without saving or transmitting your input.

### 6. Tactile Night-Light UI
Designed specifically for late-night bedroom use:
- Deep night palette (`#16130f` background, `#1f1a14` surface, `#9aab6a` moss accent, `#c48a5e` clay secondary).
- Self-hosted soft serif typography (`Fraunces`) and humanist sans (`Figtree`).
- Hand-drawn inline SVGs (1.5px stroke).
- Flat, tactile controls with zero blur glows, no neon gradients, and strict `:focus-visible` accessibility.

---

## Project Structure

```text
somnosloth/
├── src/
│   ├── app/
│   │   ├── globals.css         # CSS variables, notepad lines, focus-visible
│   │   ├── layout.tsx          # Self-hosted next/font, PWA metadata, SW loader
│   │   └── page.tsx            # Redesigned night-light console (soundscape, timer, dump)
│   ├── lib/
│   │   ├── audio/
│   │   │   ├── procedural.ts   # Web Audio API generator (rain, fire, cosmos delta drone)
│   │   │   └── speech.ts       # Sentence-chunked SpeechSynthesis + Wake Lock
│   │   ├── safety/
│   │   │   └── crisis.ts       # Heuristic distress detector & findahelpline link
│   │   └── story/
│   │       └── engine.ts       # WebGPU / Ollama / Curated offline sleep fables
│   └── types/
│       └── sleep.ts            # Type definitions for soundscapes, timers, and stories
├── public/
│   ├── icon.svg                # Vector sloth icon
│   ├── manifest.json           # PWA standalone manifest
│   └── sw.js                   # Precache service worker for offline execution
├── tests/
│   └── story.test.mjs          # Native Node.js test runner suite (4/4 tests)
├── Dockerfile                  # Production multi-stage container
├── render.yaml                 # Render web service configuration
├── package.json                # Dependencies & scripts (dev on port 1094)
└── tsconfig.json               # Next.js 14 bundler configuration
```

---

## Getting Started

### Prerequisites
- Node.js >= 18.17.0
- npm >= 9.0.0

### Installation

```bash
git clone https://github.com/harshitraj1236/somnosloth.git
cd somnosloth
npm install
```

### Development

To start the local development server (configured on port `1094`):

```bash
npm run dev
```

Open [http://localhost:1094](http://localhost:1094) in your browser.

### Running Tests

SomnoSloth uses Node.js's built-in test runner (`node --test`) with zero testing dependencies:

```bash
npm test
```

### Production Build

```bash
npm run build
npm start
```

---

## Deployment (Render)

The project includes a multi-stage `Dockerfile` and `render.yaml` configured for production:

```bash
docker build -t somnosloth .
docker run -p 1094:1094 somnosloth
```

---

## Privacy & Safety

- **100% On-Device:** All audio synthesis, speech queueing, and story generation happen inside your browser. No telemetry, no analytical tracking, and no cookies.
- **Genuine Airplane Mode:** Once the app shell is cached by the service worker, you can toggle airplane mode and run the entire wind-down session completely offline.
- **Support Disclaimer:** SomnoSloth is a relaxation companion and not a substitute for clinical healthcare. If you or someone you know is in crisis, confidential international assistance is accessible at [findahelpline.com](https://findahelpline.com).

---

## License

This project is licensed under the [MIT License](LICENSE).
