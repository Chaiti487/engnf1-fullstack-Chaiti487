import { useEffect, useState } from "react";

import { Plus, Search, Pencil, Power, Layers, RefreshCw } from "lucide-react";

import toast from "react-hot-toast";

import {
  fetchResources,
  createResource,
  updateResource,
} from "../api/resource.api";

import { RESOURCE_TYPES } from "../utils/bookingConstants";

import { formatLabel, getErrorMessage } from "../utils/ticketConstants";

import ResourceForm from "../components/ResourceForm";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";

import "../styles/admin.css";

export default function AdminResources() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const params = { page };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (type) {
          params.type = type;
        }

        const data = await fetchResources(params);

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

    const timer = setTimeout(loadResources, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, type, page, refreshKey]);

  function refreshResources() {
    setRefreshKey((previous) => previous + 1);
  }

  function openCreateForm() {
    setEditingResource(null);
    setShowForm(true);
  }

  function openEditForm(resource) {
    setEditingResource(resource);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingResource(null);
  }

  async function handleSave(data) {
    if (editingResource) {
      await updateResource(editingResource.id, data);

      toast.success("Resource updated successfully.");
    } else {
      await createResource(data);

      toast.success("Resource created successfully.");
    }

    closeForm();
    setPage(1);
    refreshResources();
  }

  async function handleToggle(resource) {
    const action = resource.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${resource.name}?`,
    );

    if (!confirmed) return;

    setToggling(resource.id);

    try {
      await updateResource(resource.id, {
        isActive: !resource.isActive,
      });

      toast.success(
        resource.isActive ? "Resource deactivated." : "Resource activated.",
      );

      refreshResources();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Manage Resources</h1>

          <p>Create, configure and manage workspace resources.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openCreateForm}
          disabled={showForm}
        >
          <Plus size={19} />
          Add resource
        </button>
      </div>

      {showForm && (
        <ResourceForm
          key={editingResource?.id || "new"}
          resource={editingResource}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Resource inventory</h3>

            <p className="muted">Manage active and inactive resources.</p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={refreshResources}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="admin-resource-filters">
          <div className="search-field">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search resources..."
              aria-label="Search resources"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            aria-label="Resource type"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All resource types</option>

            {RESOURCE_TYPES.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Loader message="Loading resource inventory..." />
        ) : error ? (
          <div>
            <div className="error-message" role="alert">
              {error}
            </div>

            <button className="btn btn-secondary" onClick={refreshResources}>
              Retry
            </button>
          </div>
        ) : !result?.data?.length ? (
          <div className="empty-state">
            <Layers size={40} />

            <h3>No resources found</h3>

            <p className="muted">Create a resource or change your filters.</p>
          </div>
        ) : (
          <>
            <div className="ticket-table-wrapper">
              <table className="ticket-table admin-resource-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {result.data.map((resource) => (
                    <tr key={resource.id}>
                      <td data-label="Resource">
                        <div className="ticket-subject">
                          <strong>{resource.name}</strong>

                          <small>
                            {resource.description || "No description"}
                          </small>
                        </div>
                      </td>

                      <td data-label="Type">{formatLabel(resource.type)}</td>

                      <td data-label="Capacity">{resource.capacity}</td>

                      <td data-label="Status">
                        <span
                          className={
                            resource.isActive
                              ? "resource-active"
                              : "resource-inactive"
                          }
                        >
                          {resource.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td data-label="Actions">
                        <div className="admin-table-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => openEditForm(resource)}
                            disabled={showForm}
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            className={
                              resource.isActive
                                ? "btn btn-danger-outline"
                                : "btn btn-outline"
                            }
                            disabled={toggling !== null || showForm}
                            onClick={() => handleToggle(resource)}
                          >
                            <Power size={15} />

                            {toggling === resource.id
                              ? "Updating..."
                              : resource.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
