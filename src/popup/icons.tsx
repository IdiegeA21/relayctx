/** Minimal inline icon set — no external assets, no icon font dependency. */

export function RelayMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="5" cy="12" r="2.6" stroke="var(--accent-teal)" strokeWidth="1.6" />
      <circle cx="19" cy="12" r="2.6" stroke="var(--accent-amber)" strokeWidth="1.6" />
      <path
        d="M7.6 12H16.4"
        stroke="var(--text-secondary)"
        strokeWidth="1.6"
        strokeDasharray="2.4 2.4"
      />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 13.6a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V19.6a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.47 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H4.4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.47-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H10.3a1.6 1.6 0 0 0 .97-1.47V4.4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V10.3a1.6 1.6 0 0 0 1.47.97h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.47.97Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function AntennaIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="40"
      height="40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 6v12M24 18a6 6 0 0 1 6 6M24 18a6 6 0 0 0-6 6M14 30a10 10 0 0 1 20 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="18" r="2.2" fill="currentColor" />
      <path d="M10 40h28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 40l3-6M31 40l-3-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 8.5l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
