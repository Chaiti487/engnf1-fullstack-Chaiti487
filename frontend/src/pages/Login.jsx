import { useState } from "react";

import { Link, Navigate, useNavigate } from "react-router-dom";

import { Activity, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";

import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import Loader from "../components/Loader";

export default function Login() {
  const { login, user, loading } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  if (loading) {
    return <Loader />;
  }

  if (user) {
    return <Navigate to="/tickets" replace />;
  }

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      await login(form);

      toast.success("Welcome to TriageSync!");

      navigate("/tickets", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(role) {
    setError("");

    setForm(
      role === "ADMIN"
        ? {
            email: "admin@triagesync.test",
            password: "Admin@123",
          }
        : {
            email: "user@triagesync.test",
            password: "User@123",
          },
    );
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={24} />
          </div>
          TriageSync
        </div>

        <div className="auth-brand-content">
          <span className="eyebrow">INTELLIGENT OPERATIONS</span>

          <h1>
            Smarter triage.
            <br />
            <span>Seamless booking.</span>
          </h1>

          <p>
            One workspace for intelligent ticket management and efficient
            resource scheduling.
          </p>

          <div className="auth-features">
            {[
              "Intelligent ticket classification",
              "Conflict-free resource scheduling",
              "Actionable operational insights",
            ].map((feature) => (
              <div key={feature}>
                <CheckCircle2 size={18} />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <small>TriageSync · Operations Management Platform</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrapper">
          <h2>Welcome back</h2>

          <p className="muted">Sign in to your TriageSync workspace.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary full-width"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}

              <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create account</Link>
          </p>

          <div className="demo-section">
            <p>Explore with demo credentials</p>

            <div className="demo-buttons">
              <button
                className="btn btn-outline"
                onClick={() => fillDemo("USER")}
                disabled={submitting}
              >
                Demo User
              </button>

              <button
                className="btn btn-outline"
                onClick={() => fillDemo("ADMIN")}
                disabled={submitting}
              >
                Demo Admin
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
