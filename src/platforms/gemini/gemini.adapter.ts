/**
 * Gemini Adapter (stub)
 *
 * `canHandle` correctly matches gemini.google.com. See stub-adapter.ts
 * for what a real implementation needs to add.
 */
import { createStubAdapter } from "../stub-adapter";

export const geminiAdapter = createStubAdapter({
  platform: "gemini",
  displayName: "Gemini",
  canHandle(url: string): boolean {
    try {
      const { hostname } = new URL(url);
      return hostname === "gemini.google.com" || hostname.endsWith(".gemini.google.com");
    } catch {
      return false;
    }
  },
});
