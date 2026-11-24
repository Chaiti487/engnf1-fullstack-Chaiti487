import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  History,
  ShieldCheck,
  Save,
  ArrowRight,
} from "lucide-react";

import toast from "react-hot-toast";

import { fetchTicketById, updateTicket } from "../api/ticket.api";

import {
  CATEGORIES,
  PRIORITIES,
  TICKET_STATUSES,
  formatLabel,
  formatDate,
  getErrorMessage,
} from "../utils/ticketConstants";

import useAuth from "../hooks/useAuth";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";

import "../styles/tickets.css";

function getFormValues(ticket) {
  return {
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    assigneeId: ticket.assigneeId || "",
  };
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadTicket() {
      setLoading(true);
      setError("");
      setSaveError("");

      try {
        const data = await fetchTicketById(id);

        if (active) {
          setTicket(data.ticket);
          setEvents(data.events);
          setForm(getFormValues(data.ticket));
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

    loadTicket();

    return () => {
      active = false;
    };
  }, [id, retryKey]);

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (saving) return;

    setSaveError("");

    const changes = {};

    for (const field of ["category", "priority", "status", "assigneeId"]) {
      const value = field === "assigneeId" ? form[field] || null : form[field];

      if (value !== ticket[field]) {
        changes[field] = value;
      }
    }

    if (Object.keys(changes).length === 0) {
      toast("No changes to save.");
      return;
    }

    // Preserve the previous state for rollback.
    const previousTicket = ticket;
    const previousEvents = events;

    const categoryChanged = changes.category !== undefined;

    const reviewed =
      categoryChanged ||
      (ticket.status === "OPEN" &&
        changes.status !== undefined &&
        changes.status !== "OPEN");

    const optimisticTicket = {
      ...ticket,
      ...changes,

      isHumanOverride: ticket.isHumanOverride || categoryChanged,

      isReviewed: ticket.isReviewed || reviewed,
    };

    // Create temporary optimistic audit entries.
    const optimisticEvents = Object.entries(changes).map(([field, value]) => ({
      id: `optimistic-${field}-${Date.now()}`,
      field,
      oldValue: ticket[field],
      newValue: value,
      actor: user.email,
      createdAt: new Date().toISOString(),
      optimistic: true,
    }));

    // Update the interface immediately.
    setTicket(optimisticTicket);
    setEvents([...optimisticEvents, ...previousEvents]);

    setSaving(true);

    try {
      const data = await updateTicket(id, changes);

      // Replace temporary data with server-confirmed data.
      setTicket(data.ticket);
      setEvents(data.events);
      setForm(getFormValues(data.ticket));

      toast.success("Ticket updated successfully.");
    } catch (err) {
      // Restore the previous state on failure.
      setTicket(previousTicket);
      setEvents(previousEvents);
      setForm(getFormValues(previousTicket));

      const message = `Update failed. Changes rolled back. ${getErrorMessage(err)}`;

      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loader message="Loading ticket details..." />;
  }

  if (error || !ticket || !form) {
    return (
      <div className="panel">
        <Link to="/tickets" className="back-link">
          <ArrowLeft size={17} />
          Back to Triage Queue
        </Link>

        <div className="error-message" role="alert">
          {error || "Ticket not found."}
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => setRetryKey((previous) => previous + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  const fields = [
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
    {
      name: "status",
      label: "Status",
      options: TICKET_STATUSES,
    },
  ];

  return (
    <>
      <Link to="/tickets" className="back-link">
        <ArrowLeft size={17} />
        Back to Triage Queue
      </Link>

      <div className="page-header">
        <div>
          <h1>{ticket.subject}</h1>
          <p>
            {ticket.externalId} · Created {formatDate(ticket.createdAt)}
          </p>
        </div>

        <StatusBadge value={ticket.status} />
      </div>

      {saveError && (
        <div className="error-message rollback-message" role="alert">
          {saveError}
        </div>
      )}

      <div className="ticket-detail-grid">
        <div className="ticket-detail-main">
          <section className="panel">
            <h3>Customer message</h3>

            <p className="ticket-body">{ticket.body}</p>

            <div className="ticket-meta">
              <div>
                <span className="muted">Original auto category</span>

                <StatusBadge value={ticket.autoCategory} />
              </div>

              <div>
                <span className="muted">Current category</span>

                <StatusBadge value={ticket.category} />
              </div>

              <div>
                <span className="muted">Priority</span>

                <StatusBadge value={ticket.priority} />
              </div>

              <div>
                <span className="muted">Review status</span>

                <strong>
                  {ticket.isReviewed ? "Reviewed" : "Not reviewed"}
                </strong>
              </div>
            </div>

            {ticket.isHumanOverride && (
              <div className="override-notice">
                <ShieldCheck size={19} />

                <span>
                  Human override protected. Re-importing this ticket will not
                  overwrite its reviewed classification.
                </span>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="section-heading">
              <h3>
                <History size={19} />
                Audit history
              </h3>
            </div>

            {events.length === 0 ? (
              <div className="empty-state">
                <History size={32} />
                <p>No changes recorded yet.</p>
              </div>
            ) : (
              <div className="audit-timeline">
                {events.map((item) => (
                  <article key={item.id} className="audit-event">
                    <div className="audit-dot" />

                    <div className="audit-content">
                      <strong>
                        {item.field === "assigneeId"
                          ? "Assignee"
                          : formatLabel(item.field)}{" "}
                        updated
                      </strong>

                      <div className="audit-values">
                        <span>{formatLabel(item.oldValue)}</span>

                        <ArrowRight size={15} />

                        <span>{formatLabel(item.newValue)}</span>
                      </div>

                      <small className="muted">
                        {item.actor} · {formatDate(item.createdAt)}
                      </small>

                      {item.optimistic && (
                        <small className="muted">Saving...</small>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="panel agent-review-panel">
          <h3>Agent review</h3>

          <p className="muted review-description">
            Review the classification and update the ticket workflow.
          </p>

          <form className="review-form" onSubmit={handleSave}>
            {fields.map(({ name, label, options }) => (
              <div className="form-group" key={name}>
                <label htmlFor={name}>{label}</label>

                <select
                  id={name}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {formatLabel(option)}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="form-group">
              <label htmlFor="assigneeId">Assignee</label>

              <select
                id="assigneeId"
                name="assigneeId"
                value={form.assigneeId}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">Unassigned</option>

                <option value={user.id}>Assign to me ({user.name})</option>

                {ticket.assigneeId && ticket.assigneeId !== user.id && (
                  <option value={ticket.assigneeId}>
                    Keep current assignee
                  </option>
                )}
              </select>
            </div>

            <button className="btn btn-primary full-width" disabled={saving}>
              <Save size={17} />

              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
