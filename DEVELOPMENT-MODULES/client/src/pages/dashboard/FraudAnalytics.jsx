import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";

export default function FraudAnalytics() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Fraud Pattern Analytics</h2>
                <p className="text-slate-500">Visualizing detected anomalies and fraud vectors.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="min-h-[300px]">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg"><TrendingUp className="w-5 h-5 mr-2 text-blue-500" /> Fraud Attempts over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-56 text-slate-400 border border-dashed border-slate-200 m-4 mt-0 rounded-lg bg-slate-50">
                        [ Bar Chart: Fraud vs Valid Volumes ]
                    </CardContent>
                </Card>
                <Card className="min-h-[300px]">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg"><PieChart className="w-5 h-5 mr-2 text-purple-500" /> Fraud by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-56 text-slate-400 border border-dashed border-slate-200 m-4 mt-0 rounded-lg bg-slate-50">
                        [ Pie Chart: Account Takeover, Stolen CC, etc ]
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
