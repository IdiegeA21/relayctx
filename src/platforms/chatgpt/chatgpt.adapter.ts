/**
 * ChatGPT Adapter (stub)
 *
 * `canHandle` correctly matches chatgpt.com and the legacy chat.openai.com
 * host (excluding the /codex path, which is Codex Web — see
 * codex.adapter.ts). Everything else is an intentional no-op; see
 * stub-adapter.ts for what a real implementation needs to add.
 */
import { createStubAdapter } from "../stub-adapter";

export const chatgptAdapter = createStubAdapter({
  platform: "chatgpt",
  displayName: "ChatGPT",
  canHandle(url: string): boolean {
    try {
      const { hostname, pathname } = new URL(url);
      if (hostname === "chat.openai.com" || hostname.endsWith(".chat.openai.com")) {
        return true;
      }
      if (hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com")) {
        return !pathname.startsWith("/codex");
      }
      return false;
    } catch {
      return false;
    }
  },
});
