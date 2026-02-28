import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Shield, ShieldCheck } from "lucide-react";

export default function RiskRules() {
    const rules = [
        { name: "Velocity Check - High Frequency", desc: "Blocks users making >10 transactions in 5 minutes", status: true, severity: "High" },
        { name: "IP Geo-Velocity", desc: "Flags logins from two distant countries within 1 hour", status: true, severity: "Critical" },
        { name: "New Device Large Transfer", desc: "Requires 2FA for >$10k on unseen devices", status: false, severity: "Medium" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Risk Rules Management</h2>
                    <p className="text-slate-500">Configure and toggle automated fraud detection heuristics.</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> New Rule
                </button>
            </div>

            <div className="grid gap-4">
                {rules.map((rule, i) => (
                    <Card key={i}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-start space-x-4">
                                <div className={`p-2 rounded-full mt-1 ${rule.status ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                    {rule.status ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <Shield className="w-5 h-5 text-slate-400" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                                        {rule.name}
                                        <span className={`ml-3 px-2 py-0.5 rounded text-xs font-medium ${rule.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                                rule.severity === 'High' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {rule.severity}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">{rule.desc}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${rule.status ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${rule.status ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
