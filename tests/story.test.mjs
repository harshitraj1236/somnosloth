import test from "node:test";
import assert from "node:assert/strict";
import { StoryEngine } from "../src/lib/story/engine.ts";
import { checkDistressHeuristic, CRISIS_RESOURCE } from "../src/lib/safety/crisis.ts";
import { SleepNarrator, VOICE_PRESETS } from "../src/lib/audio/speech.ts";

const engine = new StoryEngine();

test("Crisis Guardrail: identifies distress triggers and passes neutral thoughts", () => {
  // Positive distress cases
  assert.strictEqual(checkDistressHeuristic("I want to kill myself tonight"), true);
  assert.strictEqual(checkDistressHeuristic("Feeling completely hopeless and cannot go on"), true);
  assert.strictEqual(checkDistressHeuristic("I feel like I want to die"), true);

  // Neutral sleep thoughts (should NOT trigger)
  assert.strictEqual(checkDistressHeuristic("I forgot to finish my pull request today"), false);
  assert.strictEqual(checkDistressHeuristic("Too hot in my bedroom to fall asleep"), false);
  assert.strictEqual(checkDistressHeuristic("Thinking about tomorrow's team sync"), false);
  assert.strictEqual(checkDistressHeuristic(""), false);

  // Crisis resource structure
  assert.ok(CRISIS_RESOURCE.url.includes("findahelpline.com"));
  assert.ok(CRISIS_RESOURCE.disclaimer.length > 10);
});

test("StoryEngine: generates offline fables with proper structure and sensory pacing", () => {
  const rainStory = engine.getOfflineFable("rain");
  assert.ok(rainStory.title.length > 5, "Story must have a title");
  assert.ok(rainStory.text.length > 100, "Story must contain narrative prose");
  assert.strictEqual(rainStory.engine, "fables");

  const fireStory = engine.getOfflineFable("fire");
  assert.ok(fireStory.title.includes("Hearth") || fireStory.title.includes("Fire"));
  assert.ok(fireStory.text.includes("warmth") || fireStory.text.includes("cozy"));

  const cosmosStory = engine.getOfflineFable("cosmos");
  assert.ok(cosmosStory.text.includes("stars") || cosmosStory.text.includes("space"));
});

test("StoryEngine: incorporates brain dump release into offline fables smoothly", () => {
  const brainDump = "anxious about client presentation tomorrow";
  const story = engine.getOfflineFable("rain", brainDump);

  assert.ok(story.text.includes("can gently wait until the morning sun"));
  assert.ok(story.text.includes(brainDump));
});

test("StoryEngine: guarantees slow, non-violent narrative (no banned action words)", () => {
  const stories = [
    engine.getOfflineFable("rain"),
    engine.getOfflineFable("fire"),
    engine.getOfflineFable("cosmos"),
  ];

  const BANNED_ACTION_WORDS = ["exploded", "screamed", "gunfire", "murder", "horrifying", "panic"];

  for (const story of stories) {
    const textLower = story.text.toLowerCase();
    for (const banned of BANNED_ACTION_WORDS) {
      assert.strictEqual(
        textLower.includes(banned),
        false,
        `Story contains high-arousal word: ${banned}`
      );
    }
  }
});

test("SleepNarrator: provides distinct calming voice presets", () => {
  assert.ok(VOICE_PRESETS.willow, "Willow voice preset must exist");
  assert.ok(VOICE_PRESETS.cedar, "Cedar voice preset must exist");
  assert.ok(VOICE_PRESETS.drift, "Drift voice preset must exist");

  // Calming tempo requirements (rate <= 0.85, pitch in soothing range)
  assert.ok(VOICE_PRESETS.willow.rate <= 0.85);
  assert.ok(VOICE_PRESETS.cedar.pitch < 0.8);
  assert.ok(VOICE_PRESETS.drift.rate <= 0.75);

  const narrator = new SleepNarrator();
  assert.strictEqual(narrator.getVoiceStyle(), "willow");

  narrator.setVoiceStyle("cedar");
  assert.strictEqual(narrator.getVoiceStyle(), "cedar");

  narrator.setCustomVoiceURI("com.apple.speech.synthesis.voice.daniel");
  assert.strictEqual(narrator.getCustomVoiceURI(), "com.apple.speech.synthesis.voice.daniel");
});
