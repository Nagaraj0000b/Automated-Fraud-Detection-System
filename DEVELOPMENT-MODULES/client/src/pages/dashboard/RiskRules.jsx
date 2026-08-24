import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ShieldPlus, Trash2, Loader2, BrainCircuit } from "lucide-react";
import { riskRuleAPI } from '@/services/api';

const TARGET_FIELDS = ['amount', 'transactionType', 'recipient', 'location', 'description'];
const OPERATORS = ['>', '>=', '<', '<=', '==', '!=', 'contains'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const ACTIONS = ['flag', 'block'];

const SEVERITY_STYLES = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-orange-50 text-orange-700',
    critical: 'bg-red-50 text-red-700',
};

const ACTION_STYLES = {
    flag: 'bg-amber-50 text-amber-700',
    block: 'bg-red-50 text-red-700',
};

const emptyForm = { name: '', description: '', targetField: 'amount', operator: '>', value: '', action: 'flag', severity: 'medium' };

export default function RiskRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const data = await riskRuleAPI.getRules();
            setRules(data.rules || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch risk rules');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const value = form.targetField === 'amount' ? Number(form.value) : form.value;
            await riskRuleAPI.createRule({ ...form, value });
            setForm(emptyForm);
            setShowCreateForm(false);
            fetchRules();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create risk rule');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (rule) => {
        try {
            await riskRuleAPI.toggleRule(rule._id, !rule.enabled);
            fetchRules();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update risk rule');
        }
    };

    const handleDelete = async (ruleId) => {
        if (!window.confirm('Are you sure you want to delete this risk rule?')) return;
        try {
            await riskRuleAPI.deleteRule(ruleId);
            fetchRules();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete risk rule');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-slate-500">Loading risk rules...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-blue-600" /> Risk Rules
                    </h2>
                    <p className="text-slate-500">Configure the heuristics that automatically flag or block transactions.</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <ShieldPlus className="w-4 h-4 mr-2" /> {showCreateForm ? 'Cancel' : 'New Rule'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                    {error}
                </div>
            )}

            {showCreateForm && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-1">New Risk Rule</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            e.g. <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">IF amount &gt; 5000 THEN block</span>
                        </p>
                        <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text" placeholder="Rule name" required value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 md:col-span-3"
                            />
                            <input
                                type="text" placeholder="Description (optional)" value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 md:col-span-3"
                            />
                            <select
                                value={form.targetField}
                                onChange={(e) => setForm({ ...form, targetField: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            >
                                {TARGET_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <select
                                value={form.operator}
                                onChange={(e) => setForm({ ...form, operator: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            >
                                {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                            </select>
                            <input
                                type="text" placeholder="Value / threshold" required value={form.value}
                                onChange={(e) => setForm({ ...form, value: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            />
                            <select
                                value={form.action}
                                onChange={(e) => setForm({ ...form, action: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            >
                                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <select
                                value={form.severity}
                                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                            >
                                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Create Rule'}
                            </button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">Rule</th>
                                <th className="px-6 py-3 font-medium">Condition</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                                <th className="px-6 py-3 font-medium">Severity</th>
                                <th className="px-6 py-3 font-medium">Enabled</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map((r) => (
                                <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{r.name}</p>
                                        {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                        {r.targetField} {r.operator} {String(r.value)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${ACTION_STYLES[r.action] || 'bg-slate-100 text-slate-600'}`}>{r.action}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${SEVERITY_STYLES[r.severity] || 'bg-slate-100 text-slate-600'}`}>{r.severity}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleToggle(r)}>
                                            <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${r.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${r.enabled ? 'left-6' : 'left-1'}`}></div>
                                            </div>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(r._id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rules.length === 0 && (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No risk rules configured yet. Transactions fall back to the default amount thresholds.</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
