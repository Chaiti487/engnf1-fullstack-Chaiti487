import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import toast from "react-hot-toast";

import { createBooking } from "../api/booking.api";

import { TIME_SLOTS, toUTC } from "../utils/bookingConstants";

import { getErrorMessage } from "../utils/ticketConstants";

export default function BookingForm({
  resource,
  date,
  startTime,
  onStartTimeChange,
  bookings,
  onSuccess,
}) {
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [ticketId, setTicketId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const endOptions = startTime
    ? TIME_SLOTS.filter((time) => {
        const start = new Date(toUTC(date, startTime));

        const end = new Date(toUTC(date, time));

        const duration = (end - start) / 60000;

        return duration >= 30 && duration <= 240;
      })
    : [];

  // Allow bookings that end at midnight.
  if (startTime) {
    const start = new Date(toUTC(date, startTime));
    const midnight = new Date(`${date}T00:00:00`);

    midnight.setDate(midnight.getDate() + 1);

    const duration = (midnight - start) / 60000;

    if (duration >= 30 && duration <= 240) {
      endOptions.push("24:00");
    }
  }

  function getEndUTC() {
    if (endTime === "24:00") {
      const midnight = new Date(`${date}T00:00:00`);

      midnight.setDate(midnight.getDate() + 1);

      return midnight.toISOString();
    }

    return toUTC(date, endTime);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");

    if (!resource.isActive) {
      setError("This resource is inactive.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Please select a start and end time.");
      return;
    }

    if (purpose.trim().length < 5 || purpose.trim().length > 200) {
      setError("Purpose must contain between 5 and 200 characters.");
      return;
    }

    const startUTC = toUTC(date, startTime);
    const endUTC = getEndUTC();

    const start = new Date(startUTC);
    const end = new Date(endUTC);

    const duration = (end - start) / 60000;

    if (duration < 30 || duration > 240) {
      setError("Booking duration must be between 30 and 240 minutes.");
      return;
    }

    if (start.getTime() <= Date.now()) {
      setError("Booking must start in the future.");
      return;
    }

    if (start.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000) {
      setError("Bookings cannot be made more than 30 days ahead.");
      return;
    }

    const hasConflict = bookings.some(
      (booking) =>
        start < new Date(booking.endTime) &&
        end > new Date(booking.startTime) &&
        ["PENDING", "APPROVED"].includes(booking.status),
    );

    if (hasConflict) {
      setError("The selected time overlaps an existing booking.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        resourceId: resource.id,
        startTime: startUTC,
        endTime: endUTC,
        purpose: purpose.trim(),
      };

      if (ticketId.trim()) {
        payload.ticketId = ticketId.trim();
      }

      const data = await createBooking(payload);

      toast.success("Booking submitted for admin approval.");

      setPurpose("");
      setTicketId("");
      setEndTime("");
      onStartTimeChange("");

      onSuccess(data.booking);
    } catch (err) {
      const message = getErrorMessage(err);

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel booking-form-panel">
      <h3>Reserve this resource</h3>

      <p className="muted review-description">
        Submit a booking request for admin approval.
      </p>

      <form className="booking-form" onSubmit={handleSubmit}>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Booking date</label>

          <input type="date" value={date} readOnly aria-label="Booking date" />
        </div>

        <div className="booking-time-fields">
          <div className="form-group">
            <label htmlFor="startTime">Start time</label>

            <select
              id="startTime"
              value={startTime}
              onChange={(event) => {
                onStartTimeChange(event.target.value);
                setEndTime("");
              }}
              required
              disabled={submitting}
            >
              <option value="">Select time</option>

              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="endTime">End time</label>

            <select
              id="endTime"
              value={endOptions.includes(endTime) ? endTime : ""}
              onChange={(event) => setEndTime(event.target.value)}
              required
              disabled={!startTime || submitting}
            >
              <option value="">Select time</option>

              {endOptions.map((time) => (
                <option key={time} value={time}>
                  {time === "24:00" ? "00:00 (next day)" : time}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="purpose">Booking purpose</label>

          <textarea
            id="purpose"
            rows={4}
            placeholder="Describe why you need this resource..."
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            minLength={5}
            maxLength={200}
            required
            disabled={submitting}
          />

          <small className="muted">{purpose.length}/200 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="ticketId">Related ticket ID (optional)</label>

          <input
            id="ticketId"
            placeholder="Enter internal ticket ID"
            value={ticketId}
            onChange={(event) => setTicketId(event.target.value)}
            disabled={submitting}
          />

          <small className="muted">
            Link this reservation to an existing ticket.
          </small>
        </div>

        <div className="booking-rules">
          <strong>Booking guidelines</strong>

          <p>• Duration: 30 minutes to 4 hours.</p>
          <p>• Book up to 30 days in advance.</p>
          <p>• Maximum 3 active future bookings.</p>
          <p>• Admin approval is required.</p>
        </div>

        <button
          type="submit"
          className="btn btn-primary full-width"
          disabled={submitting || !resource.isActive}
        >
          <CalendarCheck size={18} />

          {submitting ? "Submitting request..." : "Request booking"}
        </button>
      </form>
    </section>
  );
}
