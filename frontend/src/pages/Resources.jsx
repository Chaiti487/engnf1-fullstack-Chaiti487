import { useEffect, useState } from "react";
import { Search, Layers, RotateCcw } from "lucide-react";

import { fetchResources } from "../api/resource.api";
import { RESOURCE_TYPES } from "../utils/bookingConstants";

import { formatLabel, getErrorMessage } from "../utils/ticketConstants";

import ResourceCard from "../components/ResourceCard";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";

import "../styles/resources.css";

const initialFilters = {
  search: "",
  type: "",
  minCapacity: "",
};

export default function Resources() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const params = { page };

        if (filters.search.trim()) {
          params.search = filters.search.trim();
        }

        if (filters.type) {
          params.type = filters.type;
        }

        if (filters.minCapacity) {
          params.minCapacity = Number(filters.minCapacity);
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
  }, [filters, page, retryKey]);

  function handleChange(event) {
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

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Resources</h1>
          <p>Discover and reserve workspace resources.</p>
        </div>
      </div>

      <section className="panel resource-filter-panel">
        <div className="resource-filters">
          <div className="search-field">
            <Search size={18} />

            <input
              type="search"
              name="search"
              aria-label="Search resources"
              placeholder="Search resources..."
              value={filters.search}
              onChange={handleChange}
            />
          </div>

          <select
            name="type"
            aria-label="Resource type"
            value={filters.type}
            onChange={handleChange}
          >
            <option value="">All resource types</option>

            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="minCapacity"
            aria-label="Minimum capacity"
            placeholder="Minimum capacity"
            min="1"
            max="500"
            value={filters.minCapacity}
            onChange={handleChange}
          />

          <button className="btn btn-secondary" onClick={resetFilters}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </section>

      {loading ? (
        <Loader message="Loading resources..." />
      ) : error ? (
        <div className="panel">
          <div className="error-message" role="alert">
            {error}
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setRetryKey((previous) => previous + 1)}
          >
            Retry
          </button>
        </div>
      ) : !result?.data?.length ? (
        <div className="panel empty-state">
          <Layers size={40} />

          <h3>No resources found</h3>

          <p className="muted">Try changing your search or filters.</p>

          <button className="btn btn-secondary" onClick={resetFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="resource-results-heading">
            <h3>Available resources</h3>

            <span className="muted">{result.total} resources found</span>
          </div>

          <div className="resource-grid">
            {result.data.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
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
