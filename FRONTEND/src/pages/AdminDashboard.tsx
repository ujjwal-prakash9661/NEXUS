
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Lock, Activity, ShieldAlert, LogOut } from "lucide-react";
import { toast } from 'sonner';

export default function AdminDashboard() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    // --- Queries ---
    const { data: summary } = useQuery({
        queryKey: ['adminSummary'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/admin/dashboard-summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        }
    });

    const { data: pendingUsers } = useQuery({
        queryKey: ['pendingUsers'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/admin/pending-users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        }
    });

    const { data: allUsers } = useQuery({
        queryKey: ['allUsers'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        }
    });

    const { data: activity } = useQuery({
        queryKey: ['activityLog'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/admin/activity`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        }
    });


    // --- Mutations ---
    const approveMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`${API_BASE_URL}/admin/approve-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) throw new Error("Failed to approve");
            return res.json();
        },
        onSuccess: () => {
            toast.success("User Approved");
            queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
            queryClient.invalidateQueries({ queryKey: ['adminSummary'] });
        }
    });

    const lockMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`${API_BASE_URL}/admin/lock-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId })
            });
            return res.json();
        },
        onSuccess: () => {
            toast.warning("User Locked");
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        }
    });

    const forceLockMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`${API_BASE_URL}/admin/force-lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId })
            });
            return res.json();
        },
        onSuccess: () => {
            toast.error("User Forcefully Terminated");
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        }
    });

    return (
        <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Admin Command Center
                    </h1>
                    <p className="text-slate-400">System Oversight & User Management</p>
                </div>
                <Badge variant="outline" className="px-4 py-1 border-blue-500/50 text-blue-400 bg-blue-500/10">
                    SUPER_ADMIN
                </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: "Total Users", value: summary?.totalUsers || 0, icon: Users, color: "text-blue-400" },
                    { title: "Online Now", value: summary?.onlineUsers || 0, icon: Activity, color: "text-green-400" },
                    { title: "Pending Approval", value: summary?.pendingUsers || 0, icon: UserCheck, color: "text-amber-400" },
                    { title: "Locked Accounts", value: summary?.lockedUsers || 0, icon: Lock, color: "text-red-400" },
                ].map((item, i) => (
                    <Card key={i} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-400">{item.title}</p>
                                <div className="text-2xl font-bold mt-1 text-white">{item.value}</div>
                            </div>
                            <item.icon className={`h-8 w-8 ${item.color} opacity-80`} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-slate-900 p-1 border border-slate-800">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600">Pending Approvals</TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">User Management</TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600">Audit Logs</TabsTrigger>
                </TabsList>

                {/* Pending Users Tab */}
                <TabsContent value="pending" className="mt-6 space-y-4">
                    {pendingUsers?.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800 border-dashed">
                            No pending user requests
                        </div>
                    ) : (
                        pendingUsers?.map((user: any) => (
                            <Card key={user._id} className="bg-slate-900/80 border-slate-800 flex justify-between items-center p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
                                        {user.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-100">{user.name}</h3>
                                        <p className="text-sm text-slate-400">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">Deny</Button>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => approveMutation.mutate(user._id)}
                                    >
                                        Approve Access
                                    </Button>
                                </div>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* All Users Tab */}
                <TabsContent value="users" className="mt-6">
                    <div className="grid gap-4">
                        {allUsers?.map((user: any) => (
                            <Card key={user._id} className="bg-slate-900/50 border-slate-800 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-slate-500'}`} />
                                    <div>
                                        <div className="font-medium text-slate-200 flex items-center gap-2">
                                            {user.name}
                                            {user.role === 'ADMIN' && <Badge variant="secondary" className="text-[10px] h-5">ADMIN</Badge>}
                                            {user.status === 'LOCKED' && <Badge variant="destructive" className="text-[10px] h-5">LOCKED</Badge>}
                                        </div>
                                        <div className="text-xs text-slate-500">{user.email} • ID: {user.nexusId}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {user.status === 'LOCKED' ? (
                                        <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(user._id)}>Unlock</Button>
                                    ) : (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                                                onClick={() => lockMutation.mutate(user._id)}
                                            >
                                                <Lock className="w-4 h-4 mr-1" /> Lock
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="bg-red-900/50 hover:bg-red-900 border border-red-800"
                                                onClick={() => forceLockMutation.mutate(user._id)}
                                            >
                                                <ShieldAlert className="w-4 h-4 mr-1" /> Kill Session
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-0">
                            {activity?.map((log: any, i: number) => (
                                <div key={i} className="p-4 border-b border-slate-800 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium text-slate-300">{log.name}</span>
                                        <span className="text-xs text-slate-500">last active {new Date(log.lastSeen).toLocaleTimeString()}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${log.online ? 'bg-green-500' : 'bg-slate-600'}`} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}
