import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Zap } from "lucide-react";

export default function ModelPerformance() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Model Performance Metrics</h2>
                <p className="text-slate-500">In-depth statistical evaluation of AI classifiers.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 flex items-center font-medium"><Target className="w-4 h-4 mr-2" /> Precision</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-slate-900">97.2%</div></CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 flex items-center font-medium"><Activity className="w-4 h-4 mr-2" /> Recall</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-slate-900">94.8%</div></CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 flex items-center font-medium"><Zap className="w-4 h-4 mr-2" /> F1 Score</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-slate-900">95.9%</div></CardContent>
                </Card>
            </div>
            <Card className="min-h-[300px]">
                <CardHeader><CardTitle>ROC Curve</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center h-72 text-slate-400 border border-dashed border-slate-200 m-4 mt-0 rounded-lg bg-slate-50">
                    [ True Positive Rate vs False Positive Rate Graph ]
                </CardContent>
            </Card>
        </div>
    );
}
