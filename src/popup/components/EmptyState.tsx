import { AntennaIcon } from "../icons";

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <AntennaIcon />
      </div>
      <p className="empty-state__title">No active sessions</p>
      <p className="empty-state__body">
        Nothing is being watched yet. Open a Claude conversation and add its tab to the Watch
        List to keep it moving.
      </p>
    </div>
  );
}
