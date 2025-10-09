import Login from "@/pages/Login.tsx";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import Register from "@/pages/Register.tsx";

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route path="/register" element={user ? <Login /> : <Register />} />
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="*"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
