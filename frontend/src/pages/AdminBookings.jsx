import { useEffect, useState } from "react";

import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  fetchAllBookings,
  approveBooking,
  rejectBooking,
} from "../api/booking.api";

import { fetchResources } from "../api/resource.api";

import { BOOKING_STATUSES, getDayRange } from "../utils/bookingConstants";

import {
  formatLabel,
  formatDate,
  getErrorMessage,
} from "../utils/ticketConstants";

import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import RejectBookingForm from "../components/RejectBookingForm";

import "../styles/admin.css";
import "../styles/bookings.css";

const initialFilters = {
  status: "",
  resourceId: "",
  from: "",
  to: "",
};

export default function AdminBookings() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const [resources, setResources] = useState([]);
  const [resourceError, setResourceError] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const [processing, setProcessing] = useState(null);

  const [rejectingBooking, setRejectingBooking] = useState(null);

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load all resource pages for the filter dropdown.
  useEffect(() => {
    let active = true;

    async function loadResources() {
      setResourceError("");

      try {
        const firstPage = await fetchResources({
          page: 1,
        });

        const allResources = [...(firstPage.data || [])];

        for (let nextPage = 2; nextPage <= firstPage.totalPages; nextPage++) {
          const data = await fetchResources({
            page: nextPage,
          });

          allResources.push(...data.data);
        }

        if (active) {
          setResources(allResources);
        }
      } catch (err) {
        if (active) {
          setResourceError(getErrorMessage(err));
        }
      }
    }

    loadResources();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Load bookings using the selected filters.
  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setLoading(true);
      setError("");

      try {
        const params = { page };

        if (filters.status) {
          params.status = filters.status;
        }

        if (filters.resourceId) {
          params.resourceId = filters.resourceId;
        }

        if (filters.from) {
          params.from = getDayRange(filters.from).from;
        }

        if (filters.to) {
          params.to = getDayRange(filters.to).to;
        }

        if (
          params.from &&
          params.to &&
          new Date(params.from) >= new Date(params.to)
        ) {
          throw new Error("End date cannot be earlier than start date.");
        }

        const data = await fetchAllBookings(params);

        if (active) {
          setResult(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response
              ? getErrorMessage(err)
              : err.message || "Unable to load bookings.",
          );
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
  }, [filters, page, refreshKey]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPage(1);
  }

  function resetFilters() {
    setFilters({ ...initialFilters });
    setPage(1);
  }

  function refreshBookings() {
    setRefreshKey((previous) => previous + 1);
  }

  function getResourceName(booking) {
    return (
      booking.resource?.name ||
      resources.find((resource) => resource.id === booking.resourceId)?.name ||
      booking.resourceId
    );
  }

  function canReview(booking) {
    return (
      booking.status === "PENDING" &&
      new Date(booking.startTime).getTime() > currentTime
    );
  }

  async function handleApprove(booking) {
    const confirmed = window.confirm(
      "Are you sure you want to approve this booking?",
    );

    if (!confirmed) return;

    setProcessing(booking.id);

    try {
      await approveBooking(booking.id);

      toast.success("Booking approved successfully.");

      setPage(1);
      refreshBookings();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id, note) {
    await rejectBooking(id, note);

    toast.success("Booking rejected successfully.");

    setRejectingBooking(null);
    setPage(1);
    refreshBookings();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Manage Bookings</h1>

          <p>Review and manage resource booking requests.</p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={refreshBookings}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {rejectingBooking && (
        <RejectBookingForm
          key={rejectingBooking.id}
          booking={rejectingBooking}
          onReject={handleReject}
          onClose={() => setRejectingBooking(null)}
        />
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Booking requests</h3>

            <p className="muted">
              Filter reservations and review pending requests.
            </p>
          </div>
        </div>

        {resourceError && (
          <div className="error-message" role="alert">
            Resource filter unavailable: {resourceError}
          </div>
        )}

        <div className="admin-booking-filters">
          <div className="form-group">
            <label htmlFor="adminBookingStatus">Status</label>

            <select
              id="adminBookingStatus"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All statuses</option>

              {BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="adminBookingResource">Resource</label>

            <select
              id="adminBookingResource"
              name="resourceId"
              value={filters.resourceId}
              onChange={handleFilterChange}
            >
              <option value="">All resources</option>

              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bookingFrom">From date</label>

            <input
              id="bookingFrom"
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bookingTo">To date</label>

            <input
              id="bookingTo"
              type="date"
              name="to"
              min={filters.from || undefined}
              value={filters.to}
              onChange={handleFilterChange}
            />
          </div>

          <button className="btn btn-secondary" onClick={resetFilters}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {loading ? (
          <Loader message="Loading booking requests..." />
        ) : error ? (
          <div>
            <div className="error-message" role="alert">
              {error}
            </div>

            <button className="btn btn-secondary" onClick={refreshBookings}>
              Retry
            </button>
          </div>
        ) : !result?.data?.length ? (
          <div className="empty-state">
            <CalendarCheck size={42} />

            <h3>No booking requests found</h3>

            <p className="muted">Try changing the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="admin-booking-list">
              {result.data.map((booking) => (
                <article className="booking-card" key={booking.id}>
                  <div className="booking-card-header">
                    <div className="booking-card-title">
                      <div className="booking-icon">
                        <CalendarCheck size={23} />
                      </div>

                      <div>
                        <h3>{getResourceName(booking)}</h3>

                        <small className="muted">{booking.id}</small>
                      </div>
                    </div>

                    <StatusBadge value={booking.status} />
                  </div>

                  <div className="admin-booking-information">
                    <div>
                      <small>Requested by</small>

                      <strong>{booking.user?.name || booking.userId}</strong>
                    </div>

                    <div>
                      <small>Start time</small>

                      <strong>{formatDate(booking.startTime)}</strong>
                    </div>

                    <div>
                      <small>End time</small>

                      <strong>{formatDate(booking.endTime)}</strong>
                    </div>
                  </div>

                  <div className="booking-purpose">
                    <small>Booking purpose</small>
                    <p>{booking.purpose}</p>
                  </div>

                  {booking.decisionNote && (
                    <div className="booking-decision-note">
                      <strong>Decision note</strong>
                      <p>{booking.decisionNote}</p>
                    </div>
                  )}

                  <div className="booking-card-footer">
                    <small className="muted">
                      Requested on {formatDate(booking.createdAt)}
                    </small>

                    {canReview(booking) ? (
                      <div className="booking-actions">
                        <button
                          className="btn btn-primary"
                          disabled={
                            processing !== null || rejectingBooking !== null
                          }
                          onClick={() => handleApprove(booking)}
                        >
                          <CheckCircle2 size={17} />

                          {processing === booking.id
                            ? "Approving..."
                            : "Approve"}
                        </button>

                        <button
                          className="btn btn-danger-outline"
                          disabled={
                            processing !== null || rejectingBooking !== null
                          }
                          onClick={() => setRejectingBooking(booking)}
                        >
                          <XCircle size={17} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="muted">
                        No further actions available
                      </span>
                    )}
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
      </section>
    </>
  );
}
