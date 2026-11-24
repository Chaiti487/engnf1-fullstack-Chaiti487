import { TIME_SLOTS, toUTC } from "../utils/bookingConstants";

export default function AvailabilityGrid({
  date,
  bookings = [],
  onSelectSlot,
  selectedTime,
}) {
  function getSlotStatus(time) {
    const start = new Date(toUTC(date, time));

    const end = new Date(start.getTime() + 30 * 60 * 1000);

    if (start.getTime() <= Date.now()) {
      return "past";
    }

    const overlappingBooking = bookings.find(
      (booking) =>
        start < new Date(booking.endTime) &&
        end > new Date(booking.startTime) &&
        ["PENDING", "APPROVED"].includes(booking.status),
    );

    if (overlappingBooking) {
      return overlappingBooking.status.toLowerCase();
    }

    return "available";
  }

  return (
    <div className="availability-section">
      <div className="availability-legend">
        <span>
          <i className="legend-dot slot-available" />
          Available
        </span>

        <span>
          <i className="legend-dot slot-pending" />
          Pending
        </span>

        <span>
          <i className="legend-dot slot-approved" />
          Approved
        </span>

        <span>
          <i className="legend-dot slot-past" />
          Past
        </span>
      </div>

      <div className="availability-grid">
        {TIME_SLOTS.map((time) => {
          const status = getSlotStatus(time);

          return (
            <button
              key={time}
              type="button"
              className={`time-slot slot-${status} ${
                selectedTime === time ? "slot-selected" : ""
              }`}
              disabled={status !== "available"}
              onClick={() => onSelectSlot(time)}
              title={`${time} - ${status}`}
              aria-label={`${time}, ${status}`}
              aria-pressed={selectedTime === time}
            >
              {time}
            </button>
          );
        })}
      </div>

      <p className="muted availability-note">
        All times are displayed in your local timezone. Select an available slot
        to begin your booking.
      </p>
    </div>
  );
}
