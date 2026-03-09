import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Play, Square, RefreshCw } from "lucide-react";

export default function ModelManagement() {
    const models = [
        { name: "Transaction Classifier v2.1", type: "Random Forest", status: "Active", accuracy: "98.4%" },
        { name: "Account Takeover Net", type: "Neural Network", status: "Active", accuracy: "96.7%" },
        { name: "Geo-Anomaly Detector", type: "Isolation Forest", status: "Training", accuracy: "--" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">AI Model Management</h2>
                    <p className="text-slate-500">Deploy, monitor, and retrain machine learning models.</p>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {models.map((m, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <BrainCircuit className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg" />
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {m.status}
                                </span>
                            </div>
                            <CardTitle className="mt-4 text-lg">{m.name}</CardTitle>
                            <p className="text-sm text-slate-500">{m.type}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                                <div className="text-sm">
                                    <span className="text-slate-500">Accuracy: </span>
                                    <span className="font-semibold">{m.accuracy}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <button className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><RefreshCw className="w-4 h-4" /></button>
                                    {m.status === 'Active' ?
                                        <button className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Square className="w-4 h-4" /></button> :
                                        <button className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"><Play className="w-4 h-4" /></button>
                                    }
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
