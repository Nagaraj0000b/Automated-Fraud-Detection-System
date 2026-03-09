import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, ArrowUpDown } from "lucide-react";

export default function TransactionMonitoring() {
    const transactions = [
        { id: "TXN-8921", user: "john_doe", amount: "$1,250.00", date: "2024-03-12 14:22", status: "Approved", risk: "Low" },
        { id: "TXN-8922", user: "jane_smith", amount: "$8,500.00", date: "2024-03-12 14:25", status: "Review", risk: "High" },
        { id: "TXN-8923", user: "anon_99", amount: "$12.50", date: "2024-03-12 14:28", status: "Rejected", risk: "Critical" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transaction Monitoring</h2>
                    <p className="text-slate-500">Real-time view of all system transactions.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex items-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md max-w-sm">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input type="text" placeholder="Search transactions..." className="bg-transparent border-none outline-none text-sm w-full" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Transaction ID</th>
                                    <th className="px-6 py-3 font-medium">User</th>
                                    <th className="px-6 py-3 font-medium flex items-center">Amount <ArrowUpDown className="w-3 h-3 ml-1" /></th>
                                    <th className="px-6 py-3 font-medium">Date & Time</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Risk Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{txn.id}</td>
                                        <td className="px-6 py-4 text-slate-600">{txn.user}</td>
                                        <td className="px-6 py-4 font-medium">{txn.amount}</td>
                                        <td className="px-6 py-4 text-slate-500">{txn.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${txn.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    txn.status === 'Review' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${txn.risk === 'Low' ? 'bg-slate-100 text-slate-700' :
                                                    txn.risk === 'High' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {txn.risk}
                                            </span>
                                        </td>
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
