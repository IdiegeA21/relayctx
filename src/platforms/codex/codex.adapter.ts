/**
 * Codex Adapter (stub)
 *
 * Codex Web lives at chatgpt.com/codex — same host as ChatGPT, different
 * path — so `canHandle` checks the path, not just the hostname. See
 * stub-adapter.ts for what a real implementation needs to add.
 */
import { createStubAdapter } from "../stub-adapter";

export const codexAdapter = createStubAdapter({
  platform: "codex",
  displayName: "Codex",
  canHandle(url: string): boolean {
    try {
      const { hostname, pathname } = new URL(url);
      return (
        (hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com")) &&
        pathname.startsWith("/codex")
      );
    } catch {
      return false;
    }
  },
});
