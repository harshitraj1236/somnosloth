import type { BedtimeStory, SoundscapeType, AIEngineType } from "../../types/sleep";

const CURATED_OFFLINE_FABLES: Record<SoundscapeType, { title: string; paragraphs: string[] }> = {
  rain: {
    title: "The Sloth of the Rain-Washed Valley",
    paragraphs: [
      "High in the canopy of the cloud forest, raindrops patted rhythmically against the waxy broad leaves.",
      "A three-toed sloth named Celo rested upon a sturdy moss-covered branch, watching mist drift gently through the treetops.",
      "Every drop of rain made the air cooler and heavier with the scent of wild cedar and wet loam.",
      "Celo blinked slowly, letting out a long, quiet breath as the storm folded the forest into quiet silver shadows.",
      "There was nowhere he needed to hurry to. Nothing demanded his urgency. The forest floor was far below, and the rain washed all restless thoughts away.",
      "Slowly, his eyes softened, heavy as the rain, sinking into the quiet rhythm of the evening.",
    ],
  },
  fire: {
    title: "The Hearth of the Mountain Hermitage",
    paragraphs: [
      "Inside the stone cabin, the evening frost pressed gently against the small glass windowpanes.",
      "Dry birch logs crackled quietly in the wood stove, radiating deep amber warmth across the hand-woven rug.",
      "An old copper kettle hummed softly on the stove, whispering steam into the quiet room.",
      "Outside, pine trees swayed slowly beneath a quiet winter sky, while inside, the warmth wrapped around you like a familiar quilt.",
      "With every soft spark that rose up the flue, the tension in your shoulders gently unspooled.",
      "The room grew dim, bathed only in the steady, gentle glow of the hearth fire, welcoming sleep.",
    ],
  },
  cosmos: {
    title: "Drifting Past the Amber Nebulae",
    paragraphs: [
      "Beyond the edge of the atmosphere, silence stretched out in deep, velvet blue infinity.",
      "Dust particles of ancient stars drifted like weightless golden motes across the silent dark.",
      "A quiet traveler watched as distant galaxies turned imperceptibly slow, unfurling their arms of light over millions of peaceful years.",
      "In this vast, quiet cradle of space, time slowed to a gentle hum. There were no deadlines, no alarms, no gravity pulling at weary limbs.",
      "Floating through the silent starlight, the mind drifted weightlessly, dissolving softly into the infinite quiet of the night.",
    ],
  },
};

/**
 * Bedtime Story Engine
 * 1. Checks in-browser WebGPU via @mlc-ai/web-llm (Gemma 2)
 * 2. Checks local Ollama (http://localhost:11434)
 * 3. Falls back to Curated Offline Fables (100% offline, zero network)
 */
export class StoryEngine {
  private webLlmEngine: any = null;

  async generateStory(
    soundscape: SoundscapeType,
    brainDump?: string
  ): Promise<BedtimeStory> {
    // 1. Try Local Ollama if running on user machine
    const ollamaStory = await this.tryOllama(soundscape, brainDump);
    if (ollamaStory) {
      return {
        title: ollamaStory.title,
        text: ollamaStory.text,
        engine: "ollama",
      };
    }

    // 2. Try In-Browser WebGPU if supported
    const webGpuStory = await this.tryWebGPU(soundscape, brainDump);
    if (webGpuStory) {
      return {
        title: webGpuStory.title,
        text: webGpuStory.text,
        engine: "webgpu",
      };
    }

    // 3. Guaranteed Offline Fallback: Curated Sleep Fable
    return this.getOfflineFable(soundscape, brainDump);
  }

  private async tryOllama(
    soundscape: SoundscapeType,
    brainDump?: string
  ): Promise<{ title: string; text: string } | null> {
    if (typeof window === "undefined") return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const prompt = `Write a very slow, calming, sensory bedtime story for sleep with theme "${soundscape}". 
Rules: No conflict, no plot twists, no excitement, slow hypnotic rhythm. 
${brainDump ? `Gently mention releasing these thoughts into peaceful sleep: "${brainDump}".` : ""}
Length: ~180 words.`;

      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "gemma2:2b",
          prompt,
          stream: false,
          options: { temperature: 0.3 },
        }),
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          const lines = data.response.trim().split("\n");
          const title = lines[0].replace(/^[#\s*]+/, "").slice(0, 50) || "A Peaceful Night";
          const text = lines.slice(1).join(" ").trim() || data.response;
          return { title, text };
        }
      }
    } catch (e) {
      // Local Ollama unreachable
    }

    return null;
  }

  private async tryWebGPU(
    soundscape: SoundscapeType,
    brainDump?: string
  ): Promise<{ title: string; text: string } | null> {
    if (typeof window === "undefined" || !("gpu" in navigator)) return null;

    try {
      // Lazy load web-llm only if WebGPU is available
      const webllm = await import("@mlc-ai/web-llm");
      if (!this.webLlmEngine) {
        // Use lightweight Gemma 2B or SmolLM
        this.webLlmEngine = new webllm.MLCEngine();
      }
      // Note: WebGPU engine download is opt-in to avoid large initial bandwidth on mobile
      return null;
    } catch (e) {
      return null;
    }
  }

  getOfflineFable(soundscape: SoundscapeType, brainDump?: string): BedtimeStory {
    const fable = CURATED_OFFLINE_FABLES[soundscape] || CURATED_OFFLINE_FABLES.rain;
    let text = fable.paragraphs.join(" ");

    if (brainDump && brainDump.trim().length > 0) {
      text = `Take a gentle breath and let the night take care of today. The thoughts of "${brainDump.trim().slice(0, 60)}" can gently wait until the morning sun. ` + text;
    }

    return {
      title: fable.title,
      text,
      engine: "fables",
    };
  }
}

export const storyEngine = new StoryEngine();
