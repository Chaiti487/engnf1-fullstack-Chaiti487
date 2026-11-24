import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import {
  fetchTickets,
  fetchTicketStats,
  importTickets,
} from "../api/ticket.api";

import TicketStats from "../components/TicketStats";
import TicketFilters from "../components/TicketFilters";
import TicketTable from "../components/TicketTable";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";

import { ticketFeed } from "../data/ticketFeed";
import { getErrorMessage } from "../utils/ticketConstants";

import "../styles/tickets.css";

const initialFilters = {
  q: "",
  status: "",
  category: "",
  priority: "",
};

export default function TicketQueue() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit: 10,
        };

        Object.entries(filters).forEach(([key, value]) => {
          if (value.trim()) {
            params[key] = value.trim();
          }
        });

        const data = await fetchTickets(params);

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

    const timer = setTimeout(loadTickets, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, page, refreshKey]);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const data = await fetchTicketStats();

        if (active) {
          setStats(data);
        }
      } catch (err) {
        if (active) {
          setStatsError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setStatsLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  function handleFilterChange(name, value) {
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

  async function handleImport() {
    setImporting(true);

    try {
      const summary = await importTickets(ticketFeed);

      toast.success(
        `Imported: ${summary.importedCount} | ` +
          `Updated: ${summary.updatedCount} | ` +
          `Overrides protected: ${summary.skippedOverrideCount}`,
        { duration: 5000 },
      );

      setPage(1);
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }

  function refresh() {
    setRefreshKey((previous) => previous + 1);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Ticket Triage</h1>
          <p>Classify, review and resolve incoming tickets.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={importing}
        >
          <RefreshCw size={17} className={importing ? "spinner" : ""} />

          {importing ? "Importing feed..." : "Re-Import Feed"}
        </button>
      </div>

      {statsLoading ? (
        <Loader message="Loading statistics..." />
      ) : statsError ? (
        <div className="error-message">
          {statsError}

          <button className="btn btn-secondary" onClick={refresh}>
            Retry
          </button>
        </div>
      ) : (
        <TicketStats stats={stats} />
      )}

      <section className="panel ticket-panel">
        <div className="section-heading">
          <div>
            <h3>Incoming tickets</h3>
            <p className="muted">Manage your ticket review workflow.</p>
          </div>
        </div>

        <TicketFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
        />

        {loading ? (
          <Loader message="Loading tickets..." />
        ) : error ? (
          <div className="error-message" role="alert">
            <p>{error}</p>

            <button className="btn btn-secondary" onClick={refresh}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <TicketTable tickets={result?.data || []} />

            <Pagination
              page={page}
              totalPages={result?.totalPages || 0}
              total={result?.total || 0}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </>
  );
}
