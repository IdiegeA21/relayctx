/**
 * Structured logger. Development logging must never include conversation
 * content (prompts, generated text, etc.) — only state transitions and
 * short evidence labels.
 */

const PREFIX = "[RelayCTX]";

function ts(): string {
  return new Date().toISOString().split("T")[1].replace("Z", "");
}

export const logger = {
  info(message: string, ...rest: unknown[]) {
    console.log(`${PREFIX} ${ts()} ${message}`, ...rest);
  },
  warn(message: string, ...rest: unknown[]) {
    console.warn(`${PREFIX} ${ts()} ${message}`, ...rest);
  },
  error(message: string, ...rest: unknown[]) {
    console.error(`${PREFIX}[ERROR] ${ts()} ${message}`, ...rest);
  },
  debug(message: string, ...rest: unknown[]) {
    console.debug(`${PREFIX}[DEBUG] ${ts()} ${message}`, ...rest);
  },
};
