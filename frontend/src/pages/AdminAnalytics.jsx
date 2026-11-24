import { useEffect, useState } from "react";

import {
  Layers,
  CalendarDays,
  Ticket,
  Target,
  RefreshCw,
  BarChart3,
} from "lucide-react";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { fetchAdminStats } from "../api/admin.api";

import { formatLabel, getErrorMessage } from "../utils/ticketConstants";

import Loader from "../components/Loader";

import "../styles/analytics.css";

const STATUS_COLORS = {
  PENDING: "#d97706",
  APPROVED: "#0f766e",
  REJECTED: "#dc2626",
  CANCELLED: "#94a3b8",
};

function toChartData(values = {}) {
  return Object.entries(values).map(([key, value]) => ({
    name: formatLabel(key),
    status: key,
    value,
  }));
}

function MetricCard({ label, value, description, icon: Icon }) {
  return (
    <article className="analytics-metric">
      <div className="analytics-metric-icon">
        <Icon size={22} />
      </div>

      <p>{label}</p>

      <h2>{value}</h2>

      <small>{description}</small>
    </article>
  );
}

function DistributionChart({ title, description, data, color }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="panel analytics-chart">
      <h3>{title}</h3>

      <p className="muted">{description}</p>

      {total === 0 ? (
        <div className="analytics-empty">
          <BarChart3 size={32} />
          <p>No data available</p>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e2e8f0"
              />

              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11 }}
              />

              <Tooltip />

              <Bar
                dataKey="value"
                name="Count"
                fill={color}
                radius={[0, 5, 5, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchAdminStats();

        if (active) {
          setStats(data);
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

    loadStats();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  function refreshStats() {
    setRefreshKey((previous) => previous + 1);
  }

  const ticketStats = stats?.ticketStats || {};

  const bookingData = toChartData(stats?.bookingsByStatus);

  const categoryData = toChartData(ticketStats.byCategory);

  const priorityData = toChartData(ticketStats.byPriority);

  const statusData = toChartData(ticketStats.byStatus);

  const totalBookings = bookingData.reduce((sum, item) => sum + item.value, 0);

  const totalTickets = categoryData.reduce((sum, item) => sum + item.value, 0);

  const topResources = stats?.topResources || [];

  const maxBookings = Math.max(
    1,
    ...topResources.map((resource) => resource.bookingCount),
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Admin Analytics</h1>

          <p>Monitor operational performance and resource booking activity.</p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={refreshStats}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh analytics
        </button>
      </div>

      {loading ? (
        <Loader message="Loading analytics..." />
      ) : error ? (
        <section className="panel">
          <div className="error-message" role="alert">
            {error}
          </div>

          <button className="btn btn-secondary" onClick={refreshStats}>
            Retry
          </button>
        </section>
      ) : !stats ? (
        <section className="panel empty-state">
          <BarChart3 size={40} />
          <h3>No analytics available</h3>
        </section>
      ) : (
        <>
          <div className="analytics-metrics">
            <MetricCard
              label="Active resources"
              value={stats.activeResources}
              description="Available resource inventory"
              icon={Layers}
            />

            <MetricCard
              label="Total bookings"
              value={totalBookings}
              description="All reservation requests"
              icon={CalendarDays}
            />

            <MetricCard
              label="Total tickets"
              value={totalTickets}
              description={`${ticketStats.reviewedCount || 0} tickets reviewed`}
              icon={Ticket}
            />

            <MetricCard
              label="Model agreement"
              value={`${ticketStats.modelAgreementRate || 0}%`}
              description="Agent and model category agreement"
              icon={Target}
            />
          </div>

          <div className="analytics-section-heading">
            <h2>Resource operations</h2>
            <p className="muted">Reservation activity and resource demand.</p>
          </div>

          <div className="analytics-grid">
            <section className="panel analytics-chart">
              <h3>Booking status distribution</h3>

              <p className="muted">Overview of the booking lifecycle.</p>

              {totalBookings === 0 ? (
                <div className="analytics-empty">
                  <CalendarDays size={32} />
                  <p>No bookings recorded yet</p>
                </div>
              ) : (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={bookingData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {bookingData.map((item) => (
                          <Cell
                            key={item.status}
                            fill={STATUS_COLORS[item.status]}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="analytics-legend">
                {bookingData.map((item) => (
                  <div className="analytics-legend-item" key={item.status}>
                    <span
                      className="analytics-legend-dot"
                      style={{
                        backgroundColor: STATUS_COLORS[item.status],
                      }}
                    />

                    <span>{item.name}</span>

                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel analytics-chart">
              <h3>Top requested resources</h3>

              <p className="muted">Top three resources by booking volume.</p>

              {!topResources.length ? (
                <div className="analytics-empty">
                  <Layers size={32} />
                  <p>No resource activity yet</p>
                </div>
              ) : (
                <div className="top-resources-list">
                  {topResources.map((resource, index) => (
                    <div
                      className="top-resource-item"
                      key={resource.resourceId}
                    >
                      <div className="top-resource-header">
                        <div className="resource-rank">{index + 1}</div>

                        <div className="top-resource-name">
                          <strong>{resource.name}</strong>

                          <small>{formatLabel(resource.type)}</small>
                        </div>

                        <strong>{resource.bookingCount}</strong>
                      </div>

                      <div className="resource-progress-track">
                        <div
                          className="resource-progress-fill"
                          style={{
                            width: `${
                              (resource.bookingCount / maxBookings) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="analytics-section-heading">
            <h2>Ticket intelligence</h2>

            <p className="muted">
              Classification, priority and review performance.
            </p>
          </div>

          <div className="analytics-grid">
            <DistributionChart
              title="Tickets by category"
              description="Current ticket classifications"
              data={categoryData}
              color="#0f766e"
            />

            <DistributionChart
              title="Tickets by priority"
              description="Distribution of ticket urgency"
              data={priorityData}
              color="#d97706"
            />

            <DistributionChart
              title="Tickets by status"
              description="Current ticket workflow stages"
              data={statusData}
              color="#2563eb"
            />

            <section className="panel analytics-chart">
              <h3>Human review coverage</h3>

              <p className="muted">Tickets reviewed by agents.</p>

              <div className="review-coverage">
                <h2>
                  {totalTickets
                    ? (
                        ((ticketStats.reviewedCount || 0) / totalTickets) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </h2>

                <p>Review coverage</p>

                <div className="resource-progress-track">
                  <div
                    className="resource-progress-fill"
                    style={{
                      width: `${
                        totalTickets
                          ? ((ticketStats.reviewedCount || 0) / totalTickets) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <small className="muted">
                  {ticketStats.reviewedCount || 0} of {totalTickets} tickets
                  reviewed
                </small>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
