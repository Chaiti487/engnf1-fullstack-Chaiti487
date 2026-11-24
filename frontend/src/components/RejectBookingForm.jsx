import { useState } from "react";
import { X, XCircle } from "lucide-react";

import { getErrorMessage } from "../utils/ticketConstants";

export default function RejectBookingForm({ booking, onReject, onClose }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (note.trim().length < 5 || note.trim().length > 200) {
      setError("Rejection note must contain 5 to 200 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await onReject(booking.id, note.trim());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel rejection-panel">
      <div className="section-heading">
        <div>
          <h3>Reject booking request</h3>

          <p className="muted">
            Provide a reason for rejecting this reservation.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close rejection form"
        >
          <X size={18} />
        </button>
      </div>

      <div className="rejection-summary">
        <strong>Booking purpose</strong>
        <p>{booking.purpose}</p>
      </div>

      <form className="resource-admin-form" onSubmit={handleSubmit}>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="decisionNote">Rejection reason</label>

          <textarea
            id="decisionNote"
            rows={4}
            placeholder="Explain why this booking is being rejected..."
            value={note}
            onChange={(event) => setNote(event.target.value)}
            minLength={5}
            maxLength={200}
            required
            disabled={submitting}
          />

          <small className="muted">{note.length}/200 characters</small>
        </div>

        <div className="admin-form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-danger"
            disabled={submitting}
          >
            <XCircle size={17} />

            {submitting ? "Rejecting..." : "Confirm rejection"}
          </button>
        </div>
      </form>
    </section>
  );
}
