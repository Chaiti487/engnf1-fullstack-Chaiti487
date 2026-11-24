import { Search, RotateCcw } from "lucide-react";

import {
  CATEGORIES,
  PRIORITIES,
  TICKET_STATUSES,
  formatLabel,
} from "../utils/ticketConstants";

export default function TicketFilters({ filters, onChange, onReset }) {
  const dropdowns = [
    {
      name: "status",
      label: "Status",
      options: TICKET_STATUSES,
    },
    {
      name: "category",
      label: "Category",
      options: CATEGORIES,
    },
    {
      name: "priority",
      label: "Priority",
      options: PRIORITIES,
    },
  ];

  return (
    <div className="ticket-filters">
      <div className="search-field">
        <Search size={18} />

        <input
          type="search"
          aria-label="Search tickets"
          placeholder="Search tickets..."
          value={filters.q}
          onChange={(event) => onChange("q", event.target.value)}
        />
      </div>

      {dropdowns.map(({ name, label, options }) => (
        <select
          key={name}
          aria-label={label}
          value={filters[name]}
          onChange={(event) => onChange(name, event.target.value)}
        >
          <option value="">All {label}</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {formatLabel(option)}
            </option>
          ))}
        </select>
      ))}

      <button
        className="btn btn-secondary"
        onClick={onReset}
        title="Reset filters"
      >
        <RotateCcw size={16} />
        Reset
      </button>
    </div>
  );
}
