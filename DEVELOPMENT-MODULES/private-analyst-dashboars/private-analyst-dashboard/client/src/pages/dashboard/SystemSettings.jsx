import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Save, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { settingAPI } from '@/services/api';

export default function SystemSettings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await settingAPI.getSettings();
            if (response.success) {
                setSettings(response.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load system settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        if (e) e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            const response = await settingAPI.updateSettings(settings);
            if (response.success) {
                setSettings(response.data);
                setMessage({ type: 'success', text: 'Settings updated successfully.' });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    const toggleBoolean = (field) => {
        setSettings({ ...settings, [field]: !settings[field] });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h2>
                    <p className="text-slate-500">Global system controls and preferences.</p>
                </div>
                <button 
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                    {message.text}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center"><Bell className="w-5 h-5 mr-2 text-slate-500" /> Alert Preferences</CardTitle>
                        <CardDescription>Configure how you receive critical notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                                <p className="text-xs text-slate-500">Receive daily summary digests.</p>
                            </div>
                            <div 
                                onClick={() => toggleBoolean('emailNotifications')}
                                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.emailNotifications ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.emailNotifications ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Critical SMS Alerts</p>
                                <p className="text-xs text-slate-500">For catastrophic system failures.</p>
                            </div>
                            <div 
                                onClick={() => toggleBoolean('smsAlerts')}
                                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.smsAlerts ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.smsAlerts ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-100 bg-red-50/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center text-red-900"><ShieldAlert className="w-5 h-5 mr-2 text-red-600" /> System Maintenance</CardTitle>
                        <CardDescription className="text-red-700/70">Disable all public API access and user interactions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-900">Maintenance Mode Lock</p>
                                <p className="text-xs text-red-700/70">Only admins will have access when enabled.</p>
                            </div>
                            <div 
                                onClick={() => toggleBoolean('maintenanceMode')}
                                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-red-600' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
