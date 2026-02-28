import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Key, Bell } from "lucide-react";

export default function SystemSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h2>
                <p className="text-slate-500">Global configurations and integration parameters.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center"><Key className="w-5 h-5 mr-2 text-slate-500" /> API Configurations</CardTitle>
                        <CardDescription>Manage your backend integration keys.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Production API Key</label>
                            <div className="flex mt-1">
                                <input type="password" value="sk_live_1234567890abcdef" readOnly className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-l-md text-sm text-slate-500 outline-none" />
                                <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-r-md hover:bg-slate-800 transition-colors">Reveal</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Webhook URL</label>
                            <input type="text" defaultValue="https://api.yourdomain.com/webhooks/fraud" className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 transition-colors" />
                        </div>
                    </CardContent>
                </Card>

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
                            <div className="w-11 h-6 rounded-full bg-blue-600 relative cursor-pointer transition-colors">
                                <div className="absolute top-1 left-6 w-4 h-4 bg-white rounded-full transition-transform"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Critical SMS Alerts</p>
                                <p className="text-xs text-slate-500">For catastrophic system failures.</p>
                            </div>
                            <div className="w-11 h-6 rounded-full bg-slate-200 relative cursor-pointer transition-colors">
                                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
