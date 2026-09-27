import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Self-hosted fonts, WOFF2/Latin-only (see fonts.css) — bundled by Vite,
// no runtime network dependency, and no unused format/subset bloat.
import "./fonts.css";
import "./popup.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
