import { useCallback, useEffect, useState } from "react";
import type {
  ExtensionMessage,
  ExtensionSettings,
  SupportedPlatform,
  WatchSession,
} from "../core/types";
import { DEFAULT_SETTINGS } from "../core/types";
import CurrentTab from "./components/CurrentTab";
import WatchList from "./components/WatchList";
import SettingsPanel from "./components/SettingsPanel";
import { RelayMark, GearIcon } from "./icons";

function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      if (chrome.runtime.lastError) {
        // Background not ready — resolve with undefined rather than throwing.
        resolve(undefined as T);
        return;
      }
      resolve(response);
    });
  });
}

interface CurrentTabInfo {
  tabId: number | null;
  url: string | null;
  title: string | null;
  platform: SupportedPlatform | null;
  alreadyWatched: boolean;
}

export default function App() {
  const [sessions, setSessions] = useState<WatchSession[]>([]);
  const [currentTab, setCurrentTab] = useState<CurrentTabInfo>({
    tabId: null,
    url: null,
    title: null,
    platform: null,
    alreadyWatched: false,
  });
  const [tabLoading, setTabLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);

  const refreshCurrentTab = useCallback(async () => {
    setTabLoading(true);
    const result = await sendMessage<{
      tabId: number | null;
      url: string | null;
      title: string | null;
      platform: SupportedPlatform | null;
      alreadyWatched: boolean;
    }>({ type: "GET_CURRENT_TAB_INFO" });
    if (result) {
      setCurrentTab(result);
    }
    setTabLoading(false);
  }, []);

  const refreshSessions = useCallback(async () => {
    const result = await sendMessage<{ sessions: WatchSession[] }>({ type: "GET_SESSIONS" });
    if (result?.sessions) {
      setSessions(result.sessions);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    const result = await sendMessage<{ settings: ExtensionSettings }>({ type: "GET_SETTINGS" });
    if (result?.settings) {
      setSettings(result.settings);
    }
  }, []);

  useEffect(() => {
    refreshCurrentTab();
    refreshSessions();
    refreshSettings();

    const listener = (message: ExtensionMessage) => {
      if (message.type === "SESSIONS_UPDATED") {
        setSessions(message.sessions);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [refreshCurrentTab, refreshSessions, refreshSettings]);

  const handleAdd = async () => {
    if (!currentTab.tabId || !currentTab.url) return;
    setAdding(true);
    await sendMessage({
      type: "START_WATCH",
      tabId: currentTab.tabId,
      url: currentTab.url,
      title: currentTab.title ?? undefined,
    });
    await refreshSessions();
    await refreshCurrentTab();
    setAdding(false);
  };

  const handleStop = async (tabId: number) => {
    await sendMessage({ type: "STOP_WATCH", tabId });
    await refreshSessions();
    await refreshCurrentTab();
  };

  const handleOpen = (tabId: number) => {
    chrome.tabs.update(tabId, { active: true });
    chrome.tabs.get(tabId, (tab) => {
      if (tab?.windowId !== undefined) {
        chrome.windows.update(tab.windowId, { focused: true });
      }
    });
  };

  const handleToggleAutomation = async (tabId: number, enabled: boolean) => {
    setSessions((prev) =>
      prev.map((s) => (s.tabId === tabId ? { ...s, automationEnabled: enabled } : s))
    );
    await sendMessage({ type: "SET_AUTOMATION_ENABLED", tabId, enabled });
  };

  const handleSettingsChange = async (next: ExtensionSettings) => {
    setSettings(next);
    await sendMessage({ type: "SET_SETTINGS", settings: next });
  };

  return (
    <div>
      <header className="header">
        <div className="header__mark">
          <RelayMark />
        </div>
        <div className="header__titles">
          <span className="header__name">RelayCTX</span>
          <span className="header__tagline">Keep your AI sessions moving.</span>
        </div>
        <button
          className="header__settings"
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Settings"
          aria-pressed={showSettings}
        >
          <GearIcon />
        </button>
      </header>

      {showSettings ? (
        <SettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onBack={() => setShowSettings(false)}
        />
      ) : (
        <>
          <CurrentTab
            loading={tabLoading}
            url={currentTab.url}
            platform={currentTab.platform}
            alreadyWatched={currentTab.alreadyWatched}
            onAdd={handleAdd}
            adding={adding}
          />
          <WatchList
            sessions={sessions}
            onStop={handleStop}
            onOpen={handleOpen}
            onToggleAutomation={handleToggleAutomation}
          />
        </>
      )}

      <footer className="footer">
        <span className="footer__hint">Automation only runs on tabs you add.</span>
      </footer>
    </div>
  );
}
