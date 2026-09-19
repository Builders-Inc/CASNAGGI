import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "./AdminLayout";
import Login from "./pages/Login";
import EventList from "./pages/EventList";
import EventEditor from "./pages/EventEditor";
import Inbox from "./pages/Inbox";
import AdminNotFound from "./pages/AdminNotFound";

/**
 * The whole admin area, loaded as its own chunk so public visitors never
 * download it. That is a bundle-size win, not a security boundary -- every
 * permission check happens on the server.
 */
const AdminApp = () => (
  <AuthProvider>
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/events" replace />} />
        <Route path="events" element={<EventList />} />
        <Route path="events/new" element={<EventEditor />} />
        <Route path="events/:id/edit" element={<EventEditor />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="*" element={<AdminNotFound />} />
      </Route>
    </Routes>
  </AuthProvider>
);

export default AdminApp;
