import { Inbox, ArrowUpRight } from "lucide-react";

import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function TicketTable({ tickets }) {
  if (tickets.length === 0) {
    return (
      <div className="empty-state">
        <Inbox size={40} />

        <h3>No tickets found</h3>

        <p>Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="ticket-table-wrapper">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Review</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td data-label="Ticket">
                <div className="ticket-subject">
                  <strong>{ticket.subject}</strong>

                  <small>{ticket.externalId}</small>
                </div>
              </td>

              <td data-label="Category">
                <StatusBadge value={ticket.category} />
              </td>

              <td data-label="Priority">
                <StatusBadge value={ticket.priority} />
              </td>

              <td data-label="Status">
                <StatusBadge value={ticket.status} />
              </td>

              <td data-label="Review">
                <span
                  className={ticket.isReviewed ? "reviewed-label" : "muted"}
                >
                  {ticket.isReviewed ? "Reviewed" : "Pending"}
                </span>
              </td>

              <td data-label="Action">
                <Link className="ticket-view-link" to={`/tickets/${ticket.id}`}>
                  Review
                  <ArrowUpRight size={15} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
