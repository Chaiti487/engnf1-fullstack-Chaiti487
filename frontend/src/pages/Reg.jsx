import { useState } from "react";

import { Link, Navigate, useNavigate } from "react-router-dom";

import { Activity, ArrowRight } from "lucide-react";

import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import Loader from "../components/Loader";

export default function Register() {
  const { register, user, loading } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

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

    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (
      form.password.length < 8 ||
      !/[a-zA-Z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      setError(
        "Password must contain at least 8 characters, a letter and a number.",
      );
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      toast.success("Account created successfully!");

      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
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
          <span className="eyebrow">YOUR PRODUCTIVE WORKSPACE</span>

          <h1>
            Better workflows.
            <br />
            <span>Better decisions.</span>
          </h1>

          <p>
            Join a unified platform for ticket triage, resource scheduling and
            operational clarity.
          </p>
        </div>

        <small>TriageSync · Operations Management Platform</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrapper">
          <h2>Create your account</h2>

          <p className="muted">Get started with your new workspace.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Full name</label>

              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                minLength={2}
                maxLength={50}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                autoComplete="new-password"
                minLength={8}
                maxLength={64}
                required
              />

              <small className="muted">
                Minimum 8 characters, including a letter and a number.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              className="btn btn-primary full-width"
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "Create account"}

              <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
