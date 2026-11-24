import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Reg";

import TicketQueue from "./pages/TicketQueue";
import TicketDetail from "./pages/TicketDetail";

import Resources from "./pages/Resources";
import ResourceDetail from "./pages/ResourceDetail";

import MyBookings from "./pages/MyBookings";

import AdminResources from "./pages/AdminResources";
import AdminBookings from "./pages/AdminBookings";

import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";



import { lazy, Suspense } from "react";
import Loader from "./components/Loader";

const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));

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

          <Route path="/resources" element={<Resources />} />

          <Route path="/resources/:id" element={<ResourceDetail />} />

          <Route path="/bookings" element={<MyBookings />} />

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/resources" element={<AdminResources />} />

            <Route path="/admin/bookings" element={<AdminBookings />} />

            <Route
              path="/admin/analytics"
              element={
                <Suspense
                  fallback={<Loader message="Loading analytics dashboard..." />}
                >
                  <AdminAnalytics />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
