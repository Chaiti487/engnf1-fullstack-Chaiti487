import { useState } from "react";
import { Save, X } from "lucide-react";

import { RESOURCE_TYPES } from "../utils/bookingConstants";

import { formatLabel, getErrorMessage } from "../utils/ticketConstants";

export default function ResourceForm({ resource, onSave, onClose }) {
  const [form, setForm] = useState({
    name: resource?.name || "",
    type: resource?.type || "ROOM",
    capacity: resource?.capacity || 1,
    description: resource?.description || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const capacity = Number(form.capacity);

    if (form.name.trim().length < 3 || form.name.trim().length > 60) {
      setError("Resource name must contain 3 to 60 characters.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
      setError("Capacity must be an integer between 1 and 500.");
      return;
    }

    if (form.description.trim().length > 300) {
      setError("Description cannot exceed 300 characters.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        name: form.name.trim(),
        type: form.type,
        capacity,
        description: form.description.trim() || null,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel admin-resource-form">
      <div className="section-heading">
        <div>
          <h3>{resource ? "Edit resource" : "Create new resource"}</h3>

          <p className="muted">Configure resource information.</p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={saving}
          aria-label="Close resource form"
        >
          <X size={18} />
        </button>
      </div>

      <form className="resource-admin-form" onSubmit={handleSubmit}>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="resourceName">Resource name</label>

          <input
            id="resourceName"
            name="name"
            placeholder="Enter resource name"
            value={form.name}
            onChange={handleChange}
            minLength={3}
            maxLength={60}
            required
            disabled={saving}
          />
        </div>

        <div className="booking-time-fields">
          <div className="form-group">
            <label htmlFor="resourceType">Resource type</label>

            <select
              id="resourceType"
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={saving}
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="resourceCapacity">Capacity</label>

            <input
              id="resourceCapacity"
              name="capacity"
              type="number"
              min={1}
              max={500}
              step={1}
              value={form.capacity}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="resourceDescription">Description</label>

          <textarea
            id="resourceDescription"
            name="description"
            rows={4}
            maxLength={300}
            placeholder="Describe this resource..."
            value={form.description}
            onChange={handleChange}
            disabled={saving}
          />

          <small className="muted">
            {form.description.length}/300 characters
          </small>
        </div>

        <div className="admin-form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={17} />

            {saving
              ? "Saving..."
              : resource
                ? "Save changes"
                : "Create resource"}
          </button>
        </div>
      </form>
    </section>
  );
}
