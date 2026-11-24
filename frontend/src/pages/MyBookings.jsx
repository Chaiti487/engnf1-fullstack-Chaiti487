import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  CalendarDays,
  CalendarX,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import toast from "react-hot-toast";

import { fetchMyBookings, cancelBooking } from "../api/booking.api";

import { BOOKING_STATUSES } from "../utils/bookingConstants";

import {
  formatLabel,
  formatDate,
  getErrorMessage,
} from "../utils/ticketConstants";

import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";

import "../styles/bookings.css";

export default function MyBookings() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [cancelling, setCancelling] = useState(null);

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setLoading(true);
      setError("");

      try {
        const params = { page };

        if (status) {
          params.status = status;
        }

        const data = await fetchMyBookings(params);

        if (active) {
          setResult(data);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, [status, page, refreshKey]);

  function canCancel(booking) {
    return (
      ["PENDING", "APPROVED"].includes(booking.status) &&
      new Date(booking.startTime).getTime() > currentTime
    );
  }

  function refreshBookings() {
    setRefreshKey((previous) => previous + 1);
  }

  async function handleCancel(booking) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? " +
        "This action cannot be undone.",
    );

    if (!confirmed) return;

    setCancelling(booking.id);

    try {
      await cancelBooking(booking.id);

      toast.success("Booking cancelled successfully.");

      setPage(1);
      refreshBookings();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Bookings</h1>

          <p>Track and manage your resource reservations.</p>
        </div>

        <Link to="/resources" className="btn btn-primary">
          <CalendarDays size={18} />
          New booking
        </Link>
      </div>

      <section className="panel booking-filter-panel">
        <div className="booking-filters">
          <div className="form-group">
            <label htmlFor="bookingStatus">Booking status</label>

            <select
              id="bookingStatus"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>

              {BOOKING_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-secondary"
            onClick={refreshBookings}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <Loader message="Loading your bookings..." />
      ) : error ? (
        <section className="panel">
          <div className="error-message" role="alert">
            {error}
          </div>

          <button className="btn btn-secondary" onClick={refreshBookings}>
            Retry
          </button>
        </section>
      ) : !result?.data?.length ? (
        <section className="panel empty-state">
          <CalendarX size={42} />

          <h3>No bookings found</h3>

          <p className="muted">
            {status
              ? "No bookings match the selected status."
              : "You have not made any reservations yet."}
          </p>

          <Link to="/resources" className="btn btn-primary">
            Browse resources
            <ArrowRight size={16} />
          </Link>
        </section>
      ) : (
        <>
          <div className="booking-list">
            {result.data.map((booking) => (
              <article className="booking-card" key={booking.id}>
                <div className="booking-card-header">
                  <div className="booking-card-title">
                    <div className="booking-icon">
                      <CalendarDays size={23} />
                    </div>

                    <div>
                      <h3>
                        {booking.resource?.name || "Resource reservation"}
                      </h3>

                      <small className="muted">{booking.id}</small>
                    </div>
                  </div>

                  <StatusBadge value={booking.status} />
                </div>

                <div className="booking-card-times">
                  <div>
                    <Clock size={18} />

                    <span>
                      <small>Start time</small>

                      <strong>{formatDate(booking.startTime)}</strong>
                    </span>
                  </div>

                  <div>
                    <Clock size={18} />

                    <span>
                      <small>End time</small>

                      <strong>{formatDate(booking.endTime)}</strong>
                    </span>
                  </div>
                </div>

                <div className="booking-purpose">
                  <small>Booking purpose</small>
                  <p>{booking.purpose}</p>
                </div>

                {booking.ticketId && (
                  <Link
                    to={`/tickets/${booking.ticketId}`}
                    className="booking-ticket-link"
                  >
                    View related ticket
                    <ArrowRight size={15} />
                  </Link>
                )}

                {booking.decisionNote && (
                  <div className="booking-decision-note">
                    <strong>Admin decision note</strong>
                    <p>{booking.decisionNote}</p>
                  </div>
                )}

                <div className="booking-card-footer">
                  <small className="muted">
                    Requested on {formatDate(booking.createdAt)}
                  </small>

                  <div className="booking-actions">
                    <Link
                      to={`/resources/${booking.resourceId}`}
                      className="btn btn-secondary"
                    >
                      View resource
                    </Link>

                    {canCancel(booking) && (
                      <button
                        className="btn btn-danger-outline"
                        disabled={cancelling !== null}
                        onClick={() => handleCancel(booking)}
                      >
                        <CalendarX size={16} />

                        {cancelling === booking.id
                          ? "Cancelling..."
                          : "Cancel booking"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={result.totalPages}
            total={result.total}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );
}
