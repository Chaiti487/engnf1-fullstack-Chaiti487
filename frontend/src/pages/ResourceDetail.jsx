import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Users,
  Layers,
  RefreshCw,
} from "lucide-react";

import { fetchResourceById, fetchAvailability } from "../api/resource.api";

import { getLocalDate, getDayRange } from "../utils/bookingConstants";

import { formatLabel, getErrorMessage } from "../utils/ticketConstants";

import Loader from "../components/Loader";
import AvailabilityGrid from "../components/AvailabilityGrid";
import BookingForm from "../components/BookingForm";

import "../styles/resources.css";

export default function ResourceDetail() {
  const { id } = useParams();

  const [resource, setResource] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [date, setDate] = useState(getLocalDate());
  const [startTime, setStartTime] = useState("");

  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [lastBooking, setLastBooking] = useState(null);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  useEffect(() => {
    let active = true;

    async function loadResource() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchResourceById(id);

        if (active) {
          setResource(data.resource || data);
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

    loadResource();

    return () => {
      active = false;
    };
  }, [id, retryKey]);

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      setAvailabilityLoading(true);
      setAvailabilityError("");

      try {
        const data = await fetchAvailability(id, getDayRange(date));

        if (active) {
          setBookings(data.bookings || []);
        }
      } catch (err) {
        if (active) {
          setAvailabilityError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      active = false;
    };
  }, [id, date, refreshKey]);

  function handleDateChange(event) {
    const selectedDate = event.target.value;

    if (!selectedDate) return;

    setDate(selectedDate);
    setStartTime("");
    setAvailabilityLoading(true);
    setLastBooking(null);
  }

  function refreshAvailability() {
    setAvailabilityLoading(true);
    setRefreshKey((previous) => previous + 1);
  }

  function handleBookingSuccess(booking) {
    setLastBooking(booking);
    refreshAvailability();
  }

  if (loading) {
    return <Loader message="Loading resource details..." />;
  }

  if (error || !resource) {
    return (
      <section className="panel">
        <Link to="/resources" className="back-link">
          <ArrowLeft size={17} />
          Back to Resources
        </Link>

        <div className="error-message" role="alert">
          {error || "Resource not found."}
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => setRetryKey((previous) => previous + 1)}
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <>
      <Link to="/resources" className="back-link">
        <ArrowLeft size={17} />
        Back to Resources
      </Link>

      <div className="page-header">
        <div>
          <h1>{resource.name}</h1>

          <p>View availability and request a reservation.</p>
        </div>

        <span
          className={
            resource.isActive ? "resource-active" : "resource-inactive"
          }
        >
          {resource.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {lastBooking && (
        <div className="booking-success" role="status">
          <div>
            <strong>Booking request submitted!</strong>

            <p>Your reservation is pending admin approval.</p>
          </div>

          <Link to="/bookings">View My Bookings</Link>
        </div>
      )}

      <div className="resource-detail-grid">
        <div className="resource-detail-main">
          <section className="panel">
            <h3>Resource information</h3>

            <p className="resource-description">
              {resource.description || "No description available."}
            </p>

            <div className="resource-information">
              <div>
                <Layers size={21} />

                <span>
                  <small>Resource type</small>

                  <strong>{formatLabel(resource.type)}</strong>
                </span>
              </div>

              <div>
                <Users size={21} />

                <span>
                  <small>Capacity</small>

                  <strong>{resource.capacity}</strong>
                </span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h3>
                <CalendarDays size={20} />
                Daily availability
              </h3>

              <button
                className="btn btn-secondary"
                onClick={refreshAvailability}
                disabled={availabilityLoading}
                aria-label="Refresh availability"
              >
                <RefreshCw
                  size={16}
                  className={availabilityLoading ? "spinner" : ""}
                />
              </button>
            </div>

            <div className="form-group availability-date">
              <label htmlFor="availabilityDate">Select date</label>

              <input
                id="availabilityDate"
                type="date"
                value={date}
                min={getLocalDate()}
                max={getLocalDate(maxDate)}
                onChange={handleDateChange}
              />
            </div>

            {availabilityLoading ? (
              <Loader message="Checking availability..." />
            ) : availabilityError ? (
              <div>
                <div className="error-message" role="alert">
                  {availabilityError}
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={refreshAvailability}
                >
                  Retry
                </button>
              </div>
            ) : !resource.isActive ? (
              <div className="empty-state">
                <CalendarDays size={32} />
                <p>This resource is inactive.</p>
              </div>
            ) : (
              <AvailabilityGrid
                date={date}
                bookings={bookings}
                selectedTime={startTime}
                onSelectSlot={setStartTime}
              />
            )}
          </section>
        </div>

        {!availabilityLoading && !availabilityError && resource.isActive && (
          <BookingForm
            key={`${id}-${date}`}
            resource={resource}
            date={date}
            startTime={startTime}
            onStartTimeChange={setStartTime}
            bookings={bookings}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </>
  );
}
