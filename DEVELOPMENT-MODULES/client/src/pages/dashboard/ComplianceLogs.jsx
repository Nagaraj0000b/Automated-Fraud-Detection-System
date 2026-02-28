import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";

export default function ComplianceLogs() {
    const logs = [
        { time: "2024-03-12 14:05:22", action: "Rule Updated", actor: "admin_david", target: "Velocity Check Rule", result: "Success" },
        { time: "2024-03-12 11:30:00", action: "Model Retrained", actor: "system", target: "Account Takeover Net", result: "Success" },
        { time: "2024-03-11 09:15:45", action: "User Suspended", actor: "admin_sarah", target: "user_id_4921", result: "Success" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Compliance & Audit Logs</h2>
                    <p className="text-slate-500">Immutable record of system changes and administrative actions.</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                </button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Timestamp</th>
                                    <th className="px-6 py-3 font-medium">Action</th>
                                    <th className="px-6 py-3 font-medium">Actor</th>
                                    <th className="px-6 py-3 font-medium">Target</th>
                                    <th className="px-6 py-3 font-medium">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.time}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                                        <td className="px-6 py-4 text-slate-600">{log.actor}</td>
                                        <td className="px-6 py-4 text-slate-600">{log.target}</td>
                                        <td className="px-6 py-4 text-emerald-600 font-medium">{log.result}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
