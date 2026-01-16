import { useState, useCallback } from "react";
import { API_BASE_URL, useAuth } from "@/contexts/AuthContext";

export interface DashboardSummary {
  totalUsers: number;
  onlineUsers: number;
  pendingUsers: number;
  lockedUsers: number;
  messagesToday: number;
}

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: "PENDING";
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

export function useAdminApi() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": token || "",
  }), [token]);

  // GET /admin/dashboard-summary
  const getDashboardSummary = useCallback(async (): Promise<DashboardSummary | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard-summary`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard summary");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // GET /admin/pending-users
  const getPendingUsers = useCallback(async (): Promise<PendingUser[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pending-users`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch pending users");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // POST /admin/approve-user
  const approveUser = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/approve-user`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userId }),
      });
      return response.ok;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // POST /admin/lock-user
  const lockUser = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/lock-user`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userId }),
      });
      return response.ok;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // POST /admin/force-lock (kills live session)
  const forceLockUser = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/force-lock`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userId }),
      });
      return response.ok;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // GET /admin/users
  const getAllUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // GET /admin/activity
  const getActivityLog = useCallback(async (): Promise<ActivityLogEntry[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/activity`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch activity log");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  return {
    isLoading,
    error,
    getDashboardSummary,
    getPendingUsers,
    approveUser,
    lockUser,
    forceLockUser,
    getAllUsers,
    getActivityLog,
  };
}
