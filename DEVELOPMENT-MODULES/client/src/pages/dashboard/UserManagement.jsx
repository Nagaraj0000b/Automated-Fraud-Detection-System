import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Settings2, Trash2, Loader2 } from "lucide-react";
import { userAPI } from '@/services/api';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', department: 'General' });

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userAPI.getAll();
            setUsers(data.users);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await userAPI.create(newUser);
            setNewUser({ name: '', email: '', password: '', role: 'user', department: 'General' });
            setShowCreateForm(false);
            fetchUsers(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleToggleStatus = async (user) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        try {
            await userAPI.update(user._id, { status: newStatus });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await userAPI.delete(userId);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-slate-500">Loading users...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Users</h2>
                    <p className="text-slate-500">Manage dashboard access and role-based permissions.</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <UserPlus className="w-4 h-4 mr-2" /> {showCreateForm ? 'Cancel' : 'Invite User'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Create User Form */}
            {showCreateForm && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text" placeholder="Full Name" required value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            />
                            <input
                                type="email" placeholder="Email" required value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            />
                            <input
                                type="password" placeholder="Password" required value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            />
                            <select
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="analyst">Analyst</option>
                                <option value="auditor">Auditor</option>
                            </select>
                            <input
                                type="text" placeholder="Department" value={newUser.department}
                                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                                Create User
                            </button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Role</th>
                                <th className="px-6 py-3 font-medium">Department</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{u.name}</p>
                                        <p className="text-xs text-slate-500">{u.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">{u.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{u.department || 'General'}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleToggleStatus(u)}>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {u.status}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleDeleteUser(u._id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No users found</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
