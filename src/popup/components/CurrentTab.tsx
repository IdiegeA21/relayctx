import { CheckIcon } from "../icons";
import type { SupportedPlatform } from "../../core/types";
import { shortenUrl } from "../../utils/url";
import { PLATFORM_COLOR_VAR, PLATFORM_IMPLEMENTED, PLATFORM_LABEL, PLATFORM_MONOGRAM } from "../platform-meta";

interface Props {
  loading: boolean;
  url: string | null;
  platform: SupportedPlatform | null;
  alreadyWatched: boolean;
  onAdd: () => void;
  adding: boolean;
}

export default function CurrentTab({ loading, url, platform, alreadyWatched, onAdd, adding }: Props) {
  return (
    <section className="section">
      <p className="section__label">Current tab</p>

      {loading ? (
        <div className="current-tab">
          <div className="current-tab__info">
            <span className="current-tab__url">Reading current tab…</span>
          </div>
        </div>
      ) : platform && url ? (
        <>
          <div className="current-tab">
            <div className="current-tab__icon" style={{ color: PLATFORM_COLOR_VAR[platform] }}>
              {PLATFORM_MONOGRAM[platform]}
            </div>
            <div className="current-tab__info">
              <span className="current-tab__platform">{PLATFORM_LABEL[platform]}</span>
              <span className="current-tab__url" title={url}>
                {shortenUrl(url.replace(/^https?:\/\//, ""))}
              </span>
            </div>
            {!alreadyWatched && (
              <button className="btn btn--primary" onClick={onAdd} disabled={adding}>
                {adding ? "Adding…" : "+ Add to Watch List"}
              </button>
            )}
          </div>
          {alreadyWatched && (
            <p className="already-watched-note">
              <CheckIcon /> Already on your Watch List
            </p>
          )}
          {!PLATFORM_IMPLEMENTED[platform] && (
            <p className="unsupported-note">
              Detection isn't implemented for {PLATFORM_LABEL[platform]} yet — you can add the
              tab, but RelayCTX won't automate it until that adapter is built. Claude is fully
              supported today.
            </p>
          )}
        </>
      ) : (
        <div className="current-tab">
          <div className="current-tab__info">
            <span className="current-tab__platform">Not a supported page</span>
            <span className="current-tab__url">{url ? shortenUrl(url) : "—"}</span>
          </div>
        </div>
      )}

      {!loading && !platform && (
        <p className="unsupported-note">
          Open a Claude, ChatGPT, Codex, or Gemini conversation, then come back here to watch it.
        </p>
      )}
    </section>
  );
}
