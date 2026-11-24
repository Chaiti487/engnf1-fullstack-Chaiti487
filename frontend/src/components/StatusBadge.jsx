import { formatLabel } from "../utils/ticketConstants";

export default function StatusBadge({ value }) {
  return (
    <span className={`status-badge badge-${value.toLowerCase()}`}>
      {formatLabel(value)}
    </span>
  );
}
