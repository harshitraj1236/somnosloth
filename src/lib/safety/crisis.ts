/**
 * Simple keyword heuristic for distress phrases in the bedtime brain dump.
 * Provides immediate supportive resources via findahelpline.com without storing entries.
 */

const DISTRESS_TRIGGERS = [
  "suicide",
  "kill myself",
  "end it all",
  "want to die",
  "self harm",
  "hurt myself",
  "cannot go on",
  "no reason to live",
  "hopeless",
];

export function checkDistressHeuristic(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase();
  return DISTRESS_TRIGGERS.some((trigger) => lower.includes(trigger));
}

export const CRISIS_RESOURCE = {
  message: "If you are feeling overwhelmed, hopeless, or having thoughts of self-harm, please know that you are not alone.",
  actionText: "Connect with free, confidential support in your country at findahelpline.com",
  url: "https://findahelpline.com/",
  disclaimer: "SomnoSloth is an offline relaxation aid and is not a clinical or crisis support service.",
};
