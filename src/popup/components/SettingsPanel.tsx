import type { ExtensionSettings } from "../../core/types";

interface Props {
  settings: ExtensionSettings;
  onChange: (settings: ExtensionSettings) => void;
  onBack: () => void;
}

export default function SettingsPanel({ settings, onChange, onBack }: Props) {
  return (
    <section className="section settings">
      <p className="section__label">Settings</p>

      <div className="settings__row">
        <div className="settings__row-label">
          <span className="settings__row-title">Notifications</span>
          <span className="settings__row-desc">Notify when a session appears complete</span>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => onChange({ ...settings, notificationsEnabled: e.target.checked })}
            aria-label="Toggle notifications"
          />
          <span className="switch__track" />
        </label>
      </div>

      <div className="settings__row">
        <div className="settings__row-label">
          <span className="settings__row-title">Auto continue by default</span>
          <span className="settings__row-desc">Applies to newly watched tabs</span>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.defaultAutomationEnabled}
            onChange={(e) =>
              onChange({ ...settings, defaultAutomationEnabled: e.target.checked })
            }
            aria-label="Toggle default automation"
          />
          <span className="switch__track" />
        </label>
      </div>

      <button className="btn btn--link btn--sm settings__back" onClick={onBack}>
        ← Back
      </button>
    </section>
  );
}
