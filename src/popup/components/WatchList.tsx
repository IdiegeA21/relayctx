import type { WatchSession } from "../../core/types";
import WatchSessionCard from "./WatchSessionCard";
import EmptyState from "./EmptyState";

interface Props {
  sessions: WatchSession[];
  onStop: (tabId: number) => void;
  onOpen: (tabId: number) => void;
  onToggleAutomation: (tabId: number, enabled: boolean) => void;
}

export default function WatchList({ sessions, onStop, onOpen, onToggleAutomation }: Props) {
  const visible = sessions.filter((s) => s.status !== "tab_closed");

  return (
    <section className="section">
      <p className="section__label">Watch list</p>

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="watch-list">
          {visible.map((session) => (
            <WatchSessionCard
              key={session.id}
              session={session}
              onStop={onStop}
              onOpen={onOpen}
              onToggleAutomation={onToggleAutomation}
            />
          ))}
        </div>
      )}
    </section>
  );
}
