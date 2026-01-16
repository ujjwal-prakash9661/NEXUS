
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const AdminRoute = () => {
    const { user, token } = useAuth();

    if (!token) return <Navigate to="/login" replace />;

    // Allow SUPER_ADMIN and ADMIN
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
        return <Navigate to="/dashboard" />;
    }

    return <Outlet />;
};
