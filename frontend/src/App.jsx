import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Reg";

import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import PagePlaceholder from "./components/PagePlaceholder";
import TicketQueue from "./pages/TicketQueue";
import TicketDetail from "./pages/TicketDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tickets" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/tickets" element={<TicketQueue />} />

          <Route path="/tickets/:id" element={<TicketDetail />} />

          <Route
            path="/resources"
            element={
              <PagePlaceholder
                title="Resources"
                description="Discover and reserve available resources."
              />
            }
          />

          <Route
            path="/bookings"
            element={
              <PagePlaceholder
                title="My Bookings"
                description="Track and manage your resource reservations."
              />
            }
          />

          <Route element={<ProtectedRoute adminOnly />}>
            <Route
              path="/admin/analytics"
              element={
                <PagePlaceholder
                  title="Admin Analytics"
                  description="Monitor operational performance and insights."
                />
              }
            />

            <Route
              path="/admin/resources"
              element={
                <PagePlaceholder
                  title="Manage Resources"
                  description="Create and manage workspace resources."
                />
              }
            />

            <Route
              path="/admin/bookings"
              element={
                <PagePlaceholder
                  title="Manage Bookings"
                  description="Review, approve and reject booking requests."
                />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
